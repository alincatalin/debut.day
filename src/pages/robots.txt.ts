import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = () => new Response(
  [
    "User-agent: *",
    "Allow: /",
    "",
    "Sitemap: https://debut.day/sitemap.xml",
    "",
  ].join("\n"),
  {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  },
);
