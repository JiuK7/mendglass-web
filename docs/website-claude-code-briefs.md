# mendglass-web: Claude Code briefs

Status: **drafted** 16 Nov 2026. Written for execution by any model. Nothing is implemented.
Companion to `claude/website-roadmap-v2.md`. Decisions D1 to D3 (16 Nov) are built in.

## How to use this document

1. Save this file in the repository as `docs/website-claude-code-briefs.md` and the standing rules below as `CLAUDE.md`.
2. Copy the three reference documents into `docs/reference/` (read-only): Production Brief v1.1, Engineering Definition v1, Brand System v1. Do not copy the roadmap, the LOG or anything naming prospects: the repository is public.
3. For each session, tell Claude Code: "Read CLAUDE.md, then do Brief N from docs/website-claude-code-briefs.md and nothing else. Open a pull request."
4. Bring the pull request to the Website Build chat for review against the brief's "Done when" list.
5. Before merging, answer the brief's "Explain it" questions without notes.

Tooling changes quickly. Where a brief says **check the current docs**, Claude Code must read the official documentation before acting and say what it found, and must not rely on what it remembers.

---

## Standing rules (save as `CLAUDE.md`)

```markdown
# mendglass-web

Production website for Mendglass, an independent web studio focused on
restaurant websites. Also the owner's software-engineering portfolio piece.

## Authority
1. docs/reference/01 Production Brief v1.1: scope, routes, copy, composition.
2. docs/reference/03 Brand System v1: identity, palette, type.
3. docs/reference/02 Engineering Definition v1: stack, boundaries, tests.
4. docs/decisions/: where this build departs from the above (see ADR 004, hosting).
5. docs/website-claude-code-briefs.md: the current step. Do one brief per session, nothing more.

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
```

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

**Owner first:** create a free Cloudflare account. Read the free plan's terms for any restriction on commercial use and record the result.

**Do**
- GitHub Actions on pull requests to `main`: install, lint, typecheck, unit tests, build, then one Playwright smoke test in Chromium. Upload the Playwright report on failure. Branch protection requires the checks.
- **Check the current docs** at opennext.js.org/cloudflare, then add `@opennextjs/cloudflare` and `wrangler`, `wrangler.jsonc`, `open-next.config.ts`, `public/_headers` for static asset caching, `.dev.vars` (gitignored), `.open-next` in `.gitignore`, and `preview` and `deploy` scripts.
- Choose the simplest caching option that serves prerendered pages with no paid or extra service. Say which and why.
- Add a stub `POST /api/enquiry` that parses JSON with Zod and returns 200. It is replaced in Brief 5.
- Deploy to a `workers.dev` address (no custom domain).
- Find out whether preview deployments per pull request work on the free plan, and how environment values differ between preview and production. Report; do not build anything elaborate.
- Write `docs/decisions/004-hosting-cloudflare-workers.md`: the reason (cost against a small budget), what changes from reference/02, the measurements below, the fallback (Vercel Pro), and why OpenNext not vinext.

**Measure and record in ADR 004**
- Compressed bundle size from the deploy output, against the 3 MiB free limit.
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
- CPU time for a valid `POST` on the deployed Worker is re-measured and still under the limit.

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
- Images per D9, with correct `sizes`; hero image prioritised. Record each image's source, licence and role in `src/content/images.ts`.

**Done when**
- Every string matches reference/01 section 5 (the reviewer checks this line by line).
- One `h1`; headings in logical order.
- No horizontal scroll at 360, 768, 1280 and 1440.
- Screenshots at 390 and 1440 are in the pull request.
- No new client components. Every image has alt text or is marked decorative.
- Bundle size re-checked against the 3 MiB limit.

**Explain it:** content in TypeScript rather than a CMS; recomposing for mobile rather than shrinking.
**Estimate:** 7 to 9 hours across both.

## Brief 9: Privacy page

**Owner first:** supply the privacy facts (D5) and approve the copy drafted in the Website Build chat from the flow as built.

