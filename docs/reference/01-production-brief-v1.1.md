# Mendglass — Production Implementation Brief v1.1

Source: `01_Mendglass_Production_Implementation_Brief_v1.1.docx`

Status: CANONICAL PRODUCT / FRONTEND BRIEF  •  24 October 2026  •  Milestone 1

Authority: this document owns production scope, routes, page/content requirements, section composition, CTA behaviour, responsive intent and Milestone 1 product acceptance criteria.

## 1. Product objective and launch sequence

Build and launch the production Mendglass website as both a credible commercial surface for restaurant outreach and a production-quality software-engineering portfolio project. The current commercial focus remains independent restaurants.

#### Locked sequence:

```text
Mendglass production site → coded restaurant concept → integration / QA → deploy → outreach
```

No further whole-page visual exploration is required before implementation.

## 2. Production route scope

| Route | Role | Milestone 1 requirement |
| --- | --- | --- |
| / | Homepage | Primary overview and conversion surface. Uses the locked homepage architecture and copy in Section 5. |
| /services | Services | Expand only the three approved offers: new websites, redesigns, ongoing care & optimisation. |
| /work | Work | Present genuine Mendglass demonstration work. No implication of commissioned client work. |
| /work/[slug] | Project detail | First project is the self-initiated restaurant concept case study, clearly labelled Concept Project / Self-initiated work. |
| /about | About | Expand the approved independent-studio positioning without inventing team size, history, awards or experience claims. |
| /contact | Contact | Contains the real enquiry flow and the primary commercial destination. |
| /privacy | Privacy | Describes the actual implemented data flow, processors/tools and user rights once implementation is confirmed. |

## 3. Source-of-truth hierarchy

1. Production Implementation Brief v1.1 — product scope, routes, homepage/page content, section composition, CTA behaviour, responsive intent, product acceptance criteria.

2. Mendglass Brand System v1 — wordmark, dg icon, Instrument Sans, canonical palette and Optical Precision identity principles.

3. Engineering Definition / Technical Architecture v1 — stack, repository architecture, rendering boundaries, integration contracts, environment/security policy, tests, CI/CD and deployment.

4. Sites Prototype Findings v1 — evidence for Services composition, Process responsive behaviour, interaction lessons, optical lessons and prototype failure modes.

5. Stitch Exploration Findings v1 — Concept C Material Optical foundation, Concept A warmth, Concept B structural/indexing influence and known visual failure modes.

6. Relume material — sitemap, page hierarchy and approved structural/content work not superseded later.

7. Generated Stitch/Sites code — implementation reference only; never canonical.

Conflict rule: later approved decisions override older exploration. Identity asset geometry remains authoritative for the actual wordmark and dg icon.

## 4. Global product rules

- Mendglass is an independent web studio currently focused on restaurant websites; it is not positioned as an AI agency, large agency or proven growth consultancy.

- Do not invent clients, client briefs, testimonials, commercial results, booking increases, revenue, awards, partnerships, years of experience or case-study metrics.

- Mobile experience is first-class. Responsive layouts may recompose rather than mechanically shrink desktop layouts.

- Use the real Mendglass wordmark and dg icon, canonical palette, Instrument Sans and Optical Precision principles.

- Concept work must be conspicuously labelled wherever it appears.

## 5. Homepage baseline — locked

Order: Navbar → Hero → Restaurant Customer Journeys → Services → Featured Concept Project → How Mendglass Works → About Mendglass → Final CTA → Footer

### 5.1 Navbar

Navigation: Work · Services · About · Contact

Primary CTA: Discuss your website → /contact

Desktop keeps the wordmark, concise navigation and CTA on one restrained row. Mobile defaults to a closed menu.

### 5.2 Hero

Headline: Restaurant websites designed around bookings, menus and enquiries.

Supporting copy: Mendglass designs and builds modern websites for independent restaurants, with clearer mobile journeys from first visit to booking or enquiry.

Primary CTA: Discuss your website → /contact

Secondary CTA: View our work → /work

Composition: dominant restaurant image, editorial asymmetry, generous negative space and one restrained OpticalPane enhancement. On mobile, proposition and actions precede the image.

