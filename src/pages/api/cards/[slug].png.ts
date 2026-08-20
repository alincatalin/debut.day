import type { APIRoute } from "astro";
import { ImageResponse, cache } from "@cf-wasm/og/workerd";
import { t } from "@cf-wasm/og/html-to-react";
import { getAppBySlug } from "../../../lib/db";
import { getShareCardCopy } from "../../../lib/share-card";

export const prerender = false;

export const GET: APIRoute = async ({ params, request, locals }) => {
  const slug = params.slug || "";
  const app = slug ? await getAppBySlug(slug) : null;
  if (!app || app.campaignSource !== "shipaton") {
    return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
  }

  cache.setExecutionContext(locals.cfContext);
  const copy = getShareCardCopy(app);
  const dateUrl = `debut.day/${app.slug}`;
  const headlineSize = copy.headline.length > 55 ? 48 : copy.headline.length > 42 ? 56 : 66;
  const markup = `
    <div style="display:flex;width:1200px;height:630px;box-sizing:border-box;background:#FBFAF6;color:#1B1C1F;padding:72px 78px;position:relative;overflow:hidden;">
      <div style="display:flex;position:absolute;width:430px;height:430px;border-radius:999px;background:rgba(226,59,46,.08);right:-120px;top:-160px;"></div>
      <div style="display:flex;position:absolute;width:250px;height:250px;border-radius:999px;background:rgba(226,59,46,.06);left:-90px;bottom:-100px;"></div>
      <div style="display:flex;flex-direction:column;width:100%;height:100%;justify-content:space-between;position:relative;">
        <div style="display:flex;align-items:center;font-size:25px;font-weight:700;letter-spacing:-.02em;">
          <span style="display:flex;width:16px;height:16px;border-radius:999px;background:#E23B2E;margin-right:14px;"></span>
          Debut Day
        </div>
        <div style="display:flex;flex-direction:column;width:920px;">
          <div style="display:flex;color:#B92A20;font-size:25px;font-weight:700;margin-bottom:18px;">${escapeHtml(copy.eyebrow)}</div>
          <div style="display:flex;font-size:${headlineSize}px;line-height:1.05;font-weight:700;letter-spacing:-.045em;">${escapeHtml(copy.headline)}</div>
          <div style="display:flex;color:#70737B;font-size:24px;margin-top:22px;">${escapeHtml(copy.supporting)}</div>
        </div>
        <div style="display:flex;width:100%;align-items:center;justify-content:space-between;font-size:20px;">
          <span style="display:flex;color:#70737B;">Shipping for Shipaton</span>
          <span style="display:flex;font-weight:700;">${escapeHtml(dateUrl)}</span>
        </div>
      </div>
    </div>`;

  const image = await ImageResponse.async(t(markup), { width: 1200, height: 630 });
  const headers = new Headers(image.headers);
  headers.set("cache-control", "public, max-age=3600, s-maxage=86400");
  headers.set("x-content-type-options", "nosniff");
  if (new URL(request.url).searchParams.get("download") === "1") {
    headers.set("content-disposition", `attachment; filename="${safeFilename(app.slug)}-debut-day.png"`);
  }

  return new Response(image.body, { status: image.status, headers });
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;",
  })[character] || character);
}

function safeFilename(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-");
}
