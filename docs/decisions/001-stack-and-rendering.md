# 001: Stack and rendering

Status: accepted, 16 November 2026 (scaffold). To be finalised with the
documentation step once the thin slice is built.

## Context

The Engineering Definition v1 (section 2) locks the technology lines: Node.js
24, pnpm, Next.js 16 App Router, TypeScript strict, Tailwind CSS 4, Vitest
with React Testing Library, Playwright, ESLint flat config and Prettier. It
leaves the exact versions to be chosen at scaffold time. Section 5 sets the
rendering rule: server-render by default.

This record explains the rendering default and the versions chosen.

## Decision 1: server rendering by default

Every page, layout and section is a React Server Component unless it needs
browser state or event handling. A client component needs a stated reason.

Why:

- **The site is mostly words and images.** Its content is known at build
  time, so pages can be prerendered to static HTML. The build output for `/`
  confirms this: it is listed as `○ (Static)`.
- **Less JavaScript reaches the visitor.** A Server Component's code stays on
  the server. Restaurant owners will often open the site on a phone, where
  download and execution time matter most.
- **Secrets stay on the server.** Code that will later handle enquiries can
  read credentials without any risk of them entering a browser bundle.
- **The boundary is visible.** Because `"use client"` is the exception, each
  use marks a place where the site genuinely needs interactivity, and it can
  be reviewed as such.

The App Router is what makes this the default: in the App Router a component
is a Server Component unless it opts out. It is also the router that Next.js
16 documents first and develops.

### Cache Components

`next.config.ts` keeps the two options that `create-next-app` 16.4.6 enables
for new apps: `cacheComponents: true` and `partialPrefetching: true`. The
Next.js documentation shipped with 16.4.6 (`getting-started/caching`) says
new apps have both enabled and that both become the only behaviour in the
next major release.

With Cache Components, a route is prerendered unless it reads request-time
data, and request-time work must be marked explicitly. That matches the rule
above, so the default was kept rather than switched off.

Open point: the next step adds the Cloudflare adapter. Whether
`@opennextjs/cloudflare` supports these two options must be checked against
its current documentation then. If it does not, they are turned off and this
record is updated. The scaffold does not depend on them: it has one static
page.

## Decision 2: versions

Versions were looked up on the npm registry on 16 November 2026. The exact
resolved version of every package, direct and transitive, is recorded in
`pnpm-lock.yaml`.

| Area             | Package                             | Version | In `package.json` |
| ---------------- | ----------------------------------- | ------- | ----------------- |
| Runtime          | Node.js                             | 24      | `.nvmrc`, engines |
| Package manager  | pnpm                                | 12.21.0 | `packageManager`  |
| Framework        | next                                | 16.4.6  | exact             |
| UI               | react, react-dom                    | 19.3.0  | exact             |
| Language         | typescript                          | 5.9.3   | `^5`              |
| Styling          | tailwindcss, @tailwindcss/turbopack | 4.3.3   | exact             |
| Lint             | eslint                              | 9.39.5  | `^9`              |
| Lint             | eslint-config-next                  | 16.4.6  | exact             |
| Lint             | eslint-config-prettier              | 10.1.8  | caret             |
| Formatting       | prettier                            | 3.10.1  | caret             |
| Unit tests       | vitest                              | 5.1.0   | caret             |
| Unit tests       | @vitejs/plugin-react                | 6.3.0   | caret             |
| Unit tests       | jsdom                               | 31.0.1  | caret             |
| Component tests  | @testing-library/react              | 16.3.3  | caret             |
| Component tests  | @testing-library/dom                | 10.4.2  | caret             |
| Component tests  | @testing-library/jest-dom           | 7.0.1   | caret             |
| End-to-end tests | @playwright/test                    | 1.65.1  | caret             |

How they were chosen:

- **Next.js, React, Tailwind, TypeScript 5 and ESLint 9** are the versions
  `create-next-app` 16.4.6 generates. Using the set the framework tests
  together was preferred over the newest of each.
- **TypeScript 7 and ESLint 10 exist and were not used.** The lint toolchain
  that `eslint-config-next` 16.4.6 depends on declares TypeScript below 6.1 as
  its supported range. Moving to either is a major upgrade and, under the
  version policy, needs its own decision.
- **React** is the version the selected Next.js release generates, as the
  Engineering Definition requires.
- **Test and formatting tools** are the current stable releases.

What "pinned" means here:

- `packageManager` fixes the pnpm version, and `.nvmrc` plus `engines` fix the
  Node.js major.
- The framework packages are exact in `package.json`. Tooling uses ranges.
- In both cases the lockfile decides what is installed.
  `pnpm install --frozen-lockfile` installs exactly the versions in
  `pnpm-lock.yaml` and fails if the lockfile and `package.json` disagree,
  instead of quietly resolving something newer. A fresh clone, and later CI,
  therefore get the same dependency tree as the machine that committed it.

## Other scaffold choices

- **TypeScript strict mode** is on (`"strict": true`). It catches missing
  null checks and implicit `any` at compile time.
- **`pnpm typecheck` runs `next typegen` first.** Next.js generates route
  types into `.next/`, which is gitignored. Without this, type checking fails
  on a fresh clone that has not been built.
- **Tailwind CSS 4 is loaded through `@tailwindcss/turbopack`**, the setup
  `create-next-app` 16.4.6 generates. There is no PostCSS configuration.
- **ESLint** uses the flat config with `eslint-config-next/core-web-vitals`
  and the TypeScript rules. `eslint-config-prettier` switches off rules that
  overlap with Prettier. `pnpm lint` runs ESLint and then `prettier --check`.
- **Prettier** uses its defaults, with no options set.
- **Vitest** runs in jsdom with globals off, so tests import what they use.
- **Playwright** runs against the production build (`next start`), in
  Chromium only for now.

## Consequences

- Interactive pieces must be small client components inside server-rendered
  pages. A whole page is not made a client component for one child.
- Upgrades within a major line are deliberate lockfile changes. Major
  upgrades need a new decision record.
- Not included yet, because nothing uses them: Zod, the Cloudflare adapter,
  fonts and design tokens. Each arrives with the step that needs it.
