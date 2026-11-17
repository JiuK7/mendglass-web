import type { Enquiry } from "@/lib/validation/enquiry";
import type { EnquiryMeta, EnquirySink } from "./enquiry-sink";

// The interim sink (docs/decisions/002-enquiry-integration-boundary.md): one
// plain-text email per enquiry to the studio inbox, sent with Resend's HTTP
// API. Brief 6 asks for fetch and no SDK, so this file is the whole client.
//
// Resend's docs, read 17 November 2026:
// - POST https://api.resend.com/emails, JSON, "Authorization: Bearer <key>".
//   The address is the same whatever region the sending domain is in.
// - Every request must carry a User-Agent, or it is refused with 403 before
//   it reaches the API. Some HTTP clients add one by themselves; this sets
//   its own rather than depend on the runtime.
// - Success is a 2xx answer. Anything else is a failure.

/** Resend's send-email endpoint. */
export const RESEND_EMAILS_URL = "https://api.resend.com/emails";

/** Names the site, and nothing about the visitor. */
const USER_AGENT = "mendglass-web";

export type EmailSinkConfig = {
  /** A sending-only Resend API key. Secret. */
  apiKey: string;
  /** The sender, on the verified sending subdomain. May include a display name. */
  from: string;
  /** The studio inbox. */
  to: string;
};

/**
 * Removes carriage returns and line feeds. A line break inside an email
 * header would end it and let the rest of the value start a new header
 * ("header injection"). Validation already refuses line breaks in every
 * one-line field; this is a second guard, so the sink never relies on it.
 */
function stripLineBreaks(value: string): string {
  return value.replace(/[\r\n]/g, "");
}

function subjectFor(enquiry: Enquiry): string {
  return stripLineBreaks(`Website enquiry — ${enquiry.businessName}`);
}

/** Every field, then when it arrived and the request ID to find it in the logs. */
function textFor(enquiry: Enquiry, meta: EnquiryMeta): string {
  return [
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    `Business name: ${enquiry.businessName}`,
    `Website: ${enquiry.websiteUrl ?? "none given"}`,
    `Help type: ${enquiry.helpType}`,
    `Submitted at: ${meta.submittedAt}`,
    `Request ID: ${meta.requestId}`,
    "",
    "Description:",
    enquiry.description,
  ].join("\n");
}

export function createEmailSink(config: EmailSinkConfig): EnquirySink {
  return {
    async deliver(enquiry, meta, signal) {
      signal.throwIfAborted();

      // The signal goes to fetch, so when the route's 8 seconds run out the
      // request to Resend is cancelled rather than left running.
      const response = await fetch(RESEND_EMAILS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": USER_AGENT,
        },
        // Only these five fields: no cc, bcc or custom headers, so nothing
        // from the visitor can add a recipient. Reply-To is the bare
        // address, with no display name to quote.
        body: JSON.stringify({
          from: config.from,
          to: config.to,
          reply_to: stripLineBreaks(enquiry.email),
          subject: subjectFor(enquiry),
          text: textFor(enquiry, meta),
        }),
        signal,
      });

      // The error names the status only. Resend's reply is never read into
      // it: it could repeat what the visitor typed.
      if (!response.ok) {
        throw new Error(
          `Resend refused the enquiry email: HTTP ${response.status}.`,
        );
      }
    },
  };
}
