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

No environment variables are read yet. [`.env.example`](.env.example) lists
variable names and descriptions as they are introduced. Real values live in
`.env.local` (gitignored) and are never committed.

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
