import type { ServerEnv } from "@/lib/env";
import type { Enquiry } from "@/lib/validation/enquiry";
import { createEmailSink } from "./email-sink";
import { testSink } from "./test-sink";

// The boundary between the website and wherever enquiries go
// (docs/decisions/002-enquiry-integration-boundary.md). The route knows only
// this interface. Each destination is one implementation, chosen by
// ENQUIRY_SINK, so changing destination changes no route, form or DTO.

/** Safe operational details the server adds (reference/02 section 9). */
export type EnquiryMeta = {
  requestId: string;
  /** ISO 8601, UTC. */
  submittedAt: string;
};

export interface EnquirySink {
  /**
   * Resolves once the enquiry is safely handed over; rejects on any failure.
   * Must stop work when `signal` aborts (the route gives up after 8 seconds).
   * Must not log the enquiry.
   */
  deliver(
    enquiry: Enquiry,
    meta: EnquiryMeta,
    signal: AbortSignal,
  ): Promise<void>;
}

/** The sink ENQUIRY_SINK names. */
export function sinkFor(env: ServerEnv): EnquirySink {
  switch (env.ENQUIRY_SINK) {
    case "test":
      return testSink;
    case "email":
      return createEmailSink({
        apiKey: env.RESEND_API_KEY,
        from: env.ENQUIRY_EMAIL_FROM,
        to: env.ENQUIRY_EMAIL_TO,
      });
    case "n8n":
      // Built in Brief 22. Until then, choosing it fails every delivery, so
      // the visitor is asked to try again and nothing is silently lost.
      throw new Error("The n8n enquiry sink is not built yet.");
  }
}