### 5.3 Restaurant Customer Journeys

Eyebrow: BUILT AROUND THE GUEST

Heading: Your guests arrive with a plan.

Intro: Restaurant websites are rarely browsed without a purpose. Mendglass designs around the things guests are actually trying to do.

| Journey | Approved copy |
| --- | --- |
| 01 — Discover → Menu → Book | Make it easy to understand the restaurant, find the menu and move naturally towards a reservation. |
| 02 — Private dining → Details → Enquire | Give higher-value enquiries enough information to understand the offer and take the next step. |
| 03 — Visit → Hours & location → Go | Keep practical information clear and easy to reach, particularly on mobile. |

Composition: open indexed list, fine separators and one secondary photographic anchor. No generic cards; rows remain informational rather than pseudo-links.

### 5.4 Services — composition locked

Heading: Three ways to improve your restaurant website.

Intro: From a complete new build to ongoing improvements, the work is shaped around the restaurant and the journeys that matter most.

| Service | Approved copy |
| --- | --- |
| 01 — New restaurant websites | Design and development of complete restaurant websites built around mobile use, menus, bookings and enquiries. |
| 02 — Restaurant website redesigns | Rework dated or difficult websites to improve structure, usability, presentation and important customer journeys. |
| 03 — Ongoing website care & optimisation | Continued technical care, content updates and considered improvements after launch. |

CTA: Explore services → /services

Desktop composition: heading/intro above; offset hospitality image paired with a vertical sequence of three open ruled service rows. Do not return to three equal cards. Mobile preserves 01→03 as a vertical editorial sequence; image remains secondary.

### 5.5 Featured Concept Project

Eyebrow: PROJECT / 01

Status: CONCEPT PROJECT

Heading: A restaurant experience designed from the guest journey outwards.

Body: A self-initiated Mendglass concept exploring how mobile-first design, clear booking and menu access, practical information and higher-value enquiries can work together in one restaurant website.

Metadata: RESTAURANT / CONCEPT · WEB / MOBILE · DESIGN + DEVELOPMENT

CTA: View concept project → /work/[slug]

Composition: Carbon interruption, one substantial project, clear Concept status, concise metadata and a genuine concept visual. The temporary Sites mock interface is not launch proof.

### 5.6 How Mendglass Works — composition locked

| Step | Heading | Description |
| --- | --- | --- |
| 01 | A clear path from first conversation to launch | Start with the restaurant, its priorities and what customers need the website to do. |
| 02 | Layouts built around the guest, not decoration | Structure and visual design follow the important customer journeys rather than being added for effect. |
| 03 | Clean implementation that performs properly | Responsive, accessible development with attention to speed, maintainability and the details people actually interact with. |
| 04 | Launch, learn and keep improving | Once the website is live, real behaviour and ongoing needs can inform the next improvements. |

Desktop composition: number | heading | body as open horizontal rows with fine rules. Mobile composition: number in a narrow left column with heading + body grouped on the right. No process cards or required animation.

### 5.7 About Mendglass

Heading: An independent studio focused on better restaurant websites.

Body: Mendglass combines design and development to create clear, carefully built digital experiences. The current focus is independent restaurants: businesses where mobile usability, strong visual presentation and simple customer journeys matter particularly quickly.

Supporting copy: Working independently keeps communication direct and allows the design and technical implementation to stay closely connected.

CTA: About Mendglass → /about

Use a quiet editorial composition. Any hospitality image is illustrative and must not imply a Mendglass client or team member.

### 5.8 Final CTA and footer

Heading: Thinking about improving your restaurant website?

Body: You don't need a finished brief. If something about your current website isn't working as well as it should, start with a conversation.

CTA: Discuss your website → /contact

Footer: Work · Services · About · Contact · Privacy · London, UK · © Mendglass 2026. Use only real contact/social destinations that are supplied and approved.

## 6. Other route roles

### /services

Expand only the three approved services. Use the approved Relume/content work as a starting point. Explain restaurant-specific customer journeys and the working process without creating extra products, tiers, pricing or commitments.

### /work

Present genuine Mendglass demonstration work. Initially this may contain one strong project. Every self-initiated item must remain visibly labelled as concept/demonstration work.

