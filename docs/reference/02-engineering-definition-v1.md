# Mendglass — Engineering Definition / Technical Architecture v1

Source: `02_Mendglass_Engineering_Definition_Technical_Architecture_v1.docx`

Status: CANONICAL ENGINEERING BASELINE  •  24 October 2026  •  Milestone 1

Authority: this document owns stack, repository/code organisation, rendering boundaries, integration contracts, security/environment policy, tests, CI/CD and deployment. Decisions below are locked unless implementation exposes a concrete incompatibility.

## 1. Objectives and architectural principles

- Build a production-quality marketing application that is credible as a real software-engineering portfolio project without manufacturing technical complexity.

- Server-render by default; add client-side JavaScript only where browser state or interaction requires it.

- Mendglass website owns presentation and enquiry intake. n8n owns repeatable workflow orchestration. Airtable remains the operational source of truth.

- Keep integrations replaceable and internal business schema out of the public application contract.

- Keep the codebase proportional to the problem. Generalise only after repeated real production needs appear.

## 2. Locked stack and version policy

| Area | Locked decision |
| --- | --- |
| Runtime | Node.js 24 LTS |
| Package manager | pnpm |
| Framework | Next.js 16.x, App Router |
| React | Stable version required/supported by the selected Next.js 16.x release |
| Language | TypeScript, strict mode |
| Styling | Tailwind CSS 4.x + small global CSS/token layer |
| Fonts | Instrument Sans, locally loaded |
| Validation | Zod |
| Unit/component tests | Vitest + React Testing Library |
| E2E | Playwright |
| Lint | ESLint flat config + Next.js Core Web Vitals rules |
| Formatting | Prettier |
| CI | GitHub Actions |
| Hosting | Vercel |
| Workflow / CRM | n8n Cloud → Airtable |
| Analytics | GA4 + Microsoft Clarity, consent-gated |

Version policy: lock the technology lines above. Exact compatible package versions are selected at scaffold time and recorded by package.json + committed pnpm-lock.yaml. Patch/security updates inside the chosen line are deliberate; major upgrades require an explicit engineering decision.

## 3. Repository strategy

Repository: mendglass-web — one standalone repository for the production Mendglass website.

- The restaurant concept will use its own repository and deployment.

- Do not create a monorepo or shared packages before genuine repeated production requirements exist.

- main represents deployable production code; use short-lived feature/fix branches.

## 4. Production route map

```text
/ · /services · /work · /work/[slug] · /about · /contact · /privacy
```

Route roles and content authority are defined in Production Implementation Brief v1.1. Engineering must not silently add public routes to solve implementation convenience.

## 5. Server/client rendering rules

| Boundary | Rule |
| --- | --- |
| Server Components | Default for pages, static sections, local content, project/service presentation and metadata. |
| Client Components | Only when browser state/event handling is required: e.g. MobileMenu, EnquiryForm, consent controls, OpticalPane if interaction is needed. |
| Route Handler | POST /api/enquiry is the required Milestone 1 server endpoint. |
| No application session | No authentication, account state, app database or persistent client store. |

Prefer static/prerendered marketing output wherever practical. Do not mark a whole page client-side because one child interaction needs state.

## 6. Folder and code organisation

```text
mendglass-web/
├─ src/
│  ├─ app/
│  │  ├─ (site)/
│  │  │  ├─ page.tsx
│  │  │  ├─ services/page.tsx
│  │  │  ├─ work/page.tsx
│  │  │  ├─ work/[slug]/page.tsx
│  │  │  ├─ about/page.tsx
│  │  │  ├─ contact/page.tsx
│  │  │  └─ privacy/page.tsx
│  │  ├─ api/enquiry/route.ts
│  │  ├─ layout.tsx
│  │  ├─ not-found.tsx
│  │  ├─ error.tsx
│  │  ├─ sitemap.ts
│  │  └─ robots.ts
│  ├─ components/
│  │  ├─ layout/
│  │  ├─ home/
│  │  ├─ forms/
│  │  ├─ optical/
│  │  └─ ui/
│  ├─ content/
│  ├─ lib/
│  │  ├─ validation/
│  │  ├─ integrations/
│  │  └─ analytics/
│  └─ styles/globals.css
├─ public/brand/
├─ public/images/
├─ tests/e2e/
├─ docs/architecture.md
├─ docs/decisions/
├─ .env.example
├─ eslint.config.mjs
├─ playwright.config.ts
├─ vitest.config.ts
├─ next.config.ts
├─ package.json
└─ pnpm-lock.yaml
```

## 7. Component extraction rules

Extract a component when it has reused behaviour/semantics, independent complexity or meaningful testability. Do not abstract based on superficial visual similarity.

- Expected reusable boundaries: Button/link primitives, Header, MobileMenu, Footer, EnquiryForm, consent controls, OpticalPane.

- Homepage sections may remain explicit components such as Hero, GuestJourneys, Services, FeaturedWork, Process, AboutPreview and FinalCTA.

- Do not pre-create GenericSection, MarketingCard, FlexibleTwoColumnLayout or generic multi-brand abstractions.

## 8. Content strategy

