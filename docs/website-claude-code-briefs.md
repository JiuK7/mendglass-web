# mendglass-web: Claude Code briefs

Status: **drafted** 16 Nov 2026. Written for execution by any model. Briefs 14 to 22 were expanded on 16 Nov and have not been reviewed against a real build.
Companion to `claude/website-roadmap-v2.md`. Decisions D1 to D3 (16 Nov) are built in.

## How to use this document

1. Save this file in the repository as `docs/website-claude-code-briefs.md`, the name `CLAUDE.md` refers to, and the standing rules below as `CLAUDE.md`. If the repository already has it as `docs/briefs.md`, rename the file or change item 5 of `CLAUDE.md`, so there is one name.
2. Copy the three reference documents into `docs/reference/` (read-only): Production Brief v1.1, Engineering Definition v1, Brand System v1. Do not copy the roadmap, the LOG or anything naming prospects: the repository is public.
3. For each session, tell Claude Code: "Read CLAUDE.md, then do Brief N from docs/website-claude-code-briefs.md and nothing else. Open a pull request."
4. Bring the pull request to the Website Build chat for review against the brief's "Done when" list.
5. Before merging, answer the brief's "Explain it" questions without notes.

Tooling changes quickly. Where a brief says **check the current docs**, Claude Code must read the official documentation before acting and say what it found, and must not rely on what it remembers.

---

## Standing rules (save as `CLAUDE.md`)

Revised 16 Nov 2026: adds the stop-and-ask rule, the end-of-task report format and the glossary rule. The older line "Add a dependency only if the brief names it or you justify it in the PR" is removed because it contradicted the stop-and-ask rule (found in the pull request #1 review).

````markdown
# mendglass-web

Production website for Mendglass, an independent web studio focused on
restaurant websites. Also the owner's software-engineering portfolio piece.

## Authority
1. docs/reference/01 Production Brief v1.1: scope, routes, copy, composition.
2. docs/reference/03 Brand System v1: identity, palette, type.
3. docs/reference/02 Engineering Definition v1: stack, boundaries, tests.
4. docs/decisions/: where this build departs from the above (see ADR 004, hosting).
5. docs/website-claude-code-briefs.md: the current step. Do one brief per
   session, nothing more.

## Hard rules
- Copy is locked. Use the approved strings from reference/01 word for word.
  Never rewrite, extend or "improve" a claim. Ask if a string is missing.
- Never invent clients, testimonials, results, metrics, awards or experience.
- No routes beyond the brief. No placeholder pages. No links to routes that
  do not exist yet.
- Server Components by default. A client component needs a stated reason.
- Host-neutral code: no Cloudflare or Vercel imports outside config files.
- No secrets in the repo. No personal data in logs.
- Non-goals (reference/02 section 23): no CMS, database, auth, global state
  library, Storybook, monorepo, WebGL, generic section abstractions.

## Stack
Next.js 16 App Router, React (version required by Next), TypeScript strict,
Tailwind CSS 4, Zod, Vitest + React Testing Library, Playwright, ESLint flat
config, Prettier, pnpm, Node 24. Hosted on Cloudflare Workers via
@opennextjs/cloudflare.

## Working method
- One brief = one branch = one pull request to main. Conventional prefixes
  (feat:, fix:, test:, docs:, chore:). Small, explainable commits.
- Before opening the PR run: pnpm lint, pnpm typecheck, pnpm test,
  pnpm build, pnpm test:e2e. Paste the results in the PR.
- The PR description lists: what changed, how each "Done when" item was
  checked, anything not done, and any departure from the brief.
- Where the brief says "check the current docs", read the official docs
  first and cite what you found.
- If a brief conflicts with a reference document, stop and report it.
- Stop and ask before: adding a dependency the brief does not name,
  departing from the brief, or changing anything outside this repository.
- Do not send running commentary while working. Send one report at the end,
  in the format below.
- The owner takes that report and the PR link to a separate review chat
  before merging. Write the report so it makes sense to a reader who has
  not seen this session.

## How to report to the owner

The owner is learning this stack while building it. Write every end-of-task
report so someone without deep knowledge of the tools can follow it and act
on it.

### Structure (use these headings, in this order)

**Result**: one or two sentences. What is finished and where it is (PR link,
branch). Say plainly whether it is done, partly done or blocked.

**What I did**: a short list of the changes, in plain words. Describe what
each change is for, not just its name.

**What you need to do**: numbered actions for the owner, most urgent first.
For each: the exact command or click, where to run it, what it does, and how
to tell it worked. Write "Nothing" if there is nothing.

**Decisions for you**: anything I chose that the owner might want to change,
and anything I need a decision on. For each: the options, what I recommend,
and why. Write "None" if there are none.

**Things to know**: every departure from the brief, every surprise, warning
or risk, all in this one place. For each: what it is, why it matters, and
whether action is needed now, later or never. If it affects a later brief,
name the brief.

**Why I did it this way**: the reasoning behind the main choices, two or
three sentences each. Name the brief or reference section each one follows.

**Not done or not checked**: what was skipped, what was not tested, and what
is assumed. Never describe something as working unless I ran it and saw it
pass.

**Check your understanding**: if the brief has an "Explain it" list, a
two-sentence plain answer to each question.

**Next step**: the single next thing, and who does it (owner or Claude Code).

### Writing rules

- Plain English. Short sentences. One idea per bullet.
- Explain every technical term the first time it appears in a report, in a
  few words in brackets. Example: "the lockfile (the file that pins exact
  package versions)".
- Say why a thing matters before giving its detail.
- No lists of version numbers in the report unless a version is the point.
  Put them in the PR description.
- Never refer to something by a label invented while working. Say the longer
  thing the label stands for.
- Use the status words exactly: done, partly done, blocked, not verified.
- Keep the report under about 350 words, not counting "Check your
  understanding", unless the owner asks for more.

### Glossary

- Keep docs/glossary.md. Each time a report explains a technical term for
  the first time, add the term and its one-line plain explanation to that
  file in the same PR, in alphabetical order.
- Check the glossary before explaining a term, and reuse its wording.
- The glossary holds terms about this codebase and its tools only. No
  business, client or prospect information.
````

---

# Phase 1: thin slice

## Brief 1: Scaffold

**Owner first:** create a public GitHub repository `mendglass-web`; copy the three reference documents into `docs/reference/`; keep the brand assets in their local folder, outside the repo, until Brief 3.

**Notes for this brief**
- The repository already holds `CLAUDE.md`, `README.md` and `docs/`. If the scaffolding tool refuses a folder that is not empty, scaffold in a temporary folder and move the result in. Keep the existing files and the Git history.
- The OpenNext documentation says Windows support is not guaranteed. On a Windows machine, work inside WSL2 with the repository on the Linux filesystem. Record the development environment in the README.
- This repository is public. `claude/website-roadmap-v2.md` and the project LOG name prospects and must never be committed.

