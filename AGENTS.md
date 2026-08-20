# Repository Guidelines

## Project Structure & Module Organization

This is an Astro 7 SSR site targeting Cloudflare Workers. Routes live in `src/pages/`; API handlers are under `src/pages/api/`, and dynamic routes use brackets, as in `src/pages/debuts/[slug].astro`. Reusable UI belongs in `src/components/`, with the shared shell in `src/layouts/Layout.astro`. Keep design tokens in `src/styles/tokens.css` and static files in `public/`.

Mock records live in `src/data/apps.ts`. Pages must read through `src/lib/db.ts`, not import mocks directly, so D1 can replace the data source without page changes. Do not commit generated `dist/` output.

## Build, Test, and Development Commands

- `npm ci` installs locked dependencies (Node 22.12 or newer).
- `npm run dev` starts Astro's local server at `http://localhost:4321`.
- `npm run build` creates the SSR bundle in `dist/` and performs the primary compile-time check.
- `npm run preview` serves the built output for a local production-style review.
- `npm run dev` exercises the Cloudflare Workers runtime and configured bindings through Astro's Cloudflare adapter.

## Coding Style & Naming Conventions

Use TypeScript with Astro's strict configuration and two-space indentation. Name components and interfaces in `PascalCase`, functions and variables in `camelCase`, and route files in lowercase. Keep API validation at the request boundary and return explicit status codes. Prefer small components, semantic HTML, and existing CSS custom properties over hard-coded colors. Follow `README.md`'s editorial style: short sentences and active voice.

## Testing Guidelines

No automated test framework or coverage threshold is configured. Every change must pass `npm run build`. Manually check affected routes, responsive layouts, forms, error responses, and optional data states. Add future tests beside the feature or under `tests/`, name them `*.test.ts`, and document their script here.

## Commit & Pull Request Guidelines

History contains only an initial commit, so no convention exists yet. Use concise, imperative subjects such as `Validate submission image limits` and keep commits focused. Pull requests should explain the user-visible change, list verification commands, link issues, and include screenshots for visual changes. Call out API, D1 schema, R2 key, or Cloudflare binding changes.

## Security & Configuration

Never commit credentials or local environment files. Validate upload type, size, and count on the server. Keep D1/R2 bindings in deployment configuration and preserve mock fallback until infrastructure is wired.
