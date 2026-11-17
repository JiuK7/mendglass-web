# 002: Enquiry integration boundary

Status: **proposed** in Brief 5, 17 November 2026. Accepted when the owner
merges the pull request that adds it. Brief 6 adds the email sink; Brief 22
records when the interim sink's exit criteria are met.

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
      email  Resend → studio inbox         Brief 6 (the interim sink)
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

| Variable       | Values                                 | Default       | Needs                                                      |
| -------------- | -------------------------------------- | ------------- | ---------------------------------------------------------- |
| `SITE_ENV`     | `development`, `preview`, `production` | `development` |                                                            |
| `ENQUIRY_SINK` | `test`                                 | `test`        | nothing                                                    |
|                | `email`                                |               | `RESEND_API_KEY`, `ENQUIRY_EMAIL_FROM`, `ENQUIRY_EMAIL_TO` |
|                | `n8n`                                  |               | `N8N_WEBHOOK_URL` (https), `N8N_WEBHOOK_SECRET`            |

- **Production is only what `SITE_ENV=production` says.** No host variable
  (such as Vercel's or Cloudflare's own) is read, so the code is the same on
  any host. An unknown value, such as `prod`, is refused rather than
  treated as "not production".
- **Production refuses to start with `test`**, or with `ENQUIRY_SINK` unset
  (it defaults to `test`). The test sink would accept every enquiry and
  deliver none, which is the one failure a visitor could not see.
- **How "refuses to start" works.** `src/instrumentation.ts` validates the
  environment in `register()`, which Next.js calls once when a server
  instance starts, before it handles any request. If validation fails, the
  instance never becomes ready: every request, pages included, gets a 500,
  and the log names the variable and the problem (never the value). Tested
  on 17 November 2026 with `next start` and with `pnpm preview` (the Workers
  runtime). The build is not affected, because `register()` does not run
  during `next build`.
- **Checked again on each delivery.** `route.ts` reads the environment when
  it picks the sink, because on Cloudflare the environment is filled in on
  the first request, not when modules load. If it is wrong, the delivery
  fails and the visitor gets the retry answer.
- **Previews.** Reference/02 section 12 wants previews to use a test webhook
  or a mock. Until Brief 22 that is the `test` sink: leave `SITE_ENV` unset
  or `preview`, and `ENQUIRY_SINK` unset or `test`.
- **Not built yet.** Choosing `email` (until Brief 6) or `n8n` (until
  Brief 22) passes validation, but every delivery fails with 503. Nothing
  is lost silently.

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

- Brief 6 adds one file and one `case` in `sinkFor`; Brief 22 the same.
- The Privacy page (Brief 9) must describe the sink actually in use.
- Brief 7's form needs approved wording for each field error code.