**Do**
- `/privacy` with the approved copy: enquiry fields and purpose; lawful basis; Cloudflare hosting and its logs; Resend, including transfer outside the UK; the Google Workspace mailbox; Airtable (manual entry); no analytics and no non-essential cookies or storage; retention; rights; privacy contact; the right to complain to the ICO.
- A Playwright test visits all three routes, submits the form, and asserts no cookies and no localStorage or sessionStorage entries.

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

**Do**
- If DNS must move: add the domain to Cloudflare, compare its imported records against the export one by one, fix any difference, and only then change nameservers at the registrar.
- Set production secrets and `SITE_ENV=production`, `ENQUIRY_SINK=email`.
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

These briefs are shorter on purpose. Each needs approved copy or a decision before code, and each is expanded in the Website Build chat when its turn comes.

## Brief 14: Services page
- **Before code:** owner approves `/services` copy. It expands only the three approved services, with no extra products, tiers, pricing or commitments.
- **Do:** `/services` as Server Components with typed content in `src/content/services.ts`. Restore "Explore services" on the homepage and Services in header and footer.
- **Done when:** route live with metadata and sitemap entry; restored links resolve; Playwright covers the route.

## Brief 15: About page
- **Before code:** owner approves `/about` copy. No team size, history, awards or experience claims.
- **Do:** `/about`; restore "About Mendglass" and the About links.
- **Done when:** as Brief 14.

## Brief 16: MobileMenu
- **Do:** a client component for the mobile navigation now that there are links to hold. Closed by default. Focus is trapped while open, returns to the trigger on close, and Escape closes it.
- **Done when:** RTL and Playwright cover open, close, keyboard and focus return; the header remains a Server Component with one client child.

## Brief 17: Restaurant concept (separate repository)
- **Before code:** the concept decision in the roadmap, section 5, plus a one-page concept brief: fictional name, guest journeys, pages.
- **Rules:** fictional or clearly labelled demonstration; no real restaurant's branding; no implied client. Same engineering standards, own repository and deployment. No shared packages.
- **Done when:** live at its own address, labelled as a Mendglass concept, with booking, menu, practical information and enquiry journeys that work on a phone.

## Brief 18: Work index
- **Do:** `/work` driven by typed project content; one project; visible "Concept Project / Self-initiated work" label. Restore "View our work" and the Work links.

## Brief 19: Concept case study and homepage section
- **Do:** `/work/[slug]` from structured content: the problem explored, journeys, design decisions, responsive treatment, implementation decisions; a link to the live concept. Restore the Featured Concept Project section on the homepage with a genuine concept visual.
- **Never:** a client, a commissioned brief, metrics, outcomes or testimonials.
- **Done when:** all seven routes resolve; Playwright asserts the Concept status label on every surface where the project appears.

## Brief 20: OpticalPane spike
- **Do:** CSS/SVG layered sampling on the hero only, time-boxed. Plain image stays complete without it; reduced motion respected; no WebGL.
- **Done when:** it passes the acceptance test in reference/02 section 22 in Chromium, Firefox and WebKit, or it is removed. ADR 003 records the outcome either way.

## Brief 21: Analytics and consent
- **Do:** consent control with a persisted preference and a way to change it; GA4 and Clarity loaded only after consent; event definitions in `src/lib/analytics`; enquiry content never sent to either; full CSP including `script-src`; Privacy page updated.
- **Check the current docs** for how a nonce-based CSP interacts with prerendering on this host before choosing the approach.
- **Done when:** Playwright proves no analytics request and no non-essential storage before consent, and both after consent; the Brief 9 storage test is updated, not deleted.

## Brief 22: n8n sink
- **Trigger:** the LOG rule of 13 Nov.
- **Do:** one new sink posting the same DTO to an authenticated webhook; a preview-safe test webhook; environment validation for its variables.
- **Done when:** switching `ENQUIRY_SINK` changes delivery with no change to route, DTO or form; ADR 002 is updated.
