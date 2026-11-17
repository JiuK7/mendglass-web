# Glossary

Plain explanations of technical terms used in reports about this codebase.
Alphabetical. Terms about this codebase and its tools only.

- **Accessible name**: the name a screen reader announces for a link or button, such as "Mendglass home" for the wordmark link.
- **Adapter**: a tool that reshapes the Next.js build output so it runs on a particular host, here `@opennextjs/cloudflare`.
- **ADR (architecture decision record)**: a short document that records one decision and the reasons for it.
- **App Router**: the Next.js way of building a site in which each folder under `src/app` becomes a page address.
- **Branch protection**: a GitHub setting that blocks merging into `main` until required checks pass.
- **Bundle**: the packed-up server code uploaded to the host when the site is deployed.
- **Cache Components**: a Next.js setting that builds each page ahead of time unless the page says it needs live data.
- **Canonical origin**: the one official address of the site (`https://mendglass.com`), kept in `src/lib/site.ts`; full page addresses are built from it.
- **CI (continuous integration)**: checks that run automatically on GitHub for every pull request.
- **Client component**: a piece of a page whose code is sent to the visitor's browser and runs there; marked with `"use client"` at the top of the file.
- **Contrast ratio**: how much lighter one colour is than another, from 1:1 (identical) to 21:1 (black on white); accessibility rules set minimums.
- **Corepack**: a tool that ships with Node.js and installs the package manager version a project asks for.
- **CPU time**: the time a server spends actually computing a response, not counting time spent waiting.
- **Design token**: a named value, such as a brand colour or a radius, defined once in `src/styles/globals.css` and used everywhere by name.
- **End-to-end test**: a test in which a real browser opens the site and uses it as a visitor would.
- **Favicon**: the small icon a browser shows in the tab and bookmarks for a site.
- **Focus ring**: the outline that shows which link or button the keyboard is on.
- **Font CDN**: a third-party server that hosts fonts for many sites, such as Google Fonts; this site does not use one.
- **GitHub Actions**: GitHub's service that runs the CI checks, set up in `.github/workflows/`.
- **Link component**: Next.js's own link (`next/link`); it fetches the next page in the background so moving between pages is faster, at the cost of a small script.
- **Lint**: an automatic check that finds likely mistakes and formatting slips in code without running it.
- **Lockfile**: the file that pins exact package versions (`pnpm-lock.yaml`).
- **OFL (SIL Open Font Licence)**: the free licence Instrument Sans uses; it lets us ship the font files if the licence text goes with them.
- **OpenNext**: the open-source project that makes the Next.js build run on hosts other than Vercel.
- **pnpm**: the package manager, the tool that downloads the code packages this project depends on.
- **Preview deployment**: a temporary copy of the site, built from a branch, at its own web address.
- **Primitive**: a small basic building block, such as the button, that other parts of the site reuse instead of restyling their own.
- **Scaffold**: the bare starting project that every later step builds on.
- **Server Component**: a piece of a page that runs only on the server, so its code is never sent to the visitor's browser.
- **Skip link**: a link that is hidden until you press Tab; it is the first thing on the page and lets keyboard users jump past the header to the content.
- **Static asset**: a ready-made file (image, stylesheet, script) the host sends as it is, without running any code.
- **Strict mode**: the TypeScript setting that turns on its most thorough checks.
- **Stub**: a temporary stand-in for a piece of code, kept minimal until the real version is built.
- **Touch target**: the area of a link or button that responds to a tap or click; on this site at least 44 by 44 pixels.
- **Typecheck**: an automatic check that finds places where code uses the wrong kind of value, without running it.
- **Unit test**: a fast test that checks one small piece of code on its own, without opening a browser.
- **Worker**: a small program that runs on Cloudflare's servers for each request; here, the site's server code.
- **workers.dev**: a free Cloudflare web address for a Worker, used before a custom domain is attached.
- **Wrangler**: Cloudflare's command-line tool for running and deploying Workers.
- **Zod**: a library that checks incoming data has the expected shape before the code uses it.
