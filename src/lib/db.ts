import { aster, archiveMock, type DebutApp } from "../data/apps";

/**
 * Data-access layer.
 *
 * Every function here is written the way it will look once D1 is wired
 * up — pages call these, never the mock data directly — so switching
 * from mock data to a real database later is a one-file change.
 *
 * Example with a live binding (Cloudflare Pages Functions / Astro
 * `context.locals.runtime.env`):
 *
 *   export async function getTodayApp(env: Env): Promise<DebutApp | null> {
 *     const row = await env.DB
 *       .prepare("SELECT * FROM apps WHERE debut_date = date('now') AND status = 'published'")
 *       .first();
 *     return row ? rowToApp(row) : null;
 *   }
 */

export async function getTodayApp(): Promise<DebutApp> {
  return aster;
}

export async function getAppBySlug(slug: string): Promise<DebutApp | null> {
  return slug === aster.slug ? aster : null;
}

export async function listArchive() {
  return archiveMock;
}
