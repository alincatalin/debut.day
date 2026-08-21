import { env } from "cloudflare:workers";
import { archiveMock, smol, type DebutApp, type QA } from "../data/apps";

type PublicStatus = "scheduled" | "published" | "archived";

interface PublishedAppRow {
  id: string;
  slug: string;
  status: PublicStatus;
  name: string;
  tagline: string;
  description_json: string;
  why_its_here: string;
  platform: "ios" | "android" | "both";
  store_url_ios: string | null;
  store_url_android: string | null;
  debut_date: string;
  maker_name: string | null;
  maker_role: string | null;
  interview_json: string | null;
  updated_at: string;
  campaign_source: string | null;
}

interface PublishedScreenRow {
  position: number;
  title: string;
  subtitle: string;
  caption: string;
}

export interface ArchiveEntry {
  date: string;
  slug: string;
  name: string;
  platform: string;
}

const PUBLIC_STATUSES = "('scheduled', 'published', 'archived')";

export async function getTodayApp(): Promise<DebutApp | null> {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const row = await env.DB.prepare(
      `SELECT p.id, p.slug, p.status, p.name, p.tagline, p.description_json,
              p.why_its_here, p.platform, p.store_url_ios, p.store_url_android,
              p.debut_date, p.maker_name, p.maker_role, p.interview_json,
              p.updated_at, s.campaign_source
         FROM published_apps p
         LEFT JOIN app_submissions s ON s.id = p.source_submission_id
        WHERE p.debut_date = ? AND p.status IN ${PUBLIC_STATUSES}
        ORDER BY CASE p.status WHEN 'published' THEN 0 WHEN 'scheduled' THEN 1 ELSE 2 END
        LIMIT 1`,
    ).bind(today).first<PublishedAppRow>();

    if (row) return hydrateApp(row);
  } catch (error) {
    console.error("Today's published app lookup failed; using mock fallback.", error);
  }

  return smol;
}

export async function getAppBySlug(slug: string): Promise<DebutApp | null> {
  try {
    const row = await env.DB.prepare(
      `SELECT p.id, p.slug, p.status, p.name, p.tagline, p.description_json,
              p.why_its_here, p.platform, p.store_url_ios, p.store_url_android,
              p.debut_date, p.maker_name, p.maker_role, p.interview_json,
              p.updated_at, s.campaign_source
         FROM published_apps p
         LEFT JOIN app_submissions s ON s.id = p.source_submission_id
        WHERE p.slug = ? AND p.debut_date IS NOT NULL AND p.status IN ${PUBLIC_STATUSES}
        LIMIT 1`,
    ).bind(slug).first<PublishedAppRow>();

    if (row) return hydrateApp(row);
  } catch (error) {
    console.error(`Published app lookup failed for ${slug}; using mock fallback when available.`, error);
  }

  return slug === smol.slug ? smol : null;
}

export async function listArchive(): Promise<ArchiveEntry[]> {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const result = await env.DB.prepare(
      `SELECT debut_date AS date, slug, name, platform
         FROM published_apps
        WHERE debut_date <= ? AND status IN ${PUBLIC_STATUSES}
        ORDER BY debut_date DESC`,
    ).bind(today).all<{ date: string; slug: string; name: string; platform: DebutApp["platform"] }>();

    if (result.results.length > 0) {
      return result.results.map((row) => ({
        ...row,
        platform: platformLabel(row.platform),
      }));
    }
  } catch (error) {
    console.error("Published archive lookup failed; using mock fallback.", error);
  }

  return archiveMock.slice().reverse();
}

async function hydrateApp(row: PublishedAppRow): Promise<DebutApp> {
  const screenResult = await env.DB.prepare(
    `SELECT position, title, subtitle, caption
       FROM published_app_screens
      WHERE published_app_id = ?
      ORDER BY position`,
  ).bind(row.id).all<PublishedScreenRow>();

  const maker = row.maker_name
    ? {
        name: row.maker_name,
        role: row.maker_role || `Made ${row.name}`,
        interview: parseJsonArray<QA>(row.interview_json),
      }
    : undefined;

  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: parseJsonArray<string>(row.description_json),
    whyItsHere: row.why_its_here,
    icon: row.name.charAt(0),
    iconUrl: `/media/apps/${encodeURIComponent(row.id)}/icon`,
    platform: row.platform,
    storeUrlIos: row.store_url_ios || undefined,
    storeUrlAndroid: row.store_url_android || undefined,
    debutDate: row.debut_date,
    campaignSource: row.campaign_source === "shipaton" ? "shipaton" : undefined,
    updatedAt: row.updated_at,
    screens: screenResult.results.map((screen) => ({
      imageUrl: `/media/apps/${encodeURIComponent(row.id)}/screen-${screen.position}`,
      title: screen.title,
      sub: screen.subtitle,
      caption: screen.caption,
    })),
    maker,
  };
}

function parseJsonArray<T>(value: string | null): T[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function platformLabel(platform: DebutApp["platform"]) {
  if (platform === "ios") return "iPhone";
  if (platform === "android") return "Android";
  return "iPhone + Android";
}
