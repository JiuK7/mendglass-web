import type { EnquiryMeta, EnquirySink } from "@/lib/integrations/enquiry-sink";
import {
  isHoneypotFilled,
  parseEnquiry,
  type Enquiry,
  type EnquiryFieldErrors,
  type HelpType,
} from "@/lib/validation/enquiry";

// POST /api/enquiry, independent of where enquiries go. route.ts passes in
// the real sink; tests pass in failing or slow ones (Brief 5).

/** 16 KB. A full enquiry at every limit is well under 8 KB. */
export const MAX_BODY_BYTES = 16 * 1024;

/** How long a sink has before the visitor is told to try again. */
export const DELIVERY_TIMEOUT_MS = 8_000;

/** The `status` field of every response. */
export type EnquiryResponseStatus =
  | "accepted"
  | "invalid"
  | "unavailable"
  | "unsupported"
  | "too-large"
  | "error";

export type EnquiryResponseBody = {
  status: EnquiryResponseStatus;
  requestId: string;
  fieldErrors?: EnquiryFieldErrors;
};

/** What happened, for the log. Finer than the response status. */
type Outcome =
  | "accepted"
  | "honeypot"
  | "invalid"
  | "unsupported-media-type"
  | "too-large"
  | "sink-error"
  | "timeout"
  | "error";

/**
 * The whole log line. It holds the request ID, the outcome and, once the
 * enquiry is valid, its help type. Nothing a visitor typed is ever logged.
 */
type LogEntry = { requestId: string; outcome: Outcome; helpType?: HelpType };

function log(entry: LogEntry): void {
  const line = JSON.stringify(entry);
  if (entry.outcome === "sink-error" || entry.outcome === "timeout") {
    console.error(line);
  } else {
    console.info(line);
  }
}

function isJsonContentType(header: string | null): boolean {
  const mediaType = header?.split(";")[0]?.trim().toLowerCase();
  return mediaType === "application/json";
}

function declaredLengthTooLarge(header: string | null): boolean {
  if (header === null) {
    return false;
  }
  const declared = Number(header);
  return Number.isFinite(declared) && declared > MAX_BODY_BYTES;
}

type BodyResult =
  { kind: "text"; text: string } | { kind: "too-large" } | { kind: "not-text" };

/**
 * Reads the body but stops as soon as it passes the limit, so a body that
 * declares a small length, or none, cannot make the server read more.
 */
async function readBody(request: Request): Promise<BodyResult> {
  if (request.body === null) {
    return { kind: "text", text: "" };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => {});
      return { kind: "too-large" };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return {
      kind: "text",
      text: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    };
  } catch {
    return { kind: "not-text" };
  }
}

type DeliveryResult = "delivered" | "sink-error" | "timeout";

/**
 * Gives the sink `timeoutMs` to finish. On time-out the signal is aborted
 * and the route answers at once, whether or not the sink stops.
 */
async function deliverWithTimeout(
  sink: EnquirySink,
  enquiry: Enquiry,
  meta: EnquiryMeta,
  timeoutMs: number,
): Promise<DeliveryResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timedOut = new Promise<DeliveryResult>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve("timeout");
    }, timeoutMs);
  });

  // Starting the sink inside a promise also catches a sink that throws
  // before returning one.
  const delivered = Promise.resolve()
    .then(() => sink.deliver(enquiry, meta, controller.signal))
    .then(
      (): DeliveryResult => "delivered",
      (): DeliveryResult => "sink-error",
    );

  try {
    return await Promise.race([delivered, timedOut]);
  } finally {
    clearTimeout(timer);
  }
}

export type EnquiryHandlerOptions = {
  /** Defaults to DELIVERY_TIMEOUT_MS. */
  timeoutMs?: number;
};

export function createEnquiryHandler(
  sink: EnquirySink,
  options: EnquiryHandlerOptions = {},
): (request: Request) => Promise<Response> {
  const timeoutMs = options.timeoutMs ?? DELIVERY_TIMEOUT_MS;

  return async function handleEnquiry(request) {
    const requestId = crypto.randomUUID();

    function respond(
      httpStatus: number,
      body: Omit<EnquiryResponseBody, "requestId">,
      outcome: Outcome,
      helpType?: HelpType,
    ): Response {
      log({ requestId, outcome, helpType });
      const payload: EnquiryResponseBody = { ...body, requestId };
      return Response.json(payload, { status: httpStatus });
    }

    try {
      if (!isJsonContentType(request.headers.get("content-type"))) {
        return respond(
          415,
          { status: "unsupported" },
          "unsupported-media-type",
        );
      }
      if (declaredLengthTooLarge(request.headers.get("content-length"))) {
        return respond(413, { status: "too-large" }, "too-large");
      }

      const body = await readBody(request);
      if (body.kind === "too-large") {
        return respond(413, { status: "too-large" }, "too-large");
      }
      if (body.kind === "not-text") {
        return respond(
          415,
          { status: "unsupported" },
          "unsupported-media-type",
        );
      }

      let json: unknown;
      try {
        json = JSON.parse(body.text);
      } catch {
        return respond(
          415,
          { status: "unsupported" },
          "unsupported-media-type",
        );
      }

      // A bot is told it succeeded, so it has no reason to try again.
      if (isHoneypotFilled(json)) {
        return respond(200, { status: "accepted" }, "honeypot");
      }

      const parsed = parseEnquiry(json);
      if (!parsed.success) {
        return respond(
          422,
          { status: "invalid", fieldErrors: parsed.fieldErrors },
          "invalid",
        );
      }

      const { enquiry } = parsed;
      const meta: EnquiryMeta = {
        requestId,
        submittedAt: new Date().toISOString(),
      };
      const result = await deliverWithTimeout(sink, enquiry, meta, timeoutMs);
      if (result !== "delivered") {
        return respond(
          503,
          { status: "unavailable" },
          result,
          enquiry.helpType,
        );
      }
      return respond(200, { status: "accepted" }, "accepted", enquiry.helpType);
    } catch {
      // Not expected: every known failure is answered above. This keeps the
      // request ID and the log line even for a bug, without exposing detail.
      return respond(500, { status: "error" }, "error");
    }
  };
}
