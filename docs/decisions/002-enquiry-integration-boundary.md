# 002: Enquiry integration boundary

Status: **accepted**. Proposed in Brief 5 and accepted when its pull request
was merged, 17 November 2026. Brief 6 (17 November 2026) adds the email sink
and the sending region (section 2); Brief 22 records when the interim sink's
exit criteria are met.

## Context

Reference/02 section 9 defines one path for an enquiry:

```text
EnquiryForm → POST /api/enquiry → Zod validation → normalised Enquiry DTO
  → server-only n8n client → authenticated n8n webhook → n8n workflow
  → Airtable + internal notification
```

It also says the website must never know Airtable's table names, field IDs
or workflow state, and that previews must never reach the live workflow
(section 12).

n8n is not in use now. Brief 22 brings it back only when its trigger is met
(below). The site needs a working destination before then, and the code
should not have to change when n8n returns.

## Decision

### 1. The boundary

The route knows only an `EnquirySink`. Everything before the sink is the
website's own job; everything after it belongs to the destination.

```text
EnquiryForm (Brief 7)
  → POST /api/enquiry                      src/app/api/enquiry/route.ts
  → createEnquiryHandler(sink)             src/app/api/enquiry/handler.ts
      1. JSON only, 16 KB at most
      2. honeypot check
      3. Zod validation and normalisation  src/lib/validation/enquiry.ts
      4. Enquiry DTO + EnquiryMeta
      5. sink.deliver(), 8-second limit
  → EnquirySink, chosen by ENQUIRY_SINK    src/lib/integrations/enquiry-sink.ts
      test   delivers nowhere              src/lib/integrations/test-sink.ts
      email  Resend → studio inbox         src/lib/integrations/email-sink.ts
      n8n    n8n webhook → Airtable        Brief 22
```

```ts
interface EnquirySink {
  deliver(
    enquiry: Enquiry,
    meta: EnquiryMeta,
    signal: AbortSignal,
  ): Promise<void>;
}
```

- `Enquiry` is the DTO of reference/02 section 9, unchanged.
- `EnquiryMeta` is the safe operational data section 9 allows:
  `requestId` and `submittedAt` (ISO 8601, UTC).
- A sink resolves when the enquiry is safely handed over and rejects on any
  failure. It stops when `signal` aborts and never logs the enquiry.
- Changing destination changes one environment value. The route, the form
  and the DTO stay the same.

A test in `src/lib/integrations/boundary.test.ts` searches `src/` for
Airtable, Airtable IDs, n8n hosts and webhook paths, and fails if it finds
any. The word "n8n" is allowed only as the sink's name and its variables'
names.

### 2. The interim sink: email

Until n8n returns, production uses the `email` sink (Brief 6): a plain-text
message through Resend's HTTP API to the studio's inbox, with Reply-To set
to the enquirer. Entry into Airtable is done by hand, outside the website.

Why email: it needs one sending-only API key and no workflow, it keeps the
enquiry out of any extra system, and switching to n8n later is one variable.

**How it sends** (Brief 6, `src/lib/integrations/email-sink.ts`). One
`POST https://api.resend.com/emails` with `fetch`; no Resend SDK. The body
has five fields and no others:

| Field      | Value                                                                |
| ---------- | -------------------------------------------------------------------- |
| `from`     | `ENQUIRY_EMAIL_FROM`, an address on the sending subdomain            |
| `to`       | `ENQUIRY_EMAIL_TO`, the studio inbox                                 |
| `reply_to` | The enquirer's email address, bare, with CR and LF stripped          |
| `subject`  | `Website enquiry — {businessName}`, with CR and LF stripped          |
| `text`     | Every field, then `submittedAt` and `requestId`; plain text, no HTML |

- **Header injection.** Validation already refuses line breaks in the
  one-line fields. The sink strips CR and LF from the subject and Reply-To
  anyway, so it never depends on that. It sends no `cc`, `bcc` or custom
  `headers`, so nothing the visitor types can add a recipient.
- **User-Agent.** Resend refuses any request without a `User-Agent` header
  with a 403 (error code 1010) before it reaches the API (Resend API
  introduction, read 17 November 2026). The sink sends `mendglass-web`, and
  nothing about the visitor.
- **Failure.** Any answer outside 2xx, or a failed request, rejects. The
  error names the HTTP status only; Resend's reply is never read into it,
  because it could repeat what the visitor typed. The handler logs neither.
- **Time limit.** The handler's abort signal goes to `fetch`, so at 8 seconds
  the request to Resend is cancelled and the visitor gets 503. An email that
  Resend accepted just before the cancel may still arrive, so a visitor who
  then retries can produce a duplicate. That is preferred to losing one.
- **No idempotency key.** Resend supports one, but each retry by a visitor
  is a new request with a new `requestId`, so it would not prevent that
  duplicate. The site never retries by itself.

