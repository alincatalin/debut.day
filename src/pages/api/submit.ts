import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

const MAX_REQUEST_BYTES = 24 * 1024 * 1024;
const MAX_ICON_BYTES = 2 * 1024 * 1024;
const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;
const MAX_SCREENSHOTS = 5;

const FIELD_LIMITS = {
  name: 60,
  tagline: 90,
  description: 1200,
  storeUrl: 2048,
  makerName: 60,
  makerEmail: 254,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PreparedImage {
  bytes: ArrayBuffer;
  contentType: "image/png" | "image/webp";
  extension: "png" | "webp";
  size: number;
}

class FormError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export const POST: APIRoute = async ({ request }) => {
  const uploadedKeys: string[] = [];
  let campaignSource: "shipaton" | null = null;

  try {
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > MAX_REQUEST_BYTES) {
      throw new FormError("The submission is too large. Please use smaller images.", 413);
    }

    const formData = await request.formData();
    const honeypot = text(formData, "companyWebsite");
    campaignSource = text(formData, "campaignSource") === "shipaton" ? "shipaton" : null;

    // Silently accept bot submissions without writing them.
    if (honeypot) return success(request, crypto.randomUUID(), campaignSource);

    const name = requiredText(formData, "name", "App name", FIELD_LIMITS.name);
    const tagline = requiredText(formData, "tagline", "Tagline", FIELD_LIMITS.tagline);
    const description = requiredText(
      formData,
      "description",
      "Description",
      FIELD_LIMITS.description,
    );
    const platform = requiredText(formData, "platform", "Platform", 10);
    const releaseDate = requiredText(formData, "releaseDate", "Release date", 10);
    const storeUrlIos = optionalText(formData, "storeUrlIos", "App Store URL", FIELD_LIMITS.storeUrl);
    const storeUrlAndroid = optionalText(
      formData,
      "storeUrlAndroid",
      "Play Store URL",
      FIELD_LIMITS.storeUrl,
    );
    const makerName = optionalText(formData, "makerName", "Maker name", FIELD_LIMITS.makerName);
    const makerEmail = requiredText(
      formData,
      "makerEmail",
      "Contact email",
      FIELD_LIMITS.makerEmail,
    ).toLowerCase();

    if (!isPlatform(platform)) throw new FormError("Choose a valid platform.");
    if (!isIsoDate(releaseDate)) throw new FormError("Choose a valid release date.");
    if (!EMAIL_PATTERN.test(makerEmail)) throw new FormError("Enter a valid contact email.");
    if (storeUrlIos && !isHttpsUrl(storeUrlIos)) {
      throw new FormError("Enter a valid HTTPS App Store URL.");
    }
    if (storeUrlAndroid && !isHttpsUrl(storeUrlAndroid)) {
      throw new FormError("Enter a valid HTTPS Play Store URL.");
    }

    const iconValue = formData.get("icon");
    if (!(iconValue instanceof File) || iconValue.size === 0) {
      throw new FormError("An app icon is required.");
    }

    const screenshotFiles = formData
      .getAll("screenshots")
      .filter((value): value is File => value instanceof File && value.size > 0);
    if (screenshotFiles.length > MAX_SCREENSHOTS) {
      throw new FormError(`Please submit at most ${MAX_SCREENSHOTS} screenshots.`);
    }

    const icon = await prepareImage(iconValue, "Icon", MAX_ICON_BYTES);
    const screenshots = await Promise.all(
      screenshotFiles.map((file) => prepareImage(file, "Screenshot", MAX_SCREENSHOT_BYTES)),
    );

    const submissionId = crypto.randomUUID();
    const submittedAt = new Date().toISOString();
    const assets: Array<{ id: string; kind: "icon" | "screenshot"; position: number; key: string; image: PreparedImage }> = [];

    assets.push({
      id: crypto.randomUUID(),
      kind: "icon",
      position: 0,
      key: `submissions/${submissionId}/icon.${icon.extension}`,
      image: icon,
    });
    screenshots.forEach((image, index) => {
      assets.push({
        id: crypto.randomUUID(),
        kind: "screenshot",
        position: index,
        key: `submissions/${submissionId}/screenshot-${index + 1}.${image.extension}`,
        image,
      });
    });

    for (const asset of assets) {
      await env.SUBMISSION_ASSETS.put(asset.key, asset.image.bytes, {
        httpMetadata: { contentType: asset.image.contentType },
        customMetadata: {
          submissionId,
          kind: asset.kind,
          position: String(asset.position),
        },
      });
      uploadedKeys.push(asset.key);
    }

    const statements: D1PreparedStatement[] = [
      env.DB.prepare(
        `INSERT INTO app_submissions
          (id, status, name, tagline, description, platform, first_release_date,
           store_url_ios, store_url_android, maker_name, maker_email,
           campaign_source, submitted_at, updated_at)
         VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        submissionId,
        name,
        tagline,
        description,
        platform,
        releaseDate,
        storeUrlIos || null,
        storeUrlAndroid || null,
        makerName || null,
        makerEmail,
        campaignSource,
        submittedAt,
        submittedAt,
      ),
      ...assets.map((asset) =>
        env.DB.prepare(
          `INSERT INTO submission_assets
            (id, submission_id, kind, position, r2_key, content_type, byte_size, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          asset.id,
          submissionId,
          asset.kind,
          asset.position,
          asset.key,
          asset.image.contentType,
          asset.image.size,
          submittedAt,
        ),
      ),
    ];

    await env.DB.batch(statements);

    return success(request, submissionId, campaignSource);
  } catch (error) {
    if (uploadedKeys.length > 0) {
      await Promise.allSettled(uploadedKeys.map((key) => env.SUBMISSION_ASSETS.delete(key)));
    }

    if (error instanceof FormError) return failure(request, error.message, error.status, campaignSource);

    console.error("App submission failed:", error);
    return failure(request, "We couldn't save your submission. Please try again.", 500, campaignSource);
  }
};

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function requiredText(formData: FormData, key: string, label: string, maxLength: number) {
  const value = text(formData, key);
  if (!value) throw new FormError(`${label} is required.`);
  if (value.length > maxLength) throw new FormError(`${label} is too long.`);
  return value;
}