### /work/[slug]

The first project detail route documents the coded restaurant concept as Concept Project / Self-initiated work. It may explain the problem being explored, customer journeys, design decisions, responsive treatment, booking/menu/enquiry thinking and implementation decisions. It must not invent a client, commissioned brief, metrics, launch outcomes or testimonials.

The restaurant concept itself is a separate coded project/repository and may deploy independently. This case-study route links to that live concept when available.

### /about

Expand the independent-studio positioning and current restaurant focus. Do not imply unsupported team size, company history, awards or experience.

### /contact

Contains the real enquiry form and clear next-step expectations. The user does not need a finished brief. Primary site CTAs resolve here.

### /privacy

Describe the real implemented data flow and tools. Final legal copy follows implementation; implementation must not be retrofitted to generic placeholder wording.

## 7. Contact and CTA contract

| Action label | Production destination |
| --- | --- |
| Discuss your website | /contact |
| View our work | /work |
| Explore services | /services |
| View concept project | /work/[slug] for the actual concept case study |
| About Mendglass | /about |
| Privacy | /privacy |

Do not preserve prototype notices or a two-step “CTA → notice” interaction. All public controls must resolve to useful production destinations.

## 8. Contact, analytics and privacy dependencies

- Contact depends on the canonical enquiry boundary defined by the Engineering Definition: EnquiryForm → POST /api/enquiry → server-side validation → normalised Enquiry DTO → server-only n8n integration → n8n workflow → Airtable/internal notification.

- GA4 + Microsoft Clarity remain the measurement stack, but non-essential analytics load only after the relevant visitor consent.

- Milestone 1 includes a consent control, persisted preference where appropriate, a way to change the preference later, and analytics loading gated by that state.

- The Privacy page must describe the actual implemented processing, including relevant enquiry fields, hosting, n8n, Airtable, internal/email notifications, analytics/storage use, retention approach and privacy contact route.

- Do not expose enquiry content to analytics/session replay.

## 9. Production web baseline

- Each route receives an appropriate title, description and canonical URL; use Open Graph metadata where useful.

- Ship Mendglass favicons/identity assets, a sharing image, sitemap.ts and robots.ts.

- Use responsive optimised images and maintain a simple source/licence/role record for production imagery.

- Illustrative restaurant photography must not imply a client relationship or endorsement.

- Use sensible security headers. Finalise Content Security Policy after the actual analytics/integration origins are known.

- Provide production not-found, route/runtime error states and enquiry error states without exposing technical details.

- Do not promise SEO rankings; this is technical discoverability hygiene only.

## 10. Milestone 1 product definition of done

- mendglass.com is live on the canonical production origin and all seven production routes resolve correctly.

- The homepage matches the locked content baseline and selected Services/Process compositions.

- The design is consistent with Mendglass Brand System v1 and Concept C — Material Optical without copying prototype artefacts literally.

- Mobile and desktop are intentionally composed and usable.

- All “Discuss your website” CTAs lead to the real contact route and the enquiry flow works reliably.

- The Privacy page and consent behaviour match the implemented data flow.

- At least one coded restaurant concept is live, linked from Mendglass and clearly labelled self-initiated concept work.

- No fake claims, unfinished notices, placeholder content, broken links or invented proof remain.

- Metadata, favicons, sitemap/robots, image optimisation, basic security headers and production error states are in place.

- The codebase meets the technical definition of done in Engineering Definition v1.

Milestone 1 stop rule: once these conditions are satisfied, stop expanding the launch scope and return to Prospecting & Lead Research. Outreach begins while later portfolio depth continues in parallel.

## 11. Explicit launch exclusions

- No additional concept websites before the first strong concept is live.

- No testimonials, results, client logos or case-study metrics without real evidence.

- No pricing page unless separately approved later.

- No blog, resource library, newsletter or content-marketing system required for Milestone 1.

- No reusable restaurant platform, template library or generic site generator.

- No further whole-page Relume/Stitch/Sites exploration as a launch dependency.

---

## footer1 — source supplementary text

Mendglass — Production Implementation Brief v1.1
