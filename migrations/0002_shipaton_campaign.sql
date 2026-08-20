ALTER TABLE app_submissions ADD COLUMN campaign_source TEXT;

CREATE INDEX app_submissions_campaign_source_idx
  ON app_submissions (campaign_source, status, submitted_at DESC);

PRAGMA optimize;
