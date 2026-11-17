# 004: Hosting on Cloudflare Workers

Status: **accepted: go on the free plan, with a stop rule**, 17 November 2026. Chosen by the owner after the measurements below (see "Verdict").

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
  `pnpm run deploy` (build and deploy). The `run` is needed: `pnpm deploy` on
  its own is a different, built-in pnpm command.

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
| CPU time, `GET /`                     | **Median 6 ms**; 90% of requests 11 ms or less; 7 of 49 over 10 ms (14%); highest 83 ms; none cut off                                     | 10 ms per request (free) | Borderline         |
| CPU time, `POST /api/enquiry`         | **Median 6 ms**; 90% of requests 10 ms or less; 5 of 50 over 10 ms (10%); highest 83 ms; none cut off                                     | 10 ms per request (free) | Borderline         |
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
- **CPU time** was read from the deployed Worker at
  `https://mendglass-web.mendglass-web.workers.dev` (version
  `8ce0df73-6b76-49fc-9ef2-240106977ff4`). `wrangler tail --format json`
  streams one record per request from Cloudflare, including its `cpuTime` in
  milliseconds and its outcome. Two runs from one machine, a request every
  fraction of a second, alternating the two routes: 10 of each, then 40 of
  each (one `GET` record from the second run did not arrive). Every request
  had outcome `ok`; none was `exceededCpu`.
  - Run 1, `GET /`: 14, 6, 8, 9, 5, 5, 8, 6, 54, 9.
  - Run 1, `POST`: 7, 74, 5, 4, 8, 4, 9, 6, 4, 8.
  - Run 2, `GET /` (sorted): 3, 3, 3, 4, 4, 4, 5 (×10), 6 (×7), 7 (×6), 9,
    9, 10, 10, 10, 11, 12, 13, 17, 83.
  - Run 2, `POST` (sorted): 3, 3, 4 (×5), 5 (×5), 6 (×11), 7 (×5), 8, 8, 8,
    9, 9, 10, 10, 10, 12, 12, 15, 83.
  - The local runtime reports only wall time, which includes waiting and is
    not CPU time, so local numbers were not used.
- **Deployed responses**: `GET /` returned 200 with the expected `h1` and
  `x-nextjs-cache: HIT`. The stub returned 200 for a JSON object and 400 for
  a body that is not JSON.

Note on the size limit: the OpenNext overview page states 3 MiB compressed on
the free plan and 10 MiB on paid. Cloudflare's own limits page, read on
17 November 2026, now says "There is no compressed size limit" and gives
64 MiB uncompressed on both plans. The bundle passes either reading, so this
changes nothing now. Keep recording the compressed size, as the later briefs
ask, in case the limit returns.

## Verdict

**Go on the free plan, with a stop rule** (option 1 below), chosen by the
owner on 17 November 2026. The brief says stop and report if a limit is
exceeded. The result was between the two cases:

- **Within the limit as Cloudflare enforces it.** The typical request uses
  about 6 ms. Cloudflare's limits page says a Worker may "infrequently" run
  over 10 ms, and is cut off (error 1102) only if it does so consistently.
  Not one of 99 requests was cut off.
- **But over it often enough to worry.** About one request in eight went over
  10 ms, and a few went far over (54, 74, 83 ms). The highest ones are
  probably the first request in a fresh copy of the Worker, which has to load
  the code. Cloudflare does not say how often is "consistently".
- **And this is the smallest the site will ever be.** The homepage is one
  heading. The Worker only returns stored HTML, so most of its time is the
  adapter's own fixed work, which should not grow much with page size. That
  is a reasonable guess, not something measured.

Options:

1. **Go on the free plan, with a stop rule.** Re-measure the same way after
   the full homepage is built (Brief 8) and before the production deploy
   (Brief 13). If any request is cut off with error 1102, or the median goes
   above 8 ms, move to option 2.
2. **Go on Cloudflare Workers Paid.** The same code and setup. Cloudflare's
   pricing page gives a minimum of $5 a month and a default limit of 30
   seconds CPU time per request, so this limit stops mattering.
3. **Switch to the fallback, Vercel Pro**, as below.

Recommended and chosen: option 1. Nothing failed, the typical request is well
under the limit, and option 2 is a small, code-free step if the
re-measurement goes the wrong way.

### Stop rule

Measure CPU time again, the same way (`wrangler tail --format json`, at least
40 requests per route, recorded here):

