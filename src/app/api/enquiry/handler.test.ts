// @vitest-environment node
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import type { EnquiryMeta, EnquirySink } from "@/lib/integrations/enquiry-sink";
import { HONEYPOT_FIELD, type Enquiry } from "@/lib/validation/enquiry";
import {
  createEnquiryHandler,
  DELIVERY_TIMEOUT_MS,
  MAX_BODY_BYTES,
  type EnquiryResponseBody,
} from "./handler";

// Distinctive values, so a test can prove none of them reaches a log.
const valid = {
  name: "Persephone Quill",
  email: "persephone.quill@example.com",
  businessName: "Quill & Ladle",
  websiteUrl: "quill-and-ladle.example",
  helpType: "website-redesign",
  description: "Our booking page is hard to use on phones. Secret detail 7731.",
};

const personalValues = [
  "Persephone",
  "Quill",
  "persephone.quill@example.com",
  "quill-and-ladle",
  "Secret detail 7731",
];

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

type Delivery = { enquiry: Enquiry; meta: EnquiryMeta; signal: AbortSignal };

/** A sink that records what it was given and then does `behaviour`. */
function recordingSink(
  behaviour: (delivery: Delivery) => Promise<void> = async () => {},
): EnquirySink & { deliveries: Delivery[] } {
  const deliveries: Delivery[] = [];
  return {
    deliveries,
    deliver(enquiry, meta, signal) {
      const delivery = { enquiry, meta, signal };
      deliveries.push(delivery);
      return behaviour(delivery);
    },
  };
}

/** A sink that only finishes when it is aborted, like a hung network call. */
function hangingSink() {
  return recordingSink(
    ({ signal }) =>
      new Promise<void>((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason));
      }),
  );
}

/** A sink that ignores the signal and never finishes at all. */
function deafSink() {
  return recordingSink(() => new Promise<void>(() => {}));
}

function jsonRequest(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost/api/enquiry", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/** A body sent in pieces, with no declared length. */
function streamedRequest(
  chunks: Uint8Array[],
  headers: Record<string, string> = {},
) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
  return new Request("http://localhost/api/enquiry", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: stream,
    duplex: "half",
  } as RequestInit);
}

async function read(response: Response): Promise<EnquiryResponseBody> {
  return (await response.json()) as EnquiryResponseBody;
}

let consoleSpies: MockInstance[];

function loggedLines(): string[] {
  return consoleSpies.flatMap((spy) =>
    spy.mock.calls.map((args) => args.map(String).join(" ")),
  );
}

function loggedEntries(): Record<string, unknown>[] {
  return loggedLines().map(
    (line) => JSON.parse(line) as Record<string, unknown>,
  );
}

