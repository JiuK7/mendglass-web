# 004: Hosting on Cloudflare Workers

Status: **proposed, provisional go**, 17 November 2026. Final once the site is
deployed to `workers.dev` and CPU time is measured there (see "Still to
measure").

## Context

The Engineering Definition v1 (sections 2, 11, 12, 18 and 19) names Vercel as
the host. The budget for this site is small. Vercel's free Hobby plan is for
non-commercial use, so a commercial studio site would need Vercel Pro, a
monthly cost. Cloudflare Workers has a free plan that can serve a mostly
static Next.js site.

This record tests whether the free plan is enough, before any more of the site
is built on it.

## Decision

Host on Cloudflare Workers, free plan, through the OpenNext adapter
(`@opennextjs/cloudflare`), deployed with `wrangler`.

## What changes from reference/02

| Reference/02 says                                       | This build does                                                                                                                                                  |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hosting: Vercel (sections 2, 19)                        | Cloudflare Workers, `workers.dev` address for now. The custom domain is Brief 13.                                                                                |
| Preview and production secrets in Vercel (11)           | Secrets set with `wrangler secret put` or in the Cloudflare dashboard. Local values in `.dev.vars` (gitignored).                                                 |
| Vercel PR preview deployments (12, 18)                  | Not set up yet. Cloudflare offers Previews (see below). Until then, CI is the check on every pull request.                                                       |
| Runtime versions aligned with Vercel (11)               | The Worker runs in Cloudflare's `workerd` runtime with Node.js compatibility (`nodejs_compat`), not in Node.js 24. `pnpm preview` runs the same runtime locally. |
| Platform rate limiting (10)                             | Still the plan. Whether the free plan offers a rate-limiting rule is checked in Brief 13.                                                                        |
| Code stays free of host imports (CLAUDE.md, hard rules) | Unchanged. Cloudflare appears only in `wrangler.jsonc`, `open-next.config.ts`, `package.json` and the lockfile. Nothing under `src/` imports it.                 |

Everything else in reference/02 stands: the stack, the rendering rules, the
enquiry boundary and the tests.

## Setup

Following the OpenNext "Get started" guide for existing apps
(opennext.js.org/cloudflare/get-started, read 17 November 2026):

- `wrangler.jsonc`: Worker name, `main: .open-next/worker.js`, compatibility
  date 2026-11-16, flags `nodejs_compat` and `global_fetch_strictly_public`,
  the `ASSETS` binding, and Workers Logs switched on.
- `open-next.config.ts`: the incremental cache (below).
- `public/_headers`: the guide's rule that caches `/_next/static/*` for a year.
  Those file names contain a content hash, so they never go stale.
- `.dev.vars`: `NEXTJS_ENV=development`, gitignored.
- Scripts: `pnpm preview` (build and run locally in the Workers runtime) and
  `pnpm deploy` (build and deploy).

Left out on purpose:

- **`WORKER_SELF_REFERENCE` service binding.** The guide includes it. In
  adapter 1.20.17 it is used only by the revalidation queues and the image
  optimiser, neither of which this site uses. Cloudflare's Previews
  documentation also says a service binding from a Preview calls the
  production Worker, so leaving it out avoids a preview reaching production.
- **`IMAGES` binding.** No image is optimised yet. Brief 10 decides how images
  are served.
- **`initOpenNextCloudflareForDev()` in `next.config.ts`.** It gives
  `next dev` access to Cloudflare bindings. The site reads none.

## Caching choice

**Workers Static Assets incremental cache**
(`@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache`),
with no queue and no tag cache.

Why: the OpenNext caching page lists three places to keep prerendered pages:
R2, Workers KV and Workers Static Assets. R2 and KV are extra services with
their own limits. Static Assets is part of every Worker, needs no binding, and
the page says a static site needs neither a queue nor a tag cache. Its one
limit is that pages cannot be revalidated (rebuilt) at runtime. Every page on
this site is rebuilt by a deploy, so that is not needed.

Cache interception (`enableCacheInterception`) is left off. The OpenNext
caching page says it does not work with Partial Prerendering, which Cache
Components uses.

## Measurements

Measured on 17 November 2026 with `@opennextjs/cloudflare` 1.20.17,
`wrangler` 4.162.0 and Next.js 16.4.6, on the scaffold page plus the stub
endpoint.

| What                                  | Result                                                                                                                                    | Limit                    | Pass               |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------ |
| Bundle size, compressed (gzip)        | **987 KiB** (0.96 MiB)                                                                                                                    | 3 MiB (free)             | Yes, about a third |
| Bundle size, uncompressed             | 4,690 KiB (4.6 MiB)                                                                                                                       | 64 MiB (see note)        | Yes                |
| CPU time, `GET /`                     | **Not measured yet**                                                                                                                      | 10 ms per request (free) | Pending deploy     |
| CPU time, `POST /api/enquiry`         | **Not measured yet**                                                                                                                      | 10 ms per request (free) | Pending deploy     |
| `/` served as static asset or Worker? | **Runs the Worker**, which reads the prerendered HTML from static assets                                                                  | n/a                      | n/a                |
| `cacheComponents`                     | **Works**: build reports "Cache Components enabled"; `/` returns `x-nextjs-cache: HIT` and `x-nextjs-prerender: 1` in the Workers runtime | n/a                      | Kept on            |
| `partialPrefetching`                  | **Works**: build reports "Partial Prefetching enabled"; the page renders and hydrates in the Workers runtime                              | n/a                      | Kept on            |

How each was measured:

- **Bundle size**: `wrangler deploy --dry-run --outdir <tmp>` after
  `opennextjs-cloudflare build`. Wrangler printed
  `Total Upload: 4689.93 KiB / gzip: 987.02 KiB`. The deploy output prints
  the same line.
- **Static or Worker**: the build output has no HTML file in
  `.open-next/assets`. The prerendered `/` is written to the adapter's cache
  folder, which deploy copies under `cdn-cgi/_next_cache` in static assets,
  a path only the Worker can read. So every request for a page runs the
  Worker, which returns the stored HTML without rendering React. Files under
  `/_next/static/` are served directly and do not run the Worker; the local
  run confirmed their year-long `Cache-Control` header from `public/_headers`.
- **Cache Components and Partial Prefetching**: the OpenNext overview page
  lists Partial Prerendering and `'use cache'` as supported and does not
  mention `cacheComponents` or `partialPrefetching` by name. So this was
  tested, not assumed: `pnpm preview` (the real `workerd` runtime, locally)
  served `/` with status 200, the expected `h1`, and the headers above. The
  stub endpoint returned 200 for a JSON object and 400 for a body that is not
  JSON.
- **CPU time** can only be read from a deployed Worker. The local runtime
  reports wall time (113 ms for the first `GET /`, then 5 ms; 28 ms then 5 ms
  for the `POST`), which includes waiting and start-up and is not CPU time.
  After deploy: send ten requests to each, then read CPU time per request in
  the Cloudflare dashboard (Workers & Pages, mendglass-web, Observability).
  Workers Logs is switched on in `wrangler.jsonc` for this.

Note on the size limit: the OpenNext overview page states 3 MiB compressed on
the free plan and 10 MiB on paid. Cloudflare's own limits page, read on
17 November 2026, now says "There is no compressed size limit" and gives
64 MiB uncompressed on both plans. The bundle passes either reading, so this
changes nothing now. Keep recording the compressed size, as the later briefs
ask, in case the limit returns.

## Still to measure

Deploying needs a Cloudflare login, which only the owner can grant
(`pnpm exec wrangler login`). After that:

1. `pnpm deploy` and confirm the `workers.dev` address serves `/` and the
   stub endpoint.
2. Record CPU time for both routes in the table above.
3. Change the status of this record to accepted, or to the fallback.

## Verdict

**Provisional go.** The bundle is about a third of the stricter size limit,
and Cache Components works through the adapter. The remaining risk is CPU
time on `GET /`. It is expected to be low, because the Worker returns stored
HTML instead of rendering, but it is not measured yet. If either route
exceeds 10 ms CPU time and there is no simple fix, stop and switch to the
fallback.

## Fallback: Vercel Pro

Vercel is the host reference/02 was written for, so switching back means
deleting `wrangler.jsonc`, `open-next.config.ts`, `public/_headers` (Vercel
caches `/_next/static` itself), the two scripts and the two packages, and
following reference/02 as written. Application code does not change, because
nothing under `src/` imports Cloudflare. The cost is the Pro subscription.

## Why OpenNext and not vinext

vinext is Cloudflare's reimplementation of the Next.js API on Vite, released
in 2026. Its own repository labels it experimental and under heavy
development, and Cloudflare describes it as not yet tested at scale. It
replaces the Next.js build, so the site would no longer be built by the
framework reference/02 locks. OpenNext keeps the real `next build` and only
adapts its output to Workers, and its documentation says it supports every
Next.js 16 release. That keeps the code identical whichever host is used.

## Preview deployments and environments

Findings only; nothing is built yet.

- **Previews per branch work on the free plan.** Cloudflare's Previews
  documentation says the free plan allows 100 Previews per Worker.
  `wrangler preview` creates or updates one for the current branch.
  Workers Builds (Cloudflare's Git integration) can build every non-main
  branch automatically: 3,000 build minutes a month, one build at a time,
  20-minute timeout on the free plan.
- **Environment values are separate.** Previews do not inherit production
  settings. Variables and bindings for previews go in a `previews` block in
  `wrangler.jsonc`. Secrets cannot go in the file; they are set with commands,
  for all new previews or for one.
- **Version URLs are a different, simpler thing.** Every upload gets its own
  URL, but it uses the same variables and secrets as production. They are
  unsuitable for testing the enquiry form, which reference/02 section 12 says
  must never reach the live workflow from a preview.
- **Both are public by default.** Cloudflare Access can require sign-in.
  Preview URLs on `workers.dev` send `X-Robots-Tag: noindex`.

Recommendation for a later brief: once the enquiry sink exists (Briefs 5 and
6), set preview variables so the sink is the safe test one, and decide then
whether per-pull-request previews are worth adding.

## Free plan terms

Brief 2 asks the owner to read the free plan's terms for any restriction on
commercial use. That result belongs here and is not recorded yet.

## Sources (read 17 November 2026)

- opennext.js.org/cloudflare (overview, supported versions, size limit)
- opennext.js.org/cloudflare/get-started
- opennext.js.org/cloudflare/caching
- developers.cloudflare.com/workers/platform/limits/
- developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- developers.cloudflare.com/workers/previews/
- developers.cloudflare.com/workers/configuration/previews/
- developers.cloudflare.com/workers/ci-cd/builds/ and its limits page
- blog.cloudflare.com/vinext and the vinext repository README