**Do**
- Create a Next.js 16 App Router project: TypeScript strict, Tailwind 4, ESLint flat config with Core Web Vitals rules, Prettier, Vitest with React Testing Library, Playwright.
- `.nvmrc` set to 24; `packageManager` pinned to a pnpm version; lockfile committed.
- Create only the `src/` folders this phase uses: `app/(site)`, `app/api/enquiry`, `components/{layout,home,forms,ui}`, `content`, `lib/{validation,integrations}`, `styles`.
- Scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`.
- `.env.example` (names and descriptions only), README skeleton, `docs/decisions/001-stack-and-rendering.md`.
- Remove every template asset, sample style and default page content.

**Done when**
- From a fresh clone, `pnpm install --frozen-lockfile` and all five checks pass.
- One Playwright test loads `/` and finds the page's `h1`.
- No template leftovers remain.
- ADR 001 explains server rendering by default and the pinned versions.

**Explain it:** why App Router with Server Components by default; what a frozen lockfile guarantees; why strict mode.
**Estimate:** 2 hours.

## Brief 2: CI and the Cloudflare go/no-go test

As run, 17 Nov 2026. Results and verdict in ADR 004.

**Owner first:** create a free Cloudflare account. Read the free plan's terms for any restriction on commercial use and record the result.

**Do**
- GitHub Actions on pull requests to `main`: install, lint, typecheck, unit tests, build, then one Playwright smoke test in Chromium. Upload the Playwright report on failure. Branch protection requires the checks. The workflow reads the Node version from `.nvmrc`, so CI and local development match.
- **Check the current docs** at opennext.js.org/cloudflare, then add `@opennextjs/cloudflare` and `wrangler`, `wrangler.jsonc`, `open-next.config.ts`, `public/_headers` for static asset caching, `.dev.vars` (gitignored), `.open-next` in `.gitignore`, and `preview` and `deploy` scripts.
- Choose the simplest caching option that serves prerendered pages with no paid or extra service. Say which and why.
- Add a stub `POST /api/enquiry` that parses JSON with Zod and returns 200. It is replaced in Brief 5.
- Deploy to a `workers.dev` address (no custom domain).
- Find out whether preview deployments per pull request work on the free plan, and how environment values differ between preview and production. Report; do not build anything elaborate.
- Write `docs/decisions/004-hosting-cloudflare-workers.md`: the reason (cost against a small budget), what changes from reference/02, the measurements below, the fallback (Vercel Pro), and why OpenNext not vinext.

**Measure and record in ADR 004**
- Bundle size, compressed and uncompressed, with the method in ADR 004. The two size limits disagree (see ADR 004's note).
- CPU time for `GET /` and for the stub `POST`, against the 10 ms free limit. Say how it was measured.
- Whether `/` is served as a static asset or runs the Worker.
- Whether the adapter supports `cacheComponents` and `partialPrefetching`, which the scaffold enabled by default. If it does not, turn them off and say so.

**Done when**
- A pull request shows green checks; a deliberately failing lint commit blocks merge (show once, revert).
- The `workers.dev` deployment serves `/` and the stub endpoint.
- ADR 004 holds the three measurements and a clear verdict: go, or switch to the fallback.
- `grep` finds no Cloudflare import under `src/`.

**Stop and report** if either limit is exceeded and there is no simple fix. Do not work around a limit with architecture.
**Explain it:** what CI catches that a deploy doesn't; what the adapter does; why the limits matter for a mostly static site.
**Estimate:** 3 to 4 hours.

## Brief 3: Tokens, type and brand assets

**Do**
- Tailwind 4 `@theme` tokens from Brand System sections 5 and 6: palette, a neutral scale tinted with Warm Stone, radius family of 6 to 10px, type scales for editorial and system modes.
- Instrument Sans through `next/font/local` (font files committed; check the licence file is included).
- Favicons using `app/icon` conventions and Brand System section 4 sizes. Wordmark as SVG in `public/brand/`.
- Focus ring: Carbon on light sections, Mineral on dark. Optical Accent `#C5E0DF` fails 3:1 on Mineral, so it is never a focus indicator.

**Done when**
- Components use colour only through tokens (no hex values in components).
- The network panel shows no request to a font CDN.
- Favicons display in Chromium, Firefox and Safari.
- Wordmark is Carbon on light and Mineral on dark, with no effects, gradients or recolouring.

**Explain it:** why tokens live in CSS; why local fonts.
**Estimate:** 2 hours.

## Brief 4: Layout

**Do**
- Root layout: `lang="en-GB"`, `metadataBase` from a single site-origin constant.
- Skip link as the first focusable element.
- Header: wordmark (links to `/`) and "Discuss your website" (to `/contact`). No other navigation. No MobileMenu.
- Footer: Contact · Privacy · London, UK · © Mendglass 2026.
- Button and link primitives: primary and secondary (Brand System section 10).