beforeEach(() => {
  consoleSpies = (["log", "info", "warn", "error", "debug"] as const).map(
    (method) => vi.spyOn(console, method).mockImplementation(() => {}),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("415: not JSON", () => {
  it.each([
    ["no content type", {}],
    ["text/plain", { "content-type": "text/plain" }],
    ["a form post", { "content-type": "application/x-www-form-urlencoded" }],
    ["a JSON-like type", { "content-type": "application/ld+json" }],
  ])("refuses %s, without calling the sink", async (_label, headers) => {
    const sink = recordingSink();
    const request = new Request("http://localhost/api/enquiry", {
      method: "POST",
      headers,
      body: JSON.stringify(valid),
    });
    if (!("content-type" in headers)) request.headers.delete("content-type");

    const response = await createEnquiryHandler(sink)(request);

    expect(response.status).toBe(415);
    expect(await read(response)).toEqual({
      status: "unsupported",
      requestId: expect.stringMatching(uuid),
    });
    expect(sink.deliveries).toHaveLength(0);
  });

  it("accepts application/json with a charset, in any case", async () => {
    const sink = recordingSink();
    const response = await createEnquiryHandler(sink)(
      jsonRequest(valid, { "content-type": "Application/JSON; charset=utf-8" }),
    );
    expect(response.status).toBe(200);
  });

  it.each(["not json", '{"name":', "", "{'name':'single quotes'}"])(
    "refuses a body that does not parse: %j",
    async (body) => {
      const sink = recordingSink();
      const response = await createEnquiryHandler(sink)(jsonRequest(body));
      expect(response.status).toBe(415);
      expect((await read(response)).status).toBe("unsupported");
      expect(sink.deliveries).toHaveLength(0);
    },
  );

  it("refuses a body that is not valid UTF-8", async () => {
    const response = await createEnquiryHandler(recordingSink())(
      streamedRequest([new Uint8Array([0x7b, 0x22, 0xff, 0xfe, 0x22, 0x7d])]),
    );
    expect(response.status).toBe(415);
  });
});

describe("413: body over 16 KB", () => {
  const padding = (bytes: number) => ({ ...valid, padding: "x".repeat(bytes) });

  it("refuses a declared length over the limit before reading the body", async () => {
    const sink = recordingSink();
    const response = await createEnquiryHandler(sink)(
      jsonRequest(valid, { "content-length": String(MAX_BODY_BYTES + 1) }),
    );
    expect(response.status).toBe(413);
    expect(await read(response)).toEqual({
      status: "too-large",
      requestId: expect.stringMatching(uuid),
    });
    expect(sink.deliveries).toHaveLength(0);
  });

  it("refuses an actual body over the limit with no declared length", async () => {
    const body = new TextEncoder().encode(
      JSON.stringify(padding(MAX_BODY_BYTES)),
    );
    const response = await createEnquiryHandler(recordingSink())(
      streamedRequest([body.slice(0, 8000), body.slice(8000)]),
    );
    expect(response.status).toBe(413);
  });

  it("refuses an actual body over the limit that declares a small length", async () => {
    const body = new TextEncoder().encode(
      JSON.stringify(padding(MAX_BODY_BYTES)),
    );
    const response = await createEnquiryHandler(recordingSink())(
      streamedRequest([body], { "content-length": "100" }),
    );
    expect(response.status).toBe(413);
  });

  it("counts bytes, not characters", async () => {
    // "é" is two bytes in UTF-8: about 9,000 characters, about 18,000 bytes.
    const json = JSON.stringify({ ...valid, padding: "é".repeat(9000) });
    expect(json.length).toBeLessThan(MAX_BODY_BYTES);
    const response = await createEnquiryHandler(recordingSink())(
      jsonRequest(json),
    );
    expect(response.status).toBe(413);
  });

  it("accepts a body of exactly 16 KB", async () => {
    const base = JSON.stringify({ ...valid, padding: "" });
    const json = JSON.stringify({
      ...valid,
      padding: "x".repeat(MAX_BODY_BYTES - base.length),
    });
    expect(new TextEncoder().encode(json).byteLength).toBe(MAX_BODY_BYTES);

    const response = await createEnquiryHandler(recordingSink())(
      jsonRequest(json, { "content-length": String(MAX_BODY_BYTES) }),
    );
    expect(response.status).toBe(200);
  });
});

describe("200: honeypot filled", () => {
  it("answers accepted and delivers nothing", async () => {
    const sink = recordingSink();
    const response = await createEnquiryHandler(sink)(
      jsonRequest({ ...valid, [HONEYPOT_FIELD]: "Cheap watches" }),
    );
    expect(response.status).toBe(200);
    expect(await read(response)).toEqual({
      status: "accepted",
      requestId: expect.stringMatching(uuid),
    });
    expect(sink.deliveries).toHaveLength(0);
  });

  it("answers accepted even when the rest is invalid, so a bot learns nothing", async () => {
    const sink = recordingSink();
    const response = await createEnquiryHandler(sink)(
      jsonRequest({ [HONEYPOT_FIELD]: "Cheap watches", email: "nope" }),
    );
    expect(response.status).toBe(200);
    expect(sink.deliveries).toHaveLength(0);
  });

  it("logs it as a honeypot, not as accepted", async () => {
    await createEnquiryHandler(recordingSink())(
      jsonRequest({ ...valid, [HONEYPOT_FIELD]: "x" }),
    );
    expect(loggedEntries()).toEqual([
      { requestId: expect.stringMatching(uuid), outcome: "honeypot" },
    ]);
  });
});

describe("422: fails validation", () => {
  it("answers invalid with field error codes, and delivers nothing", async () => {
    const sink = recordingSink();
    const response = await createEnquiryHandler(sink)(
      jsonRequest({ ...valid, email: "not-an-email", description: "short" }),
    );
    expect(response.status).toBe(422);
    expect(await read(response)).toEqual({
      status: "invalid",
      requestId: expect.stringMatching(uuid),
      fieldErrors: { email: "invalid", description: "too-short" },
    });
    expect(sink.deliveries).toHaveLength(0);
  });

  it("answers invalid for JSON that is not an object", async () => {
    const response = await createEnquiryHandler(recordingSink())(
      jsonRequest([valid]),
    );
    expect(response.status).toBe(422);
    expect(await read(response)).toEqual({
      status: "invalid",
      requestId: expect.stringMatching(uuid),
      fieldErrors: {},
    });
  });
});

describe("503: sink error", () => {
  it("answers unavailable when the sink rejects", async () => {
    const sink = recordingSink(async () => {
      throw new Error("Upstream said no: persephone.quill@example.com");
    });
    const response = await createEnquiryHandler(sink)(jsonRequest(valid));
    expect(response.status).toBe(503);
    expect(await read(response)).toEqual({
      status: "unavailable",
      requestId: expect.stringMatching(uuid),
    });
  });

  it("answers unavailable when the sink throws before returning a promise", async () => {
    const sink: EnquirySink = {
      deliver() {
        throw new Error("boom");
      },
    };
    const response = await createEnquiryHandler(sink)(jsonRequest(valid));
    expect(response.status).toBe(503);
  });

  it("never passes the sink's error to the visitor or the log", async () => {
    const sink = recordingSink(async () => {
      throw new Error("Upstream said no: persephone.quill@example.com");
    });
    const response = await createEnquiryHandler(sink)(jsonRequest(valid));
    expect(await response.text()).not.toContain("Upstream");
    expect(loggedLines().join("\n")).not.toContain("Upstream");
    expect(loggedEntries()).toEqual([
      {
        requestId: expect.stringMatching(uuid),
        outcome: "sink-error",
        helpType: "website-redesign",
      },
    ]);
  });
});

describe("503: 8-second timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("uses 8 seconds", () => {
    expect(DELIVERY_TIMEOUT_MS).toBe(8000);
  });

  it("gives up at 8 seconds, not before, and aborts the sink's signal", async () => {
    const sink = hangingSink();
    const pending = createEnquiryHandler(sink)(jsonRequest(valid));
    let settled = false;
    void pending.then(() => (settled = true));

    await vi.advanceTimersByTimeAsync(DELIVERY_TIMEOUT_MS - 1);
    expect(settled).toBe(false);
    expect(sink.deliveries[0]?.signal.aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    const response = await pending;
    expect(response.status).toBe(503);
    expect(await read(response)).toEqual({
      status: "unavailable",
      requestId: expect.stringMatching(uuid),
    });
    expect(sink.deliveries[0]?.signal.aborted).toBe(true);
    expect(loggedEntries()).toEqual([
      {
        requestId: expect.stringMatching(uuid),
        outcome: "timeout",
        helpType: "website-redesign",
      },
    ]);
  });

  it("answers on time even if the sink ignores the signal", async () => {
    const pending = createEnquiryHandler(deafSink())(jsonRequest(valid));
    await vi.advanceTimersByTimeAsync(DELIVERY_TIMEOUT_MS);
    expect((await pending).status).toBe(503);
  });

  it("succeeds when a slow sink finishes inside the limit", async () => {
    const sink = recordingSink(
      () =>
        new Promise<void>((resolve) =>
          setTimeout(resolve, DELIVERY_TIMEOUT_MS - 100),
        ),
    );
    const pending = createEnquiryHandler(sink)(jsonRequest(valid));
    await vi.advanceTimersByTimeAsync(DELIVERY_TIMEOUT_MS - 100);
    expect((await pending).status).toBe(200);
  });

  it("accepts a shorter timeout for tests", async () => {
    const pending = createEnquiryHandler(hangingSink(), { timeoutMs: 50 })(
      jsonRequest(valid),
    );
    await vi.advanceTimersByTimeAsync(50);
    expect((await pending).status).toBe(503);
  });
});

describe("200: success", () => {
  it("answers accepted", async () => {
    const response = await createEnquiryHandler(recordingSink())(
      jsonRequest(valid),
    );
    expect(response.status).toBe(200);
    expect(await read(response)).toEqual({
      status: "accepted",
      requestId: expect.stringMatching(uuid),
    });
  });

  it("delivers the normalised DTO once, with the request ID and submission time", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-17T09:30:00.000Z"));
    const sink = recordingSink();

    const response = await createEnquiryHandler(sink)(
      jsonRequest({
        ...valid,
        email: "  Persephone.Quill@Example.COM ",
        [HONEYPOT_FIELD]: "",
      }),
    );
    const body = await read(response);

    expect(sink.deliveries).toHaveLength(1);
    expect(sink.deliveries[0]?.enquiry).toEqual({
      name: "Persephone Quill",
      email: "persephone.quill@example.com",
      businessName: "Quill & Ladle",
      websiteUrl: "https://quill-and-ladle.example",
      helpType: "website-redesign",
      description:
        "Our booking page is hard to use on phones. Secret detail 7731.",
    });
    expect(sink.deliveries[0]?.meta).toEqual({
      requestId: body.requestId,
      submittedAt: "2026-11-17T09:30:00.000Z",
    });
  });
});

