import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

const PUBLIC_STATUSES = "('scheduled', 'published', 'archived')";

export const GET: APIRoute = async ({ params }) => {
  const id = params.id || "";
  const asset = params.asset || "";

  let key: string | null = null;
  if (asset === "icon") {
    const row = await env.DB.prepare(
      `SELECT icon_key AS asset_key
         FROM published_apps
        WHERE id = ? AND debut_date IS NOT NULL AND status IN ${PUBLIC_STATUSES}
        LIMIT 1`,
    ).bind(id).first<{ asset_key: string }>();
    key = row?.asset_key || null;
  } else {
    const match = /^screen-(\d+)$/.exec(asset);
    if (!match) return notFound();

    const row = await env.DB.prepare(
      `SELECT s.asset_key
         FROM published_app_screens s
         JOIN published_apps p ON p.id = s.published_app_id
        WHERE p.id = ? AND s.position = ? AND p.debut_date IS NOT NULL
          AND p.status IN ${PUBLIC_STATUSES}
        LIMIT 1`,
    ).bind(id, Number(match[1])).first<{ asset_key: string }>();
    key = row?.asset_key || null;
  }

  if (!key) return notFound();
  const object = await env.SUBMISSION_ASSETS.get(key);
  if (!object) return notFound();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "public, max-age=3600, s-maxage=86400");
  headers.set("etag", object.httpEtag);
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
};

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}
