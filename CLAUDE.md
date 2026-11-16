# mendglass-web

Production website for Mendglass, an independent web studio focused on
restaurant websites. Also the owner's software-engineering portfolio piece.

## Authority
1. docs/reference/01 Production Brief v1.1: scope, routes, copy, composition.
2. docs/reference/03 Brand System v1: identity, palette, type.
3. docs/reference/02 Engineering Definition v1: stack, boundaries, tests.
4. docs/decisions/: where this build departs from the above (see ADR 004, hosting).
5. docs/briefs.md: the current step. Do one brief per session, nothing more.

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
- Add a dependency only if the brief names it or you justify it in the PR.

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
