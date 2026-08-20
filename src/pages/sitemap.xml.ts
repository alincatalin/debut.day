import type { APIRoute } from "astro";
import { listArchive } from "../lib/db";

export const prerender = false;

const SITE_URL = "https://debut.day";

export const GET: APIRoute = async () => {
  const archive = await listArchive();
  const paths = ["/", "/submit", "/shipaton", ...archive.map((app) => `/${app.slug}`)];
  const uniqueUrls = [...new Set(paths)].map((path) => new URL(path, SITE_URL).toString());
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
};

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&apos;",
  })[character] || character);
}