- Store Milestone 1 copy and project/service metadata in typed local TypeScript modules under src/content.

- Use structured project content to drive /work/[slug].

- Do not introduce a CMS, app database or MDX system until editing becomes an actual operational problem.

- Production Implementation Brief v1.1 remains the authority for approved claims/copy; code must not regenerate or “improve” claims autonomously.

## 9. Enquiry API, DTO and n8n/Airtable boundary

#### Boundary:

```text
EnquiryForm → POST /api/enquiry → Zod validation → normalised Enquiry DTO → server-only n8n client → authenticated n8n webhook → n8n workflow → Airtable + internal notification
```

#### Production DTO:

```text
type Enquiry = {
  name: string
  email: string
  businessName: string
  websiteUrl?: string
  helpType: 'new-website' | 'website-redesign' | 'ongoing-care' | 'not-sure' | 'other'
  description: string
}

// server may attach safe operational metadata:
// submittedAt, source/page identifier, requestId if useful
```

- The Mendglass application knows about an enquiry, never Airtable table names, field IDs or CRM workflow state.

- n8n owns CRM mapping, downstream workflow logic and internal notification behaviour.

- The browser never receives Airtable credentials, n8n credentials or internal mapping data.

#### Stable public response model:

- Accepted / success

- Validation failure with correctable field errors

- Temporary server/integration failure with a safe retry message

Do not expose n8n/Airtable error payloads or internal identifiers to the visitor.

## 10. Spam, security and failure baseline

- Always validate server-side with Zod, regardless of client validation.

- Set a sensible request/body-size limit.

- Include a simple honeypot field.

- Use deployment/platform-level rate limiting where practical without introducing disproportionate infrastructure.

- Keep n8n URL/credentials server-only and exclude secrets from browser bundles.

- Do not write ordinary application logs containing the full enquiry PII payload.

- Disable/deduplicate submit while a request is pending.

- Provide clear validation, success and temporary-failure states in text, not JavaScript-only visual cues.

- Use a sensible integration timeout and fail closed with a generic visitor-facing message.

- Do not add a complex anti-bot service until actual abuse justifies it.

Test isolation: automated tests and Vercel previews must not create genuine production Airtable records or trigger production notifications.

## 11. Environment and secrets policy

- Validate required server environment variables in src/lib/env.ts with Zod.

- Only intentionally public values may use NEXT_PUBLIC_.

- Commit .env.example with variable names/descriptions only; never commit secrets.

- Store preview/production secrets in Vercel environment settings.

- Pin Node major via .nvmrc, declare the pnpm packageManager version in package.json and commit pnpm-lock.yaml.

- Keep local development, CI and Vercel runtime versions aligned as closely as practical.

## 12. Development, Preview and Production environments

| Environment | Contract |
| --- | --- |
| Development | Local app with local environment variables and safe/non-production integrations. |
| Preview | Vercel PR deployments. Must use a dedicated safe/test webhook or disable/mock enquiry submission. Never blindly hit the live production workflow. |
| Production | https://mendglass.com using production n8n, consent and analytics configuration. |

Canonical production origin: https://mendglass.com. Redirect www.mendglass.com consistently to the canonical origin if it resolves.

## 13. Analytics and consent architecture

```text
Initial visit → strictly necessary site only → visitor chooses analytics preference → load GA4/Clarity only when permitted
```

- Provide consent UI/control, persist preference where appropriate and provide a way to change it later.

- Gate analytics scripts and events on that state rather than loading them unconditionally in the root layout.

- Do not send enquiry-form contents or sensitive free text to analytics/session replay.

- Keep event definitions in src/lib/analytics.

## 14. Privacy and data-flow implications

Final privacy copy follows the implemented data flow. Document the real system first, then finalise the policy.

- Enquiry fields and purpose

- Vercel/hosting

- n8n workflow processing

- Airtable operational storage

- email/internal notifications

- GA4 and Microsoft Clarity

- cookie/storage usage and consent preference

- retention approach

- privacy contact route

## 15. SEO, metadata, images and security-header baseline

- Each route: title, description, canonical URL and useful Open Graph metadata.

- Ship favicon/identity assets, Open Graph sharing image, sitemap.ts and robots.ts.

- Use responsive/optimised images sized for actual layouts.

- Maintain a lightweight image provenance record: source, licence/usage basis, role on site.

- Never caption illustrative hospitality photography in a way that implies a Mendglass client or endorsement.

- Use sensible security headers. Define Content Security Policy once the exact analytics/integration origins are known.

- Provide not-found, route/runtime error handling and enquiry errors without technical leakage.

## 16. Testing strategy

Test risk, not coverage percentage.

| Layer | Required focus |
| --- | --- |
| Vitest | Enquiry schema; payload normalisation; relevant environment/config validation; pure utilities. |
| React Testing Library | Meaningful client interactions where unit/component testing adds value; e.g. form state or mobile menu behaviour. |
| Playwright | Homepage renders; all production routes resolve; mobile nav; primary CTA→Contact; invalid enquiry; safe valid-enquiry success; integration failure; Concept status; Privacy; consent behaviour; no broken critical routes. |
| Pre-launch browser matrix | Critical flows in Chromium, Firefox and WebKit. |