describe("500: an unexpected error", () => {
  it("still answers with a request ID and no detail", async () => {
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.error(new Error("connection reset"));
      },
    });
    const request = new Request("http://localhost/api/enquiry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: stream,
      duplex: "half",
    } as RequestInit);

    const response = await createEnquiryHandler(recordingSink())(request);
    expect(response.status).toBe(500);
    expect(await read(response)).toEqual({
      status: "error",
      requestId: expect.stringMatching(uuid),
    });
    expect(loggedEntries()).toEqual([
      { requestId: expect.stringMatching(uuid), outcome: "error" },
    ]);
  });
});

describe("every response", () => {
  const cases: [string, () => Promise<Response>][] = [
    ["415", () => createEnquiryHandler(recordingSink())(jsonRequest("nope"))],
    [
      "413",
      () =>
        createEnquiryHandler(recordingSink())(
          jsonRequest(valid, { "content-length": "99999" }),
        ),
    ],
    [
      "honeypot",
      () =>
        createEnquiryHandler(recordingSink())(
          jsonRequest({ [HONEYPOT_FIELD]: "x" }),
        ),
    ],
    ["422", () => createEnquiryHandler(recordingSink())(jsonRequest({}))],
    [
      "503",
      () =>
        createEnquiryHandler(
          recordingSink(async () => {
            throw new Error("x");
          }),
        )(jsonRequest(valid)),
    ],
    ["200", () => createEnquiryHandler(recordingSink())(jsonRequest(valid))],
  ];

  it.each(cases)(
    "%s carries a request ID, which matches its one log line",
    async (_label, send) => {
      const response = await send();
      const body = await read(response);
      expect(body.requestId).toMatch(uuid);
      expect(response.headers.get("content-type")).toContain(
        "application/json",
      );

      const entries = loggedEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]?.requestId).toBe(body.requestId);
    },
  );

  it("gets a new request ID each time", async () => {
    const handler = createEnquiryHandler(recordingSink());
    const first = await read(await handler(jsonRequest(valid)));
    const second = await read(await handler(jsonRequest(valid)));
    expect(first.requestId).not.toBe(second.requestId);
  });
});

describe("logs", () => {
  it("hold only requestId, outcome and helpType, and nothing the visitor typed", async () => {
    const handler = createEnquiryHandler(recordingSink());
    await handler(jsonRequest(valid));
    await handler(jsonRequest({ ...valid, email: "bad" }));
    await handler(jsonRequest({ ...valid, [HONEYPOT_FIELD]: "x" }));
    await createEnquiryHandler(
      recordingSink(async () => {
        throw new Error(valid.email);
      }),
    )(jsonRequest(valid));

    const entries = loggedEntries();
    expect(entries).toHaveLength(4);
    for (const entry of entries) {
      for (const key of Object.keys(entry)) {
        expect(["requestId", "outcome", "helpType"]).toContain(key);
      }
    }

    const everything = loggedLines().join("\n");
    for (const value of personalValues) {
      expect(everything).not.toContain(value);
    }
  });
});