**Done when**
- None of these files is a client component.
- Focus is visible on every control; touch targets are at least 44px.
- No link points to a route that does not exist.
- Text colour pairings are written down (which text token may sit on which background), and a test checks every allowed pair at 4.5:1 or more. Muted greys either pass on Warm Stone and Mist or are not allowed there. (From the pull request #3 review: `neutral` is 3.58:1 on Warm Stone and 2.76:1 on Mist; `neutral-dark` is 4.31:1 on Mist.)
- `font-medium` exists in the built CSS, which confirms that clearing the font settings with `--font-*: initial` did not remove Tailwind's font-weight utilities.

**Explain it:** why the layout ships no client JavaScript.
**Estimate:** 2 hours.

## Brief 5: Enquiry core (server only)

**Do**
- `src/lib/validation/enquiry.ts`: Zod input schema, a normalisation step, and the DTO:

```ts
type Enquiry = {
  name: string
  email: string
  businessName: string
  websiteUrl?: string
  helpType: 'new-website' | 'website-redesign' | 'ongoing-care' | 'not-sure' | 'other'
  description: string
}
```

- Normalisation: trim text; lower-case email; accept a bare domain for `websiteUrl` by adding `https://`.
- Limits (confirm at review): name ≤100, email ≤254, businessName ≤150, description 10 to 2000. Reject control characters.
- A honeypot field.
- `src/lib/env.ts`: Zod-validated server environment. `ENQUIRY_SINK` is `test`, `email` or `n8n`, and each value requires its own variables. **Production refuses to start with `test`.** Production is identified by an explicit `SITE_ENV=production`, not a host-specific variable.
- `EnquirySink` interface and the `test` sink (no network, no personal data logged):

```ts
interface EnquirySink {
  deliver(enquiry: Enquiry, meta: EnquiryMeta, signal: AbortSignal): Promise<void>
}
```

- `createEnquiryHandler(sink)` used by `route.ts`, so tests can inject a failing or slow sink.

**Responses**

| Request | Response |
|---|---|
| Not JSON | 415 |
| Body over 16 KB (check declared and actual length) | 413 |
| Honeypot filled | 200 `accepted`, nothing delivered |
| Fails validation | 422 `invalid` with field errors |
| Sink error or 8-second timeout | 503 `unavailable` |
| Success | 200 `accepted` |

Every response carries a `requestId`. Logs hold only `requestId`, outcome and `helpType`.

**Done when**
- Vitest covers each field's valid and invalid cases, normalisation, every environment branch, and every response class through injected sinks.
- Searching `src/` finds no Airtable or n8n identifiers.
- `docs/decisions/002-enquiry-integration-boundary.md` records the boundary, the interim sink and its exit criteria.
- CPU time for a valid `POST` on the deployed Worker is re-measured with the method in ADR 004 and still under the limit.

**Explain it:** why validate on the server; why the honeypot returns success; 503 versus 500; why no personal data in logs; why the sink is an interface.
**Estimate:** 4 hours.

## Brief 6: Email sink

**Owner first:** create a Resend account, verify a sending subdomain (add only Resend's DNS records; leave existing mail records alone), create a sending-only API key.

**Do**
- `email` sink calling Resend's HTTP API with `fetch`. No SDK.
- Plain text. Subject "Website enquiry — {businessName}" with CR and LF stripped. Body: every field, `submittedAt`, `requestId`. Reply-To is the enquirer.
- Honour the abort signal and treat non-2xx as failure.

**Done when**
- Vitest with mocked `fetch` checks request shape, Reply-To, header-injection neutralised, non-2xx throws, timeout honoured.
- One manual send from local development reaches the owner's inbox; "Show original" shows SPF and DKIM passing.
- The key exists only as a production secret and in gitignored local files.

**Explain it:** why an HTTP API on a serverless runtime; credential scope; what changes when n8n returns.
**Estimate:** 2 hours.

## Brief 7: Contact page and form

**Owner first:** approve the "what happens next" copy (D6) drafted in the Website Build chat.

**Do**
- `/contact` as a Server Component with the approved copy. `EnquiryForm` is the page's only client component.
- Visible labels; `helpType` as a radio group or select; client checks reuse the same Zod schema.
- Submit disabled while pending. An `aria-live` region announces status. Errors linked with `aria-describedby`. Focus moves to the error summary on failure and to the success message on success.
- Success replaces the form. A 503 shows a retry message (and the direct email only if D6 approved one).
- **Restore (D1):** header "Discuss your website" to `/contact`; footer "Contact".

**Done when**
- RTL covers pending, errors as text, success and failure.
- Playwright covers: header CTA reaches `/contact`; invalid submission shows errors; valid submission succeeds against the test sink; a simulated 503 shows the retry message; the form completes by keyboard only.
- The page makes no third-party requests.

**Explain it:** the client boundary; why the schema is shared; how double submission is prevented.
**Estimate:** 4 hours.

## Brief 8: Homepage (two pull requests)

**Owner first:** supply three photographs with source and licence (D4); confirm section colours (D7) and image delivery (D9).

**Do**
- `src/content/home.ts` holds reference/01 section 5 copy word for word.
- **Leave out (D1):** the Featured Concept Project section; the CTAs "View our work", "Explore services", "About Mendglass". Section copy is otherwise complete.
- **8a:** Hero, Restaurant Customer Journeys, Services. **8b:** How Mendglass Works, About Mendglass, Final CTA.
- Explicit section components. No generic section abstraction, no cards.
- Compositions per reference/01 section 5: hero proposition and actions before the image on mobile; journeys as an open indexed list with fine separators, rows not links; services as an offset image with three ruled rows; process as number, heading and body rows, with a narrow number column on mobile.
- Hero ships with a plain image. No OpticalPane.
- The pull request #1 review noted that `pnpm-workspace.yaml` blocks the install script of `sharp`, an image library. Find out whether the D9 image approach needs it, and allow it only if it does. This was an inference, not tested.
- Images per D9, with correct `sizes`; hero image prioritised. Record each image's source, licence and role in `src/content/images.ts`.

**Done when**
- Every string matches reference/01 section 5 (the reviewer checks this line by line).
- One `h1`; headings in logical order.
- No horizontal scroll at 360, 768, 1280 and 1440.
- Screenshots at 390 and 1440 are in the pull request.
- No new client components. Every image has alt text or is marked decorative.
- Bundle size re-recorded, compressed and uncompressed, with the method in ADR 004. The two size limits disagree (see ADR 004's note).
- CPU time re-measured per ADR 004's stop rule: `wrangler tail --format json` on the deployed Worker, at least 40 requests per route, median at or under 8 ms, and no request with outcome `exceededCpu`. Results recorded in ADR 004. If either fails, stop and report: ADR 004 says move to Workers Paid.

**Explain it:** content in TypeScript rather than a CMS; recomposing for mobile rather than shrinking.
**Estimate:** 7 to 9 hours across both.

## Brief 9: Privacy page

**Owner first:** supply the privacy facts (D5) and approve the copy drafted in the Website Build chat from the flow as built.

**Do**
- `/privacy` with the approved copy: enquiry fields and purpose; lawful basis; Cloudflare hosting and its logs; Resend, including transfer outside the UK; the Google Workspace mailbox; Airtable (manual entry); no analytics and no non-essential cookies or storage; retention; rights; privacy contact; the right to complain to the ICO.
- A Playwright test visits all three routes, submits the form, and asserts no cookies and no localStorage or sessionStorage entries.
- **Restore (D1):** footer "Privacy".

**Done when**
- Every processor on the page exists in code or config, and every processor in code or config is on the page.
- The storage test passes in CI.

**Explain it:** why no consent banner is needed, and how the test keeps that true.
**Estimate:** 2 hours.

## Brief 10: Production baseline

**Do**
- Title, description, canonical URL and Open Graph tags per route; one static sharing image.
- `sitemap.ts` with exactly the three `https://mendglass.com` URLs. `robots.ts` disallows everything unless `SITE_ENV=production`.
- `not-found`, `error` and `global-error` states, branded, with no technical details.
- Security headers: HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` with camera, microphone and geolocation off, and a partial CSP: `frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`.
- **Check the current docs** for how headers reach both HTML responses and static assets on this host; static assets may need `public/_headers`.

**Done when**
- `curl -I` on the deployed preview shows the headers on an HTML route and on a static asset.
- An unknown path returns the branded 404.
- The non-production robots file disallows crawling.

**Explain it:** why the CSP is partial (nonces would force dynamic rendering); what the canonical origin is for.
**Estimate:** 3 hours.

## Brief 11: QA

**Do**
- Run the reference/02 section 17 accessibility checklist on all three routes and commit the results.
- Run the critical Playwright flows in Chromium, Firefox and WebKit.
- Run Lighthouse on the deployed preview and record the numbers. Promise no targets.

**Owner:** check the site on a real iPhone (Safari) and a real Android phone (Chrome) and sign off.

**Done when:** checklist committed; three browsers pass; owner has signed off on phones.
**Estimate:** 3 hours.

## Brief 12: Documentation

**Do**
- README in reference/02 section 21 order, describing the thin slice as built.
- `docs/architecture.md` with the boundary diagram, including the interim sink and the host.
- Finalise ADRs 001, 002 and 004. ADR 003 waits for OpticalPane.

**Done when:** the owner can explain the README and each ADR without notes, checked by a question round in the Website Build chat.
**Estimate:** 2 hours.

## Brief 13: Production deploy

This changes live systems. Every DNS action is the owner's, taken only after the owner approves the plan in the Website Build chat.

**Before anything changes**
- Export or screenshot every existing DNS record for `mendglass.com`: MX, SPF, DKIM, DMARC, any verification records, and the current apex and `www` records.
- Send and receive a test email and confirm SPF, DKIM and DMARC pass. This is the baseline.
- **Check the current docs** for attaching a custom domain to a Worker and whether the domain's DNS must be hosted on Cloudflare.
- Deploy the final build with `pnpm run deploy` (not `pnpm deploy`, which is a built-in pnpm command) and re-measure CPU time per ADR 004's stop rule: `wrangler tail --format json`, at least 40 requests per route, median at or under 8 ms, and no request with outcome `exceededCpu`. Record the results in ADR 004. If it fails, move to Workers Paid before attaching the domain.

**Do**
- If DNS must move: add the domain to Cloudflare, compare its imported records against the export one by one, fix any difference, and only then change nameservers at the registrar.
- Set production secrets and `SITE_ENV=production`, `ENQUIRY_SINK=email`.
- Use a Wrangler environment for production (an `env.production` block in `wrangler.jsonc` with `SITE_ENV=production` and `ENQUIRY_SINK=email`), rather than editing the top-level `preview` value. Production deploys use `pnpm run deploy -- --env production`, only from `main`. The real enquiry from the owner's phone (already in Done when) is the final check that the email sink is live.
- Attach `mendglass.com`; redirect `www` to it.
- If the free plan allows one, add a rate-limiting rule on `/api/enquiry`.

**Done when**
- `https://mendglass.com` serves all three routes; `www` redirects; TLS is valid.
- A real enquiry from the owner's phone arrives with the correct Reply-To.
- Email to and from `mendglass.com` still passes SPF, DKIM and DMARC.
- A Playwright smoke run against production passes without submitting the form.
- A LOG entry is written.

**Rollback:** restore the previous nameservers or records from the export.
**Estimate:** 2 to 3 hours, plus DNS propagation time.

---

# Later phases

Expanded 16 Nov 2026 to the same level of detail as Phase 1. Nothing here is implemented, and no later brief has been reviewed against a real repository, because Phase 1 is not built yet. Expect to adjust file names and component names to match what Phase 1 actually produced.

**How gaps are marked**
- **[Needs decision]** means the owner must decide before the session starts. A recommendation follows each one.
- **[Needs copy]** means wording that is not yet approved. Claude Code must not write it. It comes from `claude/website-copy-remaining-pages-draft-v1.md` (called "the copy document" below) once the owner approves it, or from the Website Build chat.
- If a session starts and a gap is still open, Claude Code stops and reports it. It does not fill the gap.

**If Brief 2 ended in the fallback (Vercel Pro):** read every Cloudflare instruction below as "the host's equivalent", and skip the bundle-size and CPU-time checks (the method in ADR 004).

## Order and dependencies

| Brief | Needs first | Can start when |
|---|---|---|
| 14 Services | Approved Part A of the copy document; decisions A8.1 to A8.5 | Brief 13 is done |
| 15 About | Approved Part B; decisions B3.1 to B3.4 | Brief 13 is done. Independent of 14. |
| 16 MobileMenu | At least one of 14 or 15 merged | After 14 or 15 |
| 17 Restaurant concept | The concept decision (roadmap section 5) and the concept brief (17a) | Any time after Brief 13. Independent of 14 to 16. |
| 18 Work index | Concept name and one genuine screenshot | The concept is live |
| 19 Case study and homepage section | The concept is live; case-study copy approved | After 18 |
| 20 OpticalPane | Nothing | Any time after Brief 13 |
| 21 Analytics and consent | Owner accounts; approved privacy copy for analytics | Last, and only when there is traffic worth measuring |
| 22 n8n sink | The LOG rule of 13 Nov is met; n8n renewed | When triggered |

## Rules for every later brief

These apply to Briefs 14 to 22 in `mendglass-web`, on top of `CLAUDE.md`.

1. **Restore links only in the pull request that ships their route (D1).** Before merge, no link on any page points to a route that does not exist.
2. **New public route checklist.** Each new route gets: title, description, canonical URL and Open Graph tags; a sitemap entry (and the sitemap test's expected list is updated); a place in the Brief 9 storage test's list of routes; one `h1`; a Playwright test that loads it and checks the `h1`.
3. **Internal link test.** If the repository has no test that follows every internal link from every route and expects a successful response, Brief 14 adds one. Later briefs keep it passing.
4. **Copy.** Strings marked locked in the copy document must match reference/01 word for word. Strings marked new are used only as approved. Content lives in typed modules under `src/content`.
5. **No new client components** unless the brief names one.
6. **Privacy check.** If a brief changes what data the site collects, where it goes, or what is stored in the browser, the Privacy page changes in the same pull request, with owner-approved wording.
7. **Size check.** Re-record the bundle size in the pull request, compressed and uncompressed, with the method in ADR 004. The two size limits disagree (see ADR 004's note).
8. **Screenshots.** Any pull request that changes what a visitor sees includes screenshots at 390 and 1440 wide.

---

# Phase 2: Services and About

## Brief 14: Services page

**Owner first**
- Approve Part A of the copy document, including metadata (A1).
- Decide A8.1 to A8.5. **[Needs decision]** Recommendations: keep the "Good to know" section only if every line is true for every client (A8.1); leave the ownership line out until pricing and terms are approved (A8.2); keep the A8.3 and A8.4 lines only if you will do them every time.
- **[Needs decision]** Whether the page has a photograph. Recommendation: none, or reuse one already in `src/content/images.ts`. A new image needs a source and licence record first.
- **[Needs decision]** Mobile header before Brief 16. Recommendation below under "Do".
- If the "approved Relume/content work" that reference/01 section 6 mentions exists in your local folder, compare it with Part A before approving. It has not been seen in this project.

**Do**
- `src/content/services.ts`: typed content for the page header, the three services (number, name, locked summary, "Who it's for", "What the work covers" list), the optional "Good to know" lines and the metadata.
- `/services` as Server Components, in this order: page header; the three services; guest journeys; process; "Good to know" if approved; closing CTA.
- **Three services:** open ruled rows or an editorial sequence, 01 to 03. No three equal cards (reference/01 5.4). Each service's name is an `h2`.
- **Guest journeys and process:** these repeat the homepage's locked copy. Reuse the homepage's components if they can be used unchanged with the same content. If reuse needs new props or variants, write a second explicit component. Do not build a generic section component. Whichever is chosen, the locked strings exist in one content module only.
- **Process heading:** "How Mendglass works" (new string, A5), as an `h2`.
- **Closing CTA:** reuse the homepage's final CTA component.
- **Restore (D1):** the "Explore services" link in the homepage Services section; "Services" in the footer; "Services" in the header.
- **Header on narrow screens:** MobileMenu does not exist until Brief 16. Until then, show header navigation links from the desktop breakpoint up only. On narrow screens the header stays as the wordmark and "Discuss your website", and the new link is reachable from the footer and the homepage. State this in the pull request.
- Keep navigation items in one typed list (for example `src/content/navigation.ts`) that header and footer both read, so a later brief adds a route in one place.
- Add the internal link test (rule 3).
- Section colours: follow the pattern approved for the homepage (D7). Propose the sequence in the pull request with screenshots.

**Done when**
- `/services` is live on the preview with the approved copy. The reviewer checks every locked string line by line against reference/01 5.3, 5.4, 5.6 and 5.8.
- The page adds no product, tier, price, timescale or commitment beyond the approved copy.
- One `h1`; headings in logical order; no horizontal scroll at 360, 768, 1280 and 1440.
- The restored links resolve. The internal link test passes.
- The new-route checklist (rule 2) is complete. The sitemap lists four URLs.
- No new client components.
- The accessibility checklist (reference/02 section 17) is run on the new route and the result committed.

**Explain it:** why the locked copy lives in one module; when reusing a component is right and when a second explicit one is better; why links are restored in this pull request and not earlier.
**Estimate:** 4 to 5 hours.

## Brief 15: About page

**Owner first**
- Approve Part B of the copy document, including metadata (B1).
- Decide B3.1 to B3.4. **[Needs decision]** B3.1: name yourself or not. If yes, supply the one or two true facts for the personal paragraph. **[Needs copy]** That paragraph has no default text.
- **[Needs decision]** Photograph of the owner. Only with B3.1. Recommendation: none at first.

**Do**
- `src/content/about.ts`: typed content for the heading, opening, three sections, optional personal paragraph, location line and metadata.
- `/about` as Server Components: `h1`; opening; "Why restaurants"; "How the work is done" (with its four short principles); "Working independently"; personal paragraph if approved; location line; closing CTA.
- A quiet editorial composition (reference/01 5.7): text-led, generous space, no cards.
- If an image is used, it is illustrative, carries no caption implying a client or team member, and has a record in `src/content/images.ts`.
- **Restore (D1):** the "About Mendglass" link in the homepage About section; "About" in footer and header, using the same narrow-screen rule as Brief 14 if Brief 16 is not merged.
- If the personal paragraph is not approved, the component renders nothing for it. No placeholder.

**Done when**
- `/about` is live on the preview with the approved copy. Locked strings match reference/01 5.7 and 5.8.
- The page states no team size, history, award, year count or client.
- The new-route checklist (rule 2) is complete; the internal link test passes; the sitemap lists one more URL.
- No new client components; no horizontal scroll at the four widths; accessibility checklist run and committed.

**Explain it:** why an optional paragraph renders nothing when absent; what "illustrative image" means in practice.
**Estimate:** 2 to 3 hours.

## Brief 16: MobileMenu

**Owner first:** approve the labels in the copy document, E3 ("Menu", "Close", "Main", "Footer", "Mendglass home").

**Do**
- `MobileMenu` in `src/components/layout/`: a client component, and the header's only client child. The header itself stays a Server Component.
- It reads the same typed navigation list as the header and footer. It shows only routes that exist (D1). "Work" joins the list in Brief 18.
- **Behaviour**
  - Closed by default. A button labelled "Menu" opens it; the same control, labelled "Close", closes it.
  - The button has `aria-expanded` and `aria-controls`.
  - On open, focus moves into the menu. While open, Tab and Shift+Tab stay inside it. Escape closes it. On close, focus returns to the button.
  - Choosing a link closes the menu.
  - The page behind does not scroll while the menu is open, if the menu covers the page.
  - From the desktop breakpoint up, the button is not rendered or is hidden from everyone, and the inline links from Briefs 14 and 15 show.
- **Check the current docs** for the native `<dialog>` element (`showModal`), which provides focus containment and Escape handling in current browsers. Prefer it over hand-written focus trapping if it meets every behaviour above in Chromium, Firefox and WebKit. Do not add a dependency for this.
- Any open or close motion is short and is removed under `prefers-reduced-motion`.
- Touch targets at least 44px. The header does not break at 200% text size or at 320px wide (reference/02 section 17, zoom and reflow).
- Remove the narrow-screen interim rule from Briefs 14 and 15: on narrow screens the header now shows the wordmark, the "Discuss your website" link and the menu button.
- Without JavaScript the menu cannot open. The footer still carries every link. Say so in the pull request; do not build a second mechanism.

**Done when**
- RTL covers: closed by default; opens and closes; `aria-expanded` changes; Escape closes; focus returns to the button.
- Playwright at 390 wide covers: open the menu; Tab does not leave it; follow a link; the new page loads with the menu closed. The same test passes in Chromium, Firefox and WebKit.
- The header file has no `'use client'`; exactly one client component is imported by it.
- The reference/02 section 17 item "Mobile-menu focus behaviour and dismissal" is checked by hand with a keyboard and with VoiceOver on an iPhone (owner), and recorded.

**Explain it:** why the menu is a client component and the header is not; what a focus trap is for; why focus returns to the button.
**Estimate:** 2 to 4 hours.

---

# Phase 3: restaurant concept and Work

## Brief 17: Restaurant concept (separate repository)

The concept is a fictional restaurant's website, designed and built by Mendglass to show the approach. It is the one piece of proof the main site can show. Nothing about it may read as a real restaurant or a real client.

It runs as four parts. 17a has no code.

### 17a: Concept brief (Website Build chat and owner; no Claude Code)

**[Needs decision]** Which kind of restaurant the concept shows. Roadmap section 5 has the options. The provisional view there is a neighbourhood restaurant with a function room and group bookings. It should be settled from real prospect conversations.

The Website Build chat drafts a one-page concept brief and the owner approves it. It is saved in the concept repository as `docs/concept-brief.md`. It must contain:

| Item | Rule |
|---|---|
| Fictional name | **Owner checks** it against real restaurants: a web search, Google Maps for London, and Companies House. No match and no near-match with a trading restaurant. |
| Kind of restaurant, cuisine, price level | Fictional. Not modelled on one identifiable real restaurant. |
| Location | A real area may be named. No real street address. |
| Phone and email | A number from Ofcom's range reserved for drama use (**check Ofcom's current list**; not verified here). An address at a reserved example domain. Never a real business's details. |
| Guest journeys | The three from reference/01 5.3, stated for this restaurant. |
| Pages | See 17c. Final list approved here. |
| Identity | Name treatment, a small palette, one or two typefaces with their licences. It must not reuse the Mendglass identity, and must not copy a real restaurant's branding. |
| Menu | Fictional dishes and prices. |
| Photography | Source and licence for each image. No image showing a real restaurant's name, signage or branding. |
| Address of the site | **[Needs decision]** Recommendation: a subdomain of `mendglass.com`, which costs nothing and makes the ownership obvious. |
| Search engines | **[Needs decision]** Recommendation: `noindex` on every page, so a fictional restaurant does not appear in search results as if it were real. Visitors arrive from the Mendglass case study. |

### 17b: Scaffold

**Owner first:** create a public repository for the concept (name from the concept brief). Copy in `CLAUDE.md` with its authority list rewritten for this repository: the concept brief first, then reference/02 for engineering standards. The Mendglass Production Brief and Brand System do not govern the concept's content or look.

**Do**
- Same stack and same five checks as `mendglass-web`. Start from the same scaffold choices; copy configuration files across by hand. **No shared package, no monorepo, no Git submodule** (reference/02 sections 3 and 23).
- CI as in Brief 2. Deploy to the host chosen in ADR 004. Record bundle size and CPU time again for this project.
- A persistent concept label component, used in the root layout so it is on every page. **[Needs copy]** Proposed wording for the owner to approve: "Concept project by Mendglass. Not a real restaurant." with a link to the Mendglass case study (the link is added in Brief 19; until then, to `https://mendglass.com`).
- `robots` and page metadata per the search-engine decision above.
- README stating what the project is, that it is fictional, and who made it.

**Done when:** checks pass from a fresh clone; the label shows on the one page that exists; the deployment serves it; no Mendglass brand asset is in the repository except in the label.

### 17c: Pages and journeys (two or three pull requests)

**Do**
- Pages, subject to the approved concept brief: Home; Menu; Private dining, events or groups (whichever the concept offers); Visit (hours, location, how to get there); Book; Enquire.
- **Journey 01, Discover → Menu → Book:** a booking action visible on every page. The menu is real HTML pages that read well on a phone, not a PDF.
- **Journey 02, Private dining → Details → Enquire:** enough detail to judge the offer (capacity, what is included, how to ask), then an enquiry form.
- **Journey 03, Visit → Hours & location → Go:** hours, area and directions in text, one step from any page.
- **Booking is a demonstration.** No real booking system and no fake confirmation. The booking step states plainly that in a real project this connects to the restaurant's own booking platform, and it collects nothing.
- **The enquiry form is a demonstration.** It validates in the browser and shows a clearly labelled demonstration success state. It sends nothing to a server and stores nothing. This keeps the concept free of personal data, so it needs no privacy processing. A short line on the page says so.
- **No `Restaurant` structured data** (schema.org markup). Marking up a fictional restaurant for search engines would be misleading. The case study can say a real project would add it.
- Mobile first. Recompose layouts for larger screens; do not shrink a desktop design.
- Content in typed modules. Image provenance recorded as in `mendglass-web`.
- No map embed or other third-party request unless the concept brief approves it. A static map image or a text address is enough.

**Done when**
- Each journey can be completed on a phone, start to finish, by keyboard and by touch.
- The concept label is visible on every page, checked by a Playwright test that visits every route.
- A Playwright test asserts no cookies, no `localStorage` or `sessionStorage` entries, and no third-party requests.
- No real restaurant's name, branding, address, phone number or photograph of its signage appears.
- No horizontal scroll at 360, 768, 1280 and 1440. Screenshots at 390 and 1440 in each pull request.

### 17d: QA and launch

**Do**
- Accessibility checklist (reference/02 section 17) on every page; results committed.
- Critical flows in Chromium, Firefox and WebKit.
- Lighthouse on the deployed site: record the numbers, the date and the tool version. These are the only performance figures the case study may quote.
- Attach the approved address. If it is a subdomain of `mendglass.com`, the DNS change is the owner's, and the mail records are left alone.

**Owner:** check every journey on a real iPhone and a real Android phone. Take the screenshots the case study will use ("On a phone", copy document D3) from those devices.

**Done when:** the concept is live at its own address, labelled on every page; the owner has signed off on phones; a LOG entry is written.

**Explain it (whole brief):** why the concept has its own repository; why the form sends nothing; why a fictional restaurant should not be marked up for search engines; what would change for a real client.
**Estimate:** 2 hours for 17a; 2 to 3 for 17b; 14 to 22 for 17c; 3 to 4 for 17d. The roadmap's figure for all of Phase 3 is 25 to 40 hours.

## Brief 18: Work index

**Owner first**
- Approve Part C of the copy document, with the concept name filled in.
- Decide C3.1. **[Needs decision]** Whether the intro says "Mendglass is a new studio". Recommendation in the copy document.
- Supply one genuine screenshot or image of the live concept, with a record of when and how it was taken. The temporary mock interface from the Sites prototype is not acceptable (reference/01 5.5).

**Do**
- `src/content/projects.ts`: a typed `Project` with at least `slug`, `name`, `status`, `eyebrow`, `heading`, `body`, `metadata`, `liveUrl` and `image`. `status` is a required field with the single allowed value `'concept'` for now, so a project cannot be rendered without its status. Do not add fields for clients, results or testimonials.
- A small `ProjectStatus` component that renders the visible status label. Every surface that shows a project uses it.
- `/work` as Server Components: `h1` "Work"; the approved intro; one substantial project entry with eyebrow, status, name, heading, body, metadata and image; closing CTA. One project is shown as one project. No grid of cards, no empty slots, no "more coming soon".
- **The entry's link** "View concept project" points to `/work/[slug]`, which does not exist until Brief 19. Leave it out in this pull request (D1). Brief 19 adds it.
- **Restore (D1):** "View our work" as the hero's secondary action; "Work" in the header, MobileMenu and footer, first in the order Work · Services · About · Contact.

**Done when**
- `/work` is live on the preview. Locked strings match reference/01 5.5.
- The status label is visible without scrolling past the project's heading. A Playwright test asserts it.
- Nothing on the page implies a client, a commission or a result.
- New-route checklist complete; internal link test passes; no new client components.

**Explain it:** why status is a required field of the type; why the entry has no link yet.
**Estimate:** 2 hours.

## Brief 19: Concept case study and homepage section

**Owner first**
- Approve the case-study copy. **[Needs copy]** The Website Build chat writes it after the concept is live, following the seven-section frame in the copy document, D3. Every statement must describe something that exists in the concept.
- Supply the device screenshots taken in Brief 17d.
- Approve the fixed strings in the copy document, D2: the status label, the disclosure paragraph and the link text.

**Do**
- `/work/[slug]` driven by `src/content/projects.ts`, extended with the case study's structured sections. Statically generated for the known slug only. An unknown slug returns the branded 404. **Check the current docs** for how to restrict a dynamic route to known params with the Next.js settings this project uses (Cache Components changes how this is configured).
- Page order: status label "CONCEPT PROJECT · SELF-INITIATED WORK"; `h1` (locked); disclosure paragraph directly under it; metadata row (locked); the seven sections in the D3 order; "Visit the live concept" link; closing CTA.
- Performance or accessibility figures appear only with their date and tool, exactly as recorded in Brief 17d.
- Links to the concept open the concept's own address. The link text or adjacent text says it is a concept.
- **Restore (D1):** the "View concept project" link on the `/work` entry.
- **Homepage Featured Concept Project section** (reference/01 5.5): restore it between Services and How Mendglass Works. Carbon background; one substantial project; eyebrow, status, heading, body, metadata and CTA exactly as locked; a genuine concept visual. The component reads the same project content as `/work`.
- In the concept repository (a second, small pull request there): point the concept label's link at the case study.
- Per-route metadata from the copy document, D1.

**Never:** a client, a commissioned brief, metrics presented as outcomes, launch results, testimonials, or a claim about any real restaurant.

**Done when**
- All seven routes resolve: `/`, `/services`, `/work`, `/work/[slug]`, `/about`, `/contact`, `/privacy`. The sitemap lists seven URLs.
- A Playwright test asserts the Concept status label on the homepage section, on `/work` and on `/work/[slug]`.
- The homepage section order matches reference/01 section 5. With this brief merged, every D1 omission has been restored; search the repository for any remaining D1 note and remove it.
- The reviewer has checked each case-study statement against the live concept.
- Heading order on the homepage is still logical after the section is added. Screenshots at 390 and 1440.

**Explain it:** how one content module feeds three surfaces; why an unknown slug must be a 404; why the status label is tested.
**Estimate:** 4 to 6 hours.

---

# Phase 4: OpticalPane

## Brief 20: OpticalPane spike

An optional enhancement to the hero image: a pane that shows a slightly displaced view of the image behind it. The site is complete without it. This is a time-boxed experiment with a pass-or-remove ending.

**Owner first:** agree the time box. Recommendation: stop at 8 hours of sessions, with a hard limit of 10. You judge the visual result; the acceptance wording below is partly a matter of taste.

**Do**
- `src/components/optical/OpticalPane.tsx`. Start with **CSS/SVG layered sampling** (reference/02 section 22): a second view of the same hero image, clipped to the pane's shape and slightly offset or scaled, with a fine highlight edge.
- **No interaction is required**, so aim for a Server Component with CSS only. If any browser state turns out to be needed, state the reason before adding a client component.
- Hero only. No second use in this brief.
- The pane is decorative: hidden from assistive technology, never the only carrier of any content.
- The hero's headline and actions stay fully legible. The pane does not sit under text unless contrast is checked.
- **Mobile:** a separate, simpler treatment tuned to the mobile crop, or no pane at all. Decide from screenshots.
- **Motion:** none is required. If any is added, it is one small align or resolve movement on load, and it is absent under `prefers-reduced-motion`.
- **One switch** turns the pane off (a constant or a prop), leaving the plain image. The plain-image version stays tested.
- **Cost checks:** the network panel shows no extra image download caused by the pane; no layout shift; Lighthouse on the preview before and after, recorded with date and tool.
- **Escalation:** only if layered sampling cannot pass, try an SVG displacement filter. **Check the current docs** for browser support of the chosen technique in Safari before spending time on it. No WebGL. No canvas renderer. No new dependency.

**Acceptance test** (reference/02 section 22), each item answered yes or no in the pull request with screenshots from Chromium, Firefox and WebKit at 390 and 1440:
1. The displacement is visible but restrained, over recognisable image structure.
2. It does not look like a frosted card or glassmorphism.
3. Headline and CTA are fully legible.
4. The plain-image fallback is complete.
5. The mobile treatment is coherent.
6. The reduced-motion state is stable.
7. No obvious jank when scrolling or loading.
8. It renders acceptably in all three browsers.

**Done when**
- All eight pass and the owner approves the screenshots, **or** the component and every reference to it are removed and the plain image stays.
- `docs/decisions/003-optical-pane-implementation.md` records the technique tried, the evidence, and the outcome either way.
- A Playwright test covers the hero with the pane off. If the pane ships, one covers it on.

**Stop and report** at the time limit, whatever the state. Do not extend the spike to rescue it.
**Explain it:** what "progressive enhancement" means here; why a failed spike with a written reason is a good outcome; why no WebGL.
**Estimate:** 6 to 10 hours, time-boxed.

---

# Phase 5: analytics and consent

## Brief 21: Analytics and consent

Until this brief, the site sets no non-essential cookies and needs no banner. This brief changes that, so it changes the Privacy page and the tests that protect it.

**Owner first**
- **[Needs decision]** Whether to do this yet. The roadmap says last, when there is traffic worth measuring.
- **[Needs decision]** Whether Microsoft Clarity (session replay) is wanted as well as GA4. Reference/01 section 8 names both. Recommendation: if Clarity is used, never load it on `/contact`, so enquiry text cannot be recorded.
- Create the GA4 property and, if used, the Clarity project. Supply the public IDs.
- Re-read the ICO's current guidance on storage and access technologies (its cookies guidance). The Data (Use and Access) Act 2025 added a narrow "statistical purposes" exception to the consent rule, in force since 5 February 2026, and the ICO finalised its guidance in April 2026. As summarised by law firms (the ICO's own text was **not read** when this brief was written): the exception covers only aggregate statistics used to improve the service, needs clear information and an opt-out, and does not cover tracking individual users or a provider using the data for its own purposes. On that reading, session replay does not qualify and GA4 may not, so this brief assumes consent is needed for both. Record what you find. If you choose a tool that fits the exception, the Website Build chat revises this brief before the session.
- Approve the consent wording in the copy document, E4.
- Approve new Privacy page wording. **[Needs copy]** It must name Google and, if used, Microsoft; say what is collected and why; list each cookie or storage item with its purpose and lifetime; cover transfers outside the UK; and say how to change the choice. The Website Build chat drafts it from the flow as built.

**Do**
- **Consent state:** `unset`, `granted` or `denied`, stored in the visitor's browser as one first-party item. Storing the choice itself is the only storage before consent. Document the item's name and lifetime.
- **Consent control** (client component): the E4 banner on first visit; "Allow analytics" and "Decline" with the same size and visual weight; a "Cookie settings" link in the footer that reopens it and shows the current state.
- **Loading:** no analytics script, request or storage before `granted`. Load GA4 (and Clarity) only after it, from one client component that reads the consent state. Do not put analytics scripts in the root layout unconditionally (reference/02 section 13).
- **Withdrawal:** changing to `denied` stops further loading and removes the analytics cookies that can be removed. **Check the current docs** for each tool's cookie names and removal.
- **Events:** typed definitions in `src/lib/analytics`. Keep them few: for example, a "Discuss your website" click with its page location, and an enquiry submitted event with no field values. A type or test ensures no enquiry field value can be passed to an event.
- **Clarity:** masked by default; not loaded on `/contact`.
- **Environment:** the public IDs are the only `NEXT_PUBLIC_` values added. Analytics loads only when `SITE_ENV=production` and the IDs are present. Previews and local development load nothing.
- **Content Security Policy:** extend Brief 10's partial policy to a full one including `script-src` and `connect-src` for the exact origins the tools use. **Check the current docs** for how a nonce-based policy affects prerendering in this Next.js version and on this host. If nonces would make every page render on each request, compare the alternatives (hashes, or an allow-list of origins) and record the choice. If pages do become rendered per request on Cloudflare, re-measure CPU time against the 10 ms limit and consider the daily request limit before merging.
- `docs/decisions/005-analytics-consent-and-csp.md` records the consent storage, the loading approach and the policy choice.
- Update the Privacy page in the same pull request with the approved wording.

**Done when**
- Playwright, with analytics origins intercepted so CI never contacts them, proves:
  - before any choice: no request to an analytics origin and no storage beyond what the Privacy page lists as essential;
  - after "Decline": the same, and the choice survives a reload;
  - after "Allow analytics": the scripts are requested;
  - "Cookie settings" changes the choice both ways.
- The Brief 9 storage test is updated to the new rules, not deleted.
- A test shows no analytics script on `/contact` for Clarity, and no enquiry text in any analytics request.
- `curl -I` on the preview shows the full policy on an HTML route, and the browser console shows no policy violation on any route with analytics allowed.
- Every cookie and storage item the browser shows after "Allow analytics" is listed on the Privacy page, and nothing is listed that is not set.
- The banner is usable by keyboard and screen reader, does not trap focus, and does not cover the "Discuss your website" action at 360 wide.

**Explain it:** why scripts are loaded after consent and not just "switched off"; what a Content Security Policy does; why the storage test is the thing that keeps the Privacy page true.
**Estimate:** 8 to 12 hours.

---

# Phase 6: n8n adapter

## Brief 22: n8n sink

**Trigger:** the LOG rule of 13 Nov: more than about 10 new prospects a week, or something must run unattended. Do not start it before then.

This brief changes a live system and adds a processor of personal data. The workflow itself is not built by Claude Code in this repository.

**Owner first**
- Renew n8n.
- Approve the workflow design. The Control Centre drafts it in the project's format: trigger > inputs > deterministic steps > AI step > outputs > approval gate > Airtable updates > error handling. Existing workflow names and Airtable fields are kept.
- Build two workflows from the approved design: production and test. Each has a webhook that requires a secret header. The test workflow writes nothing to the production Airtable base.
- Complete Airtable's data processing form if it is still outstanding.
- Approve the Privacy page change. **[Needs copy]** It must add n8n as a processor and describe automatic entry into Airtable in place of manual entry.
- **[Needs decision]** When the webhook answers. Recommendation: n8n answers only after the enquiry is saved to Airtable, so a failure reaches the visitor as "try again" and is not lost silently. This must fit inside the site's 8-second timeout; if it cannot, answer on receipt and have an n8n error workflow email the owner.
- **[Needs decision]** Who sends the owner's notification email once n8n is in place. Recommendation: the n8n workflow. The `email` sink stays in the code, so switching back is one environment change.

**Do**
- `n8n` sink in `src/lib/integrations/`, implementing the existing `EnquirySink` interface. It posts the unchanged `Enquiry` DTO plus `submittedAt`, a source identifier and `requestId` as JSON to the webhook URL, with the secret in a header. `fetch` only; no SDK.
- Honour the abort signal. Treat any non-2xx response as failure. Never pass n8n's response body or any internal identifier to the visitor (reference/02 section 9).
- `requestId` is sent so the workflow can ignore a duplicate if a visitor retries.
- `src/lib/env.ts`: when `ENQUIRY_SINK=n8n`, require the webhook URL and the secret. Production requires the production webhook. Previews and local development may only hold the test webhook; **check** that the production URL is not present in any non-production environment.
- No Airtable table name, field name or field ID anywhere in `src/` (the existing search in Brief 5 still passes).
- Update `docs/decisions/002-enquiry-integration-boundary.md`: the interim sink's exit criteria are met; what changed; how to switch back.
- Update the Privacy page with the approved wording, and `docs/architecture.md`.

**Done when**
- Vitest with mocked `fetch` covers: request shape and header; non-2xx throws; timeout honoured; environment validation for every branch.
- Changing `ENQUIRY_SINK` between `email` and `n8n` changes delivery with no change to the route, the DTO or the form. The pull request's diff shows this.
- A preview submission reaches the test workflow and creates nothing in production.
- After the owner switches production: one real enquiry from the owner's phone appears in Airtable, marked as a test and then removed; the owner's notification arrives; a forced failure (wrong secret in a preview) shows the visitor the retry message.
- The Privacy page lists n8n. A LOG entry is written.

**Rollback:** set `ENQUIRY_SINK=email` and redeploy.
**Explain it:** what the interface made possible; why the website never learns Airtable's field names; why the test webhook exists.
**Estimate:** 3 to 4 hours in the repository, plus the owner's workflow build.