- after the full homepage is built (Brief 8), and
- before the production deploy (Brief 13).

Move to Workers Paid (option 2) if any request is cut off with error 1102
(outcome `exceededCpu`), or if the median for any route is above 8 ms. Record
the re-measurement and the outcome in this section.

### Re-measurement after Brief 5 (17 November 2026)

Brief 5 asks for the CPU time of a valid `POST /api/enquiry` on the deployed
Worker. This is not one of the two stop-rule checkpoints (Briefs 8 and 13),
but the same method and thresholds were used.

Deployed from the Brief 5 branch (`feat/enquiry-core`) as version
`d7d6de88-2a7d-42da-8407-4f181d2cacfd`. It is the first deploy since
Brief 2, so it also carries Briefs 3 and 4 (fonts, tokens, layout).
`ENQUIRY_SINK` and `SITE_ENV` were unset, so every enquiry went to the test
sink and was delivered nowhere. Wrangler printed
`Total Upload: 5343.00 KiB / gzip: 1136.58 KiB` (Brief 2: 4,690 / 987 KiB).

Method as above: `wrangler tail --format json`, one machine, a new `curl`
per request, a fraction of a second apart. Every request answered 200, and
every record had outcome `ok`; none was `exceededCpu`. `wrangler tail`
dropped many records (it delivered 56 of 90 in run 2), so each run has fewer
records than requests sent.

- Run 1, 50 valid `POST`s (35 records, sorted): 3, 4, 4, 5 (×9), 6 (×6), 7,
  7, 9, 9, 11, 11, 12, 13, 15, 16, 17, 116, 134, 139, 225, 247, 331.
  **Median 6 ms.**
- Run 2, 45 `GET /` and 45 valid `POST`s, alternating.
  - `GET /` (27 records): 4, 4, 5 (×4), 6 (×5), 7, 9, 11, 16, 17, 51, 59,
    62, 129, 134, 141, 148, 167, 178, 228, 230. **Median 11 ms.**
  - `POST` (29 records): 3, 4, 4, 5, 5, 5, 6 (×4), 7, 7, 9 (×4), 10, 10,
    10, 13, 16, 17, 50, 68, 133, 144, 154, 244, 245. **Median 9 ms.**
- Runs 1 and 2 together, `POST` (64 records): **median 8 ms**; 23 over 10 ms
  (35%); 12 over 50 ms; highest 331 ms.
- A diagnostic run of 40 `POST`s over one reused connection (11 records
  arrived): 3, 3, 4, 5, 5, 5, 6, 9, 10, 111, 212.

What it shows:

- **No request was cut off**, so nothing is failing now.
- **The median is at the 8 ms line**: under it in run 1, over it in run 2
  for both routes, and exactly on it for `POST` overall.
- **There is a second group of slow requests, 50 to 331 ms**, much more
  often than in Brief 2 (whose highest was 83 ms). It affects `GET /` as
  much as `POST`, and `GET /` does not run the enquiry code. Reusing one
  connection did not remove it.

#### Comparison with `main` (owner's choice, same day)

To find out whether Brief 5 causes the slow group, `main` (Briefs 1 to 4,
with the Brief 2 stub endpoint) was deployed and measured, then this branch
was redeployed and measured straight after, the same way: 60 `GET /` and
60 `POST`s, alternating.

| Build                                                   | Upload (gzip) | Route   | Records | Median | Over 10 ms | Over 50 ms | Highest |
| ------------------------------------------------------- | ------------- | ------- | ------- | ------ | ---------- | ---------- | ------- |
| `main`, version `33d18b4a-f1b0-4461-ae65-2b2d233e68b0`  | 1,097 KiB     | `GET /` | 60      | 7.5 ms | 16 (27%)   | 11         | 364 ms  |
|                                                         |               | `POST`  | 60      | 8 ms   | 18 (30%)   | 10         | 235 ms  |
| Brief 5, version `dac3f59c-5c7b-46a8-bc2a-9a9f71cd8694` | 1,137 KiB     | `GET /` | 57      | 8 ms   | 21 (37%)   | 10         | 354 ms  |
|                                                         |               | `POST`  | 58      | 7.5 ms | 17 (29%)   | 10         | 253 ms  |

Every request answered 200 and every record had outcome `ok`.

- `main`, `GET /`: 4, 4, 4, 5 (×4), 6 (×14), 7 (×9), 8, 8, 8, 9 (×8), 10,
  10, 10, 13, 13, 13, 15, 20, 61, 70, 91, 95, 96, 98, 128, 128, 131, 138, 364.
