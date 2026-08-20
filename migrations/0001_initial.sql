PRAGMA foreign_keys = ON;

-- Private newsletter consent and delivery state. Never queried by public pages.
CREATE TABLE newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'unsubscribed')),
  source TEXT NOT NULL DEFAULT 'homepage',
  consented_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX newsletter_subscribers_status_idx
  ON newsletter_subscribers (status, created_at DESC);

-- Raw maker submissions stay private until the editor reviews them.
CREATE TABLE app_submissions (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_review', 'accepted', 'rejected')),
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  platform TEXT NOT NULL
    CHECK (platform IN ('ios', 'android', 'both')),
  first_release_date TEXT NOT NULL,
  store_url_ios TEXT,
  store_url_android TEXT,
  maker_name TEXT,
  maker_email TEXT NOT NULL,
  review_notes TEXT,
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX app_submissions_review_queue_idx
  ON app_submissions (status, submitted_at DESC);

CREATE TABLE submission_assets (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL
    REFERENCES app_submissions (id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('icon', 'screenshot')),
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  r2_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size > 0),
  created_at TEXT NOT NULL,
  UNIQUE (submission_id, kind, position)
);

CREATE INDEX submission_assets_submission_idx
  ON submission_assets (submission_id, kind, position);

-- Curated public records are deliberately separate from raw submissions.
CREATE TABLE published_apps (
  id TEXT PRIMARY KEY,
  source_submission_id TEXT UNIQUE
    REFERENCES app_submissions (id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description_json TEXT NOT NULL,
  why_its_here TEXT NOT NULL,
  icon_key TEXT NOT NULL,
  platform TEXT NOT NULL
    CHECK (platform IN ('ios', 'android', 'both')),
  store_url_ios TEXT,
  store_url_android TEXT,
  debut_date TEXT,
  maker_name TEXT,
  maker_role TEXT,
  interview_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
);

CREATE INDEX published_apps_schedule_idx
  ON published_apps (status, debut_date DESC);

CREATE TABLE published_app_screens (
  id TEXT PRIMARY KEY,
  published_app_id TEXT NOT NULL
    REFERENCES published_apps (id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),
  asset_key TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  caption TEXT NOT NULL,
  UNIQUE (published_app_id, position)
);