**Sending region.** The sending subdomain is `send.mendglass.com`, added in
Resend in the EU region, Ireland (`eu-west-1`), on 17 November 2026. It
verifies once the domain's DNS moves. Resend's "Choosing a Region" page (read
17 November 2026) says the region controls where emails are routed and sent
from, not where data is stored: account data, including email metadata,
logs and API records, is kept in the United States whatever the region. So:

- the Privacy page (Brief 9) still describes a transfer outside the UK for
  Resend, as that brief already says;
- the API address is the same for every region, so the code has no region
  setting.

**The key** is not created yet. It will be a Resend API key with
`sending_access` permission (it can only send email), restricted to the
sending domain. It lives only as a Worker secret
(`wrangler secret put RESEND_API_KEY`, with `--env production` once Brief 13
adds that environment) and in gitignored local files (`.env.local`,
`.dev.vars`).

### 3. Exit criteria for the interim sink

Move from `email` to `n8n` (Brief 22) when the trigger recorded on
13 November is met: more than about 10 new prospects a week, or something
must run unattended. Before the switch:

- n8n is renewed;
- the owner has approved the workflow design and built a production and a
  test workflow, each with a webhook that requires a secret header;
- the test workflow writes nothing to the production Airtable base;
- the Privacy page wording for n8n is approved.

Switch: set `ENQUIRY_SINK=n8n` and its variables, and redeploy.
Roll back: set `ENQUIRY_SINK=email` and redeploy. Brief 22 updates this
section when the criteria are met.

### 4. Environment

`src/lib/env.ts` validates the server environment with Zod
(reference/02 section 11).

| Variable       | Values                                 | Default                                                        | Needs                                                      |
| -------------- | -------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| `SITE_ENV`     | `development`, `preview`, `production` | `development` under `next dev` and tests only; none in a build |                                                            |
| `ENQUIRY_SINK` | `test`                                 | `test`                                                         | nothing                                                    |
|                | `email`                                |                                                                | `RESEND_API_KEY`, `ENQUIRY_EMAIL_FROM`, `ENQUIRY_EMAIL_TO` |
|                | `n8n`                                  |                                                                | `N8N_WEBHOOK_URL` (https), `N8N_WEBHOOK_SECRET`            |

- **Production is only what `SITE_ENV=production` says.** No host variable
  (such as Vercel's or Cloudflare's own) is read, so the code is the same on
  any host. An unknown value, such as `prod`, is refused rather than
  treated as "not production".
- **Every build must say which environment it is.** `SITE_ENV` defaults to
  `development` only when `NODE_ENV` is `development` (`next dev`) or `test`
  (Vitest). `next build` and `next start` set `NODE_ENV=production`, and the
  bundler writes that value into the built code, so it holds on any host.
  Any other value, or none, counts as a build too. A build with `SITE_ENV`
  unset refuses to start. Without this rule, the live site with
  `SITE_ENV=production` forgotten would default to `development`, allow the
  test sink, and answer every enquiry "accepted" while delivering none. The
  rule was added at review, 17 November 2026. `NODE_ENV` never makes the site
  production; it only decides whether `SITE_ENV` may be left out.
- **Production refuses to start with `test`**, or with `ENQUIRY_SINK` unset
  (it defaults to `test`). The test sink would accept every enquiry and
  deliver none, which is the one failure a visitor could not see.
- **Where each copy of the site gets `SITE_ENV`.**

  | Copy                                   | Where it is set                       | Value         |
  | -------------------------------------- | ------------------------------------- | ------------- |
  | `pnpm dev`, unit tests                 | not set                               | `development` |
  | End-to-end tests (`next start`, CI)    | `playwright.config.ts`, `webServer`   | `preview`     |
  | `pnpm preview` (local Workers runtime) | `.dev.vars`, gitignored, by each user | `preview`     |
  | `workers.dev` deploy                   | `wrangler.jsonc`, `vars`              | `preview`     |
  | Live site (Brief 13)                   | `wrangler.jsonc`, `env.production`    | `production`  |

  `wrangler.jsonc` is the one place for the deployed Worker's plain
  variables: Cloudflare's Wrangler configuration page says that variables
  changed in the dashboard are overridden on the next deploy (read
  17 November 2026). Secrets such as `RESEND_API_KEY` are set with
  `wrangler secret put`, never in the file.

  The live site gets its own Wrangler environment (Brief 13, owner's
  decision 17 November 2026): an `env.production` block with
  `SITE_ENV=production` and `ENQUIRY_SINK=email`, deployed with
  `pnpm run deploy -- --env production`, only from `main`. The top-level
  `preview` value is left as it is. Cloudflare's Environments page (read
  17 November 2026) says an environment deploys as a separate Worker named
  `<name>-<environment>` (here `mendglass-web-production`), that `vars` are
  not inherited from the top level and must be repeated in the block, and
  that commands take `--env` to act on it, so its secrets are set with
  `wrangler secret put <NAME> --env production`.

