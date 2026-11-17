# mendglass-web

Production website for Mendglass, an independent web studio focused on
restaurant websites.

> **Status: scaffold.** This README is a skeleton. Each section is filled in as
> the matching part of the site is built, and it describes only what exists.

## Problem

_To be written with the first complete slice of the site._

## Product requirements

Scope, routes and copy are defined in
[`docs/reference/01-production-brief-v1.1.md`](docs/reference/01-production-brief-v1.1.md).
Identity is defined in
[`docs/reference/03-brand-system-v1.md`](docs/reference/03-brand-system-v1.md).

## Architecture

Engineering baseline:
[`docs/reference/02-engineering-definition-v1.md`](docs/reference/02-engineering-definition-v1.md).
Decisions made during the build are recorded in [`docs/decisions/`](docs/decisions/):

- [001: Stack and rendering](docs/decisions/001-stack-and-rendering.md)
- [002: Enquiry integration boundary](docs/decisions/002-enquiry-integration-boundary.md)
- [004: Hosting on Cloudflare Workers](docs/decisions/004-hosting-cloudflare-workers.md)

## Stack

Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, Vitest
with React Testing Library, Playwright, ESLint (flat config), Prettier and Zod.
Hosted on Cloudflare Workers through the OpenNext adapter
(`@opennextjs/cloudflare`).
Exact versions are in `package.json` and `pnpm-lock.yaml`; the reasons are in
ADR 001.

## Setup

Requirements:

- Node.js 24 (`.nvmrc`). Use 24.15 or newer: the test DOM (jsdom) declares
  that as its minimum and warns on older 24.x releases.
- pnpm, at the version pinned in `package.json` (`packageManager`). Corepack,
  which ships with Node 24, provides it.

```bash
nvm use
corepack enable
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm dev
```

Development environment: macOS (Apple silicon), Node.js 24, pnpm through
Corepack. Windows is not a supported development platform for this
repository; on a Windows machine, work inside WSL2 with the repository on the
Linux filesystem.

## Environment

Server variables are validated in `src/lib/env.ts`.
[`.env.example`](.env.example) lists every name with its description. Real
values live in `.env.local` (gitignored) and are never committed.

| Variable       | Values                                 | Default                                                             |
| -------------- | -------------------------------------- | ------------------------------------------------------------------- |
| `SITE_ENV`     | `development`, `preview`, `production` | `development` in `pnpm dev` and unit tests; required in every build |
| `ENQUIRY_SINK` | `test`, `email`, `n8n`                 | `test`                                                              |

Under `pnpm dev`, with nothing set, the site runs as development and
enquiries go to the test sink, which accepts them and delivers them nowhere.
A production build (`pnpm build` then `pnpm start`, `pnpm preview`, or a
deploy) refuses to start unless `SITE_ENV` is set:

- End-to-end tests: set to `preview` in `playwright.config.ts`.
- `pnpm preview`: add `SITE_ENV=preview` to `.dev.vars` (gitignored).
- The `workers.dev` deploy: set to `preview` in `wrangler.jsonc`.

Each other sink needs its own variables. Production (`SITE_ENV=production`)
refuses to start with the test sink, and any environment refuses to start if
a variable is missing or wrong. The enquiry boundary is described in ADR 002.

## Testing

| Command          | What it does                                              |
| ---------------- | --------------------------------------------------------- |
| `pnpm lint`      | ESLint (Next.js Core Web Vitals rules) and Prettier check |
| `pnpm typecheck` | Generates route types, then `tsc --noEmit` in strict mode |
| `pnpm test`      | Vitest unit and component tests (`src/**/*.test.ts(x)`)   |
| `pnpm build`     | Production build                                          |
| `pnpm test:e2e`  | Playwright against the production build (`tests/e2e`)     |

Run `pnpm build` before `pnpm test:e2e`: the end-to-end tests start the built
site with `next start`. `pnpm format` rewrites files with Prettier.

Every pull request to `main` runs the same steps in GitHub Actions
(`.github/workflows/ci.yml`): install with the frozen lockfile, lint,
typecheck, unit tests, build, then the Playwright smoke test in Chromium. If
the smoke test fails, the Playwright report is attached to the run.

## Deployment

Cloudflare Workers, free plan, through `@opennextjs/cloudflare`. The reasons,
measurements and fallback are in ADR 004.

| Command           | What it does                                                          |
| ----------------- | --------------------------------------------------------------------- |
| `pnpm preview`    | Builds for Workers and runs the site locally in the Workers runtime   |
| `pnpm run deploy` | Builds for Workers and deploys to Cloudflare (needs `wrangler login`) |

Configuration: `wrangler.jsonc` (the Worker), `open-next.config.ts` (the
adapter and its cache) and `public/_headers` (cache headers for build files).
Local Workers values go in `.dev.vars`, which is gitignored.

Use `pnpm run deploy`, not `pnpm deploy`: the short form runs a built-in pnpm
command instead of this script.

Current address: https://mendglass-web.mendglass-web.workers.dev