- `main`, `POST` (the stub): 3, 4 (×10), 5 (×5), 6 (×7), 7 (×5), 8 (×5),
  9 (×7), 10, 10, 11, 11, 11, 12, 13, 13, 16, 42, 52, 55, 91, 106, 107,
  109, 120, 145, 184, 235.
- Brief 5, `GET /`: 3, 4, 4, 4, 5 (×8), 6 (×7), 7 (×8), 8 (×6), 9, 10, 10,
  11, 12 (×4), 13, 14, 14, 14, 15, 17, 90, 104, 120, 129, 138, 145, 149,
  150, 244, 354.
- Brief 5, `POST` (a valid enquiry): 4 (×6), 5 (×10), 6 (×8), 7 (×5),
  8 (×6), 9, 9, 10 (×4), 11, 12, 19, 19, 22, 43, 45, 51, 52, 57, 59, 60,
  88, 137, 210, 248, 253.

What the comparison shows:

- **Brief 5 does not cause the slow group.** `main` has it too, in the same
  share and size. Measured back to back, the two builds are within a
  millisecond of each other on both routes.
- **A valid enquiry costs about what the stub did.** Median 7.5 ms against
  8 ms. The real validation adds no measurable CPU time.
- **The slow group arrived before Brief 5.** It was not seen in Brief 2.
  The bundle has grown since then (987 to 1,097 KiB compressed on `main`),
  and a fresh copy of the Worker must load all of it. That is the likely
  cause, but it is not proven: conditions on Cloudflare's side may also
  differ from Brief 2's day.

Outcome: **within the stop rule, at its edge.** Brief 5's own run has a
median of 7.5 ms for a valid enquiry, at or under 8 ms, and no request
`exceededCpu`. Both builds sit at the 8 ms line on both routes, so the
Brief 8 re-measurement, with the full homepage, is likely to cross it.
Whether to wait for Brief 8 or move to Workers Paid earlier is the
owner's decision.

`workers.dev` was left serving the Brief 5 build (version `dac3f59c`), from
its unmerged branch. That is acceptable before launch only. From Brief 13
the live Worker is deployed only from `main`.

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

Read on 17 November 2026 by Claude Code, from the agreement linked at
cloudflare.com/terms. To be confirmed by the owner before merge. This is a
reading of the text, not legal advice.

**Result: no restriction on commercial use found.** This is the point on
which Vercel's free plan failed, so it decides whether the verdict above
stands.

- **Governing agreement:** the Self-Serve Subscription Agreement ("Last
  Updated September 12, 2025") covers self-serve and free accounts. Workers
  also falls under the Developer Platform section of the Service-Specific
  Terms (last updated 28 September 2026).
- **Who may use it:** the agreement binds "you, or the Entity you represent"
  and is written for businesses as well as individuals. Nothing limits use to
  personal, hobby or non-commercial purposes, in the agreement or in the
  Developer Platform terms.
- **Free services (section 2.6):** stay free until a trial ends, a paid plan
  starts, or Cloudflare ends the free version "at its sole discretion".
  Cloudflare accepts no liability for harm from free services. Meaning: the
  free plan can be withdrawn, and option 2 (Workers Paid) is the way out.
- **Restrictions that touch this site (section 2.2.1):**
  - (h) no collecting card details on a site that uses free services. The
    enquiry form takes no payment, so this does not apply. It would if
    payments were ever added.
  - (a) no reselling, renting or sharing access to the services, and no
    signing up on a third party's behalf. This does not affect
    mendglass.com or the restaurant concept (Brief 17), which are both
    Mendglass's own sites on Mendglass's own account. It would apply to a
    client's site hosted on this account. Client sites are planned for a
    no-code builder instead, so it does not apply now.
  - (c) no getting round usage limits or quotas. The stop rule moves to a
    paid plan rather than working around the CPU limit, which keeps to this.
- **Developer Platform terms:** Cloudflare "may temporarily limit" requests
  if they burden its network; no volumetric attacks, phishing or deceptive
  subdomain names. None of these affect this site.

Effect on the verdict: none. The free plan's terms allow a commercial studio
site, so the verdict stands.

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
- cloudflare.com/terms (Self-Serve Subscription Agreement)
- cloudflare.com/service-specific-terms-developer-platform/
- developers.cloudflare.com/workers/platform/pricing/