- **How "refuses to start" works.** `src/instrumentation.ts` validates the
  environment in `register()`, which Next.js calls once when a server
  instance starts, before it handles any request. If validation fails, the
  instance never becomes ready: every request, pages included, gets a 500,
  and the log names the variable and the problem (never the value). Tested
  on 17 November 2026 with `next start` and with `pnpm preview` (the Workers
  runtime), for production with the test sink and for a build with
  `SITE_ENV` unset. The build is not affected, because `register()` does not
  run during `next build`.
- **Checked again on each delivery.** `route.ts` reads the environment when
  it picks the sink, because on Cloudflare the environment is filled in on
  the first request, not when modules load. If it is wrong, the delivery
  fails and the visitor gets the retry answer.
- **Previews.** Reference/02 section 12 wants previews to use a test webhook
  or a mock. Until Brief 22 that is the `test` sink: set `SITE_ENV=preview`
  and leave `ENQUIRY_SINK` unset or `test`.
- **Not built yet.** Choosing `n8n` (until Brief 22) passes validation,
  but every delivery fails with 503. Nothing is lost silently. The `email`
  sink is built (Brief 6).

### 5. Public responses

Reference/02 section 9 asks for three visitor-facing outcomes: accepted,
invalid with field errors, and a temporary failure with a retry message.
Brief 5 adds the protocol answers.

| Request                                   | HTTP | `status`      |
| ----------------------------------------- | ---- | ------------- |
| Not JSON (wrong type, or does not parse)  | 415  | `unsupported` |
| Body over 16 KB, declared or actual       | 413  | `too-large`   |
| Honeypot filled                           | 200  | `accepted`    |
| Fails validation                          | 422  | `invalid`     |
| Sink error, or no answer within 8 seconds | 503  | `unavailable` |
| Success                                   | 200  | `accepted`    |
| Anything unexpected (a bug)               | 500  | `error`       |

Every response is JSON with a `requestId`. A 422 also has `fieldErrors`:
one code per field (`required`, `too-short`, `too-long` or `invalid`). The
visitor-facing words for each code are copy, approved in Brief 7; the API
never sends sentences. No sink's error or response body ever reaches the
visitor.

The 500 row is not in Brief 5's table. It exists so that even a bug answers
with a `requestId` and a log line, and it keeps 503 meaning "a destination
failed, try again" rather than "something went wrong".

### 6. Logs

One line per request, as JSON: `requestId`, an outcome, and `helpType` once
the enquiry is valid. Outcomes: `accepted`, `honeypot`, `invalid`,
`unsupported-media-type`, `too-large`, `sink-error`, `timeout`, `error`.
Nothing the visitor typed is logged, and neither is a sink's error message,
which could repeat it. Tests check both.

### 7. Choices the brief left open

- **Lengths** are counted after trimming, in JavaScript string length
  (UTF-16 code units). The browser's `maxlength` counts the same way, so the
  form and the server agree.
- **websiteUrl** is not limited in the brief. It is limited to 2,048
  characters (a common practical URL maximum), after `https://` is added. It
  must be `http` or `https`, have a dotted host name and carry no user name
  or password. A bare domain gains `https://`; nothing else is rewritten.
- **Control characters** (Unicode category Cc) are refused in every field.
  The description is multi-line, so it may keep tab, line feed and carriage
  return.
- **Email** uses Zod's built-in pattern after trimming and lower-casing.
- **The honeypot field** is named `subject`, which browsers' autofill does
  not fill in. It is checked before validation, so a bot gets `accepted`
  whatever else it sent.
- **Malformed JSON** is answered 415, as "not JSON" in the brief's table.

## What changes from reference/02

| Reference/02 says                                     | This build does                                                      |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| Section 9: DTO → server-only n8n client               | DTO → `EnquirySink`; n8n is one sink (Brief 22)                      |
| Section 9: n8n → Airtable + internal notification     | Interim: email to the studio inbox (Brief 6); Airtable entry by hand |
| Section 12: previews use a test webhook or a mock     | Previews use the `test` sink until Brief 22 adds the test webhook    |
| Section 11: validate env in `src/lib/env.ts` with Zod | Unchanged, plus the start-up check in `src/instrumentation.ts`       |

## Consequences

- Brief 6 added one file and one `case` in `sinkFor`; Brief 22 does the
  same.
- The Privacy page (Brief 9) must describe the sink actually in use.
- Brief 7's form matches each field error code (`required`, `too-short`,
  `too-long`, `invalid`) to the per-field validation messages already in the
  contact page copy draft, rather than asking for new wording.
- Brief 13 adds the `env.production` block in `wrangler.jsonc` with
  `SITE_ENV=production` and `ENQUIRY_SINK=email`, and sets the production
  secrets with `--env production`. The top-level `workers.dev` Worker stays
  a preview.
