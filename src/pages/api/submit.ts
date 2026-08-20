import type { APIRoute } from "astro";

export const prerender = false;

const MAX_ICON_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/webp"]);
const MAX_SCREENSHOTS = 5;

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const tagline = String(formData.get("tagline") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const platform = String(formData.get("platform") || "").trim();
    const releaseDate = String(formData.get("releaseDate") || "").trim();
    const storeUrlIos = String(formData.get("storeUrlIos") || "").trim();
    const storeUrlAndroid = String(formData.get("storeUrlAndroid") || "").trim();
    const makerName = String(formData.get("makerName") || "").trim();
    const makerEmail = String(formData.get("makerEmail") || "").trim();
    const icon = formData.get("icon") as File | null;
    const screenshots = formData.getAll("screenshots") as File[];

    // --- Required-field validation ---
    if (!name || !tagline || !description || !platform || !releaseDate || !makerEmail) {
      return json({ error: "Please fill in all required fields." }, 400);
    }
    if (!["ios", "android", "both"].includes(platform)) {
      return json({ error: "Invalid platform." }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(makerEmail)) {
      return json({ error: "That email address doesn't look right." }, 400);
    }

    // --- Icon validation ---
    if (!icon || icon.size === 0) {
      return json({ error: "An app icon is required." }, 400);
    }
    if (!ALLOWED_IMAGE_TYPES.has(icon.type)) {
      return json({ error: "Icon must be PNG or WebP." }, 400);
    }
    if (icon.size > MAX_ICON_BYTES) {
      return json({ error: "Icon file is too large (2MB max)." }, 400);
    }

    // --- Screenshot validation ---
    if (screenshots.length > MAX_SCREENSHOTS) {
      return json({ error: `Please submit at most ${MAX_SCREENSHOTS} screenshots.` }, 400);
    }
    for (const shot of screenshots) {
      if (!(shot instanceof File) || shot.size === 0) continue;
      if (!ALLOWED_IMAGE_TYPES.has(shot.type)) {
        return json({ error: "Screenshots must be PNG or WebP." }, 400);
      }
      if (shot.size > MAX_SCREENSHOT_BYTES) {
        return json({ error: "One of the screenshots is too large (4MB max)." }, 400);
      }
    }

    const slug = slugify(name);

    // -----------------------------------------------------------------
    // TODO — wire up live bindings once D1 + R2 are created for the
    // project (`wrangler d1 create` / `wrangler r2 bucket create`,
    // then declare them in wrangler.toml). Shape below is what the
    // production code looks like; `locals.runtime.env` is how Astro's
    // Cloudflare adapter exposes bindings at request time.
    //
    // const env = locals.runtime.env;
    //
    // const iconKey = `icons/${slug}-${Date.now()}.${extOf(icon.type)}`;
    // await env.APP_ASSETS.put(iconKey, await icon.arrayBuffer(), {
    //   httpMetadata: { contentType: icon.type },
    // });
    //
    // const screenshotKeys: string[] = [];
    // for (const [i, shot] of screenshots.entries()) {
    //   const key = `screenshots/${slug}-${Date.now()}-${i}.${extOf(shot.type)}`;
    //   await env.APP_ASSETS.put(key, await shot.arrayBuffer(), {
    //     httpMetadata: { contentType: shot.type },
    //   });
    //   screenshotKeys.push(key);
    // }
    //
    // await env.DB.prepare(
    //   `INSERT INTO apps
    //     (id, name, tagline, description, icon_key, screenshots, platform,
    //      store_url_ios, store_url_android, maker_name, maker_email,
    //      status, submitted_at)
    //    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`
    // ).bind(
    //   slug, name, tagline, description, iconKey, JSON.stringify(screenshotKeys),
    //   platform, storeUrlIos, storeUrlAndroid, makerName, makerEmail
    // ).run();
    // -----------------------------------------------------------------

    console.log("New submission (not yet persisted — D1/R2 not wired up):", {
      slug, name, tagline, platform, releaseDate, makerEmail,
      screenshotCount: screenshots.length,
    });

    return json({ ok: true, slug }, 200);
  } catch (err) {
    console.error("Submission error:", err);
    return json({ error: "Something went wrong on our end. Please try again." }, 500);
  }
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
