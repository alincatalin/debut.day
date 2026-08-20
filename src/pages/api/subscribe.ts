import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const honeypot = String(formData.get("companyWebsite") || "").trim();

    // Bots commonly fill every field. Return the normal success response without
    // storing their address so the honeypot does not advertise itself.
    if (honeypot) return success(request);

    if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
      return failure(request, "Enter a valid email address.", 400);
    }

    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO newsletter_subscribers
        (id, email, status, source, consented_at, created_at, updated_at)
       VALUES (?, ?, 'active', 'homepage', ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         status = 'active',
         source = excluded.source,
         consented_at = excluded.consented_at,
         updated_at = excluded.updated_at`,
    )
      .bind(crypto.randomUUID(), email, now, now, now)
      .run();

    return success(request);
  } catch (error) {
    console.error("Newsletter subscription failed:", error);
    return failure(request, "We couldn't save your email. Please try again.", 500);
  }
};

function wantsJson(request: Request) {
  return request.headers.get("accept")?.includes("application/json") ?? false;
}

function success(request: Request) {
  if (wantsJson(request)) return json({ ok: true }, 200);
  return Response.redirect(new URL("/?subscribed=1#newsletter", request.url), 303);
}

function failure(request: Request, message: string, status: number) {
  if (wantsJson(request)) return json({ error: message }, status);
  const target = new URL("/", request.url);
  target.searchParams.set("subscription", "error");
  target.hash = "newsletter";
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