Do not unit-test every Server Component merely for numbers. Prefer E2E for server-rendered user journeys where that is the reliable level.

## 17. Accessibility QA

- Keyboard traversal and focus order/visibility

- Mobile-menu focus behaviour and dismissal

- Semantic heading/navigation hierarchy

- Accurate alt text and decorative-image handling

- Contrast

- 200% text enlargement and 400% reflow

- prefers-reduced-motion behaviour

- Touch target sizing

- Form labels, errors, pending, success and failure states

- Plain-image experience when OpticalPane is disabled

## 18. CI/CD

#### Pull requests to main run the appropriate equivalents of:

```text
pnpm install --frozen-lockfile
→ lint
→ typecheck
→ unit/component tests
→ production build
→ critical E2E checks
```

- Vercel provides Preview deployments for pull requests.

- main should remain deployable; required checks block merge.

- Linting is an explicit CI step.

- If full cross-browser E2E is too expensive on every small PR, keep one critical PR smoke path and run the complete browser matrix before release.

## 19. Deployment and domain policy

- Production hosting: Vercel.

- Canonical origin: https://mendglass.com.

- Redirect www to the canonical origin consistently if both DNS names resolve.

- Preview environments use preview-safe integration configuration.

- Production deployment uses production n8n/analytics configuration and is not considered complete until contact/privacy/consent paths are verified end-to-end.

## 20. Git conventions

- Use short-lived branches; no heavyweight GitFlow.

- Use meaningful commit prefixes where natural: feat:, fix:, test:, refactor:, docs:, chore:. No enforcement tooling required initially.

- Do not add Husky/pre-commit machinery unless a real workflow problem appears.

- Keep commits explainable and representative of real increments so the history is useful as portfolio evidence.

## 21. Documentation and ADR policy

- README.md: problem → product requirements → architecture → stack → setup → environment → testing → deployment.

- docs/architecture.md: concise overview of the actual system and boundaries.

- docs/decisions/: only decisions worth explaining. Initial ADRs: 001-stack-and-rendering.md; 002-enquiry-integration-boundary.md; 003-optical-pane-implementation.md.

- Do not turn documentation into bureaucracy or duplicate the Production Brief.

## 22. OpticalPane production spike strategy

OpticalPane is a coding spike and optional enhancement, not a new design phase or a generic graphics framework.

- Start with CSS/SVG layered sampling.

- First production use: Hero only. Consider a second Work use only if the real concept visual genuinely benefits.

- The base image/content must be complete without the enhancement.

- Tune sampling to the visible production crop, with separate/simplified mobile treatment where needed.

- No required hover/touch. Motion, if any, is a small align/resolve enhancement and respects reduced motion.

- Check rendering/performance across Chromium, Firefox and WebKit before reusing the component.

- Escalate to a displacement filter or specialised renderer only if CSS/SVG cannot pass the acceptance test at acceptable cost.

- Do not use WebGL for technical spectacle.

> Spike acceptance: visible but restrained displacement over recognisable image structure; no frosted-card/glassmorphism look; headline/CTA remain fully legible; plain-image fallback is complete; mobile fallback is coherent; reduced-motion state is stable; no obvious jank; browser sanity checks pass.

## 23. Explicit non-goals

- App database / ORM

- Authentication or user accounts

- Headless CMS

- Admin dashboard / client portal

- Monorepo

- Reusable restaurant website platform

- Shared cross-project packages

- GraphQL

- Redux/Zustand or other global state library

- Storybook

- Microservices

- Docker requirement

- Kubernetes

- WebGL by default

- Generic multi-brand theme engine

- Speculative abstraction

- Sentry unless a genuine operational need emerges

## 24. Milestone 1 technical definition of done

- mendglass-web is a clean standalone repository using the locked stack and committed lockfile.

- All seven production routes build and deploy successfully.

- Server/client boundaries are intentional and client JavaScript is limited to real interaction needs.

- Contact implements the stable Enquiry DTO, server validation, preview-safe n8n integration, production n8n integration and safe user-facing success/failure behaviour.

- No Airtable schema/credentials leak into the website application contract.

- Development, Preview and Production environment boundaries are configured and documented.

- GA4/Clarity load only after permitted consent and Privacy matches the implemented data flow.

- SEO/metadata, favicons, sharing image, sitemap/robots, responsive images, security headers and error states are in place.

- Critical Vitest/RTL/Playwright checks pass; release-critical flows are exercised in Chromium, Firefox and WebKit.

- Accessibility QA covers keyboard, focus, semantics, contrast, zoom/reflow, reduced motion, touch targets and form errors.

- OpticalPane passes its spike acceptance test or cleanly falls back to a plain production image.

- README, architecture overview and the three initial ADRs describe the actual implementation rather than a speculative future platform.

Engineering stop rule: do not add architecture simply to make the portfolio look more complex. Once this technical definition of done and the Product Brief definition of done are satisfied, Milestone 1 is launchable.

---

## footer1 — source supplementary text

Mendglass — Engineering Definition / Technical Architecture v1
