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
