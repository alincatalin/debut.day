# Debut Day

One first-time mobile release gets the whole page, every day.

The site uses Astro SSR and the Cloudflare adapter. It deploys as the
`debut-day` Cloudflare Worker with static assets, D1, and private R2 storage.

## Requirements

- Node 22.12 or newer
- A Cloudflare account authenticated with Wrangler

```bash
nvm use
npm ci
npm run dev
```

The local server runs at `http://localhost:4321`. Astro's Cloudflare adapter
uses `workerd` in development, so D1 and R2 bindings behave like production.
The submission form uses Cloudflare's published Turnstile test keys locally.
Production uses the managed `Debut Day submissions` widget and the encrypted
`TURNSTILE_SECRET_KEY` Worker secret.

## Verification and deployment

```bash
npm run cf:types
npm run db:migrate:local
npm run build
npm run db:migrate:remote
npm run deploy
```

Do not commit generated `dist/` output. Run `npm run cf:types` after changing
bindings in `wrangler.jsonc`.

App submissions are protected before their multipart body is parsed:

- Turnstile tokens are verified server-side and bound to the `app-submit`
  action and production hostnames.
- One Worker rate-limit binding allows five submission attempts per IP each
  minute.
- The request stream stops at 24 MB even when `Content-Length` is absent or
  false. Existing per-file type, signature, count, and size checks still apply.

The Turnstile secret was installed with Wrangler and is not stored in the
repository. If the Worker is recreated, install it again before deployment:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```

## Data model

The private intake workflow is intentionally separate from the public site.

- `newsletter_subscribers` stores newsletter consent and subscription state.
- `app_submissions` stores raw submissions for editorial review, including an
  optional campaign source such as `shipaton`.
- `submission_assets` maps private R2 objects to a submission.
- `published_apps` stores edited public showcase records.
- `published_app_screens` stores ordered public screenshot content.

New app submissions always enter as `pending`. They never appear on the site
automatically. To feature one, create a separate `published_apps` record with
its `source_submission_id`, edit the public copy, and move it from `draft` or
`scheduled` to `published`.

Submitted images live in the private `debut-day-submissions` R2 bucket. Do not
enable public access on this bucket. Accepted records may reference approved R2
keys from `published_apps` and `published_app_screens`; the Worker serves only
keys attached to a scheduled, published, or archived app.

Public app pages use `debut.day/{slug}`. The legacy `/debuts/{slug}` route is a
permanent redirect. Shipaton submissions are tagged by the `/shipaton` intake
path and receive a downloadable, date-aware social card after scheduling.

## Inspecting production data

Use the Cloudflare D1 dashboard or Wrangler:

```bash
npx wrangler d1 execute debut-day-db --remote \
  --command "SELECT id, name, campaign_source, status, submitted_at FROM app_submissions ORDER BY submitted_at DESC"

npx wrangler d1 execute debut-day-db --remote \
  --command "SELECT email, status, consented_at FROM newsletter_subscribers ORDER BY created_at DESC"

npx wrangler d1 export debut-day-db --remote --output=debut-day-backup.sql
```

Use the R2 dashboard to inspect or download private submitted images.

## Newsletter delivery

The newsletter form safely persists consent in D1. D1 is the source of truth
for signups, but it does not deliver email. Before sending campaigns, connect
an email service provider and synchronize active subscribers. The provider must
handle delivery and one-click unsubscribe; update the corresponding D1 row to
`unsubscribed` when an unsubscribe occurs.

## Project structure

```text
src/
  components/             reusable UI
  data/apps.ts            mock showcase fallback
  layouts/Layout.astro    shared shell
  lib/db.ts               public showcase data-access boundary
  pages/
    api/submit.ts         validated D1 + private R2 intake
    api/subscribe.ts      newsletter consent persistence
    [slug].astro          canonical public app detail page
    shipaton.astro        temporary Shipaton campaign landing page
    api/cards/            generated PNG sharing cards
    media/apps/           approved R2 asset delivery
    index.astro            homepage and newsletter form
    submit.astro           maker submission form
migrations/               versioned D1 schema
wrangler.jsonc            Worker and storage bindings
```

Public pages continue to read through `src/lib/db.ts`. They must never query
`app_submissions`, `submission_assets`, or `newsletter_subscribers`.