function optionalText(formData: FormData, key: string, label: string, maxLength: number) {
  const value = text(formData, key);
  if (value.length > maxLength) throw new FormError(`${label} is too long.`);
  return value;
}

function isPlatform(value: string): value is "ios" | "android" | "both" {
  return value === "ios" || value === "android" || value === "both";
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

async function prepareImage(file: File, label: string, maxBytes: number): Promise<PreparedImage> {
  if (file.size > maxBytes) {
    throw new FormError(`${label} file is too large (${Math.floor(maxBytes / 1024 / 1024)}MB max).`);
  }

  if (file.type !== "image/png" && file.type !== "image/webp") {
    throw new FormError(`${label} must be PNG or WebP.`);
  }

  const bytes = await file.arrayBuffer();
  const signature = new Uint8Array(bytes);
  const isPng =
    signature.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => signature[index] === byte);
  const isWebp =
    signature.length >= 12 &&
    ascii(signature, 0, 4) === "RIFF" &&
    ascii(signature, 8, 12) === "WEBP";

  if ((file.type === "image/png" && !isPng) || (file.type === "image/webp" && !isWebp)) {
    throw new FormError(`${label} content does not match its file type.`);
  }

  return {
    bytes,
    contentType: file.type,
    extension: file.type === "image/png" ? "png" : "webp",
    size: file.size,
  };
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

function wantsJson(request: Request) {
  return request.headers.get("accept")?.includes("application/json") ?? false;
}

function success(request: Request, submissionId: string, campaignSource: string | null) {
  if (wantsJson(request)) return json({ ok: true, submissionId }, 201);
  const target = new URL("/submit", request.url);
  target.searchParams.set("submitted", "1");
  if (campaignSource === "shipaton") target.searchParams.set("campaign", "shipaton");
  return Response.redirect(target, 303);
}

function failure(request: Request, message: string, status: number, campaignSource: string | null) {
  if (wantsJson(request)) return json({ error: message }, status);
  const target = new URL("/submit", request.url);
  target.searchParams.set("submission", "error");
  if (campaignSource === "shipaton") target.searchParams.set("campaign", "shipaton");
  return Response.redirect(target, 303);
}

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
