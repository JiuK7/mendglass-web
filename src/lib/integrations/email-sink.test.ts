// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEnquiryHandler } from "@/app/api/enquiry/handler";
import type { Enquiry } from "@/lib/validation/enquiry";
import {
  createEmailSink,
  RESEND_EMAILS_URL,
  type EmailSinkConfig,
} from "./email-sink";
import type { EnquiryMeta } from "./enquiry-sink";

// Brief 6: the email sink, tested with a mocked fetch. Nothing here reaches
// the network or Resend.

const config: EmailSinkConfig = {
  apiKey: "re_test_NOT_A_REAL_KEY_123",
  from: "Mendglass website <enquiries@send.example.com>",
  to: "studio@example.com",
};

const enquiry: Enquiry = {
  name: "Persephone Quill",
  email: "persephone.quill@example.com",
  businessName: "Quill & Ladle",
  websiteUrl: "https://quill-and-ladle.example",
  helpType: "website-redesign",
  description:
    "Our booking page is hard to use on phones.\nSecret detail 7731.",
};

const meta: EnquiryMeta = {
  requestId: "6f1c2a9e-1111-4222-8333-444455556666",
  submittedAt: "2026-11-17T09:30:00.000Z",
};

type FetchCall = { url: string; init: RequestInit };

const fetchMock = vi.fn<typeof fetch>();

/** The one call the sink made to fetch. */
function onlyCall(): FetchCall {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0]!;
  return { url: String(url), init: init ?? {} };
}

function sentBody(): Record<string, unknown> {
  return JSON.parse(String(onlyCall().init.body)) as Record<string, unknown>;
}

function sentHeaders(): Headers {
  return new Headers(onlyCall().init.headers);
}

function respondWith(status: number, body = '{"id":"email-id"}') {
  fetchMock.mockResolvedValue(
    new Response(body, {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
}

/** A fetch that only settles when its signal aborts, like a hung connection. */
function hangUntilAborted() {
  fetchMock.mockImplementation(
    (_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        signal?.addEventListener("abort", () => reject(signal.reason));
      }),
  );
}

function deliver(
  value: Enquiry = enquiry,
  signal: AbortSignal = new AbortController().signal,
) {
  return createEmailSink(config).deliver(value, meta, signal);
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the request to Resend", () => {
  beforeEach(() => {
    respondWith(200);
  });

  it("posts JSON to Resend's send-email endpoint", async () => {
    await deliver();

    const { url, init } = onlyCall();
    expect(url).toBe("https://api.resend.com/emails");
    expect(RESEND_EMAILS_URL).toBe(url);
    expect(init.method).toBe("POST");
    expect(sentHeaders().get("content-type")).toBe("application/json");
  });

  it("authenticates with the API key as a bearer token", async () => {
    await deliver();
    expect(sentHeaders().get("authorization")).toBe(
      "Bearer re_test_NOT_A_REAL_KEY_123",
    );
  });

  it("sends a User-Agent, which Resend requires, naming only the site", async () => {
    await deliver();
    expect(sentHeaders().get("user-agent")).toBe("mendglass-web");
  });

  it("sends exactly from, to, reply_to, subject and text", async () => {
    await deliver();
    expect(sentBody()).toEqual({
      from: "Mendglass website <enquiries@send.example.com>",
      to: "studio@example.com",
      reply_to: "persephone.quill@example.com",
      subject: "Website enquiry — Quill & Ladle",
      text: [
        "Name: Persephone Quill",
        "Email: persephone.quill@example.com",
        "Business name: Quill & Ladle",
        "Website: https://quill-and-ladle.example",
        "Help type: website-redesign",
        "Submitted at: 2026-11-17T09:30:00.000Z",
        "Request ID: 6f1c2a9e-1111-4222-8333-444455556666",
        "",
        "Description:",
        "Our booking page is hard to use on phones.",
        "Secret detail 7731.",
      ].join("\n"),
    });
  });

  it("sets Reply-To to the enquirer, so replying answers them", async () => {
    await deliver();
    expect(sentBody().reply_to).toBe(enquiry.email);
  });

  it("says so when no website was given", async () => {
    const withoutWebsite: Enquiry = { ...enquiry };
    delete withoutWebsite.websiteUrl;
    await deliver(withoutWebsite);
    expect(sentBody().text).toContain("\nWebsite: none given\n");
  });

  it("sends plain text only, with no HTML version", async () => {
    await deliver();
    expect(sentBody()).not.toHaveProperty("html");
  });

  it("passes the abort signal to fetch", async () => {
    const controller = new AbortController();
    await deliver(enquiry, controller.signal);
    expect(onlyCall().init.signal).toBe(controller.signal);
  });
});

describe("header injection", () => {
  // Validation already refuses line breaks in these fields. The sink does
  // not rely on that: it strips CR and LF itself before anything becomes a
  // header.
  const hostile: Enquiry = {
    ...enquiry,
    businessName: "Quill\r\nBcc: victim@example.net\r\n\r\nInjected body",
    email: "persephone.quill@example.com\r\nBcc: victim@example.net",
  };

  beforeEach(() => {
    respondWith(200);
  });

  it("strips CR and LF from the subject", async () => {
    await deliver(hostile);
    expect(sentBody().subject).toBe(
      "Website enquiry — QuillBcc: victim@example.netInjected body",
    );
  });

  it("strips CR and LF from Reply-To", async () => {
    await deliver(hostile);
    expect(sentBody().reply_to).toBe(
      "persephone.quill@example.comBcc: victim@example.net",
    );
  });

  it("never sends cc, bcc or custom headers", async () => {
    await deliver(hostile);
    const body = sentBody();
    for (const key of ["cc", "bcc", "headers"]) {
      expect(body).not.toHaveProperty(key);
    }
  });

  it("keeps line breaks in the message body, where they are only text", async () => {
    await deliver(hostile);
    expect(sentBody().text).toContain(
      "Business name: Quill\r\nBcc: victim@example.net",
    );
  });
});

describe("Resend's answer", () => {
  it.each([200, 201, 202])("resolves on HTTP %i", async (status) => {
    respondWith(status);
    await expect(deliver()).resolves.toBeUndefined();
  });

  it.each([300, 400, 401, 403, 404, 422, 429, 500, 503])(
    "throws on HTTP %i",
    async (status) => {
      respondWith(status, '{"message":"refused"}');
      await expect(deliver()).rejects.toThrow(`HTTP ${status}`);
    },
  );

  it("throws when the request itself fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("network down"));
    await expect(deliver()).rejects.toThrow();
  });

  it("keeps the key, the enquiry and Resend's reply out of the error", async () => {
    respondWith(
      422,
      '{"message":"Invalid reply_to: persephone.quill@example.com"}',
    );
    const error = await deliver().then(
      () => undefined,
      (reason: unknown) => reason,
    );
    expect(error).toBeInstanceOf(Error);
    const message = (error as Error).message;
    for (const value of [
      config.apiKey,
      enquiry.email,
      enquiry.name,
      "Invalid reply_to",
    ]) {
      expect(message).not.toContain(value);
    }
  });

  it("writes no log, on success or failure", async () => {
    const consoleSpies = (
      ["log", "info", "warn", "error", "debug"] as const
    ).map((method) => vi.spyOn(console, method));

    respondWith(200);
    await deliver();
    respondWith(500);
    await deliver().catch(() => {});

    for (const spy of consoleSpies) {
      expect(spy).not.toHaveBeenCalled();
    }
  });
});

describe("the time limit", () => {
  it("does not call Resend when the signal has already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(deliver(enquiry, controller.signal)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stops waiting for Resend when the signal aborts", async () => {
    hangUntilAborted();
    const controller = new AbortController();
    const delivery = deliver(enquiry, controller.signal);

    controller.abort();

    await expect(delivery).rejects.toThrow();
  });

  it("through the route: a slow Resend becomes 503 and its request is cancelled", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    hangUntilAborted();
    const handler = createEnquiryHandler(createEmailSink(config), {
      timeoutMs: 20,
    });

    const response = await handler(
      new Request("http://localhost/api/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...enquiry,
          websiteUrl: "quill-and-ladle.example",
        }),
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ status: "unavailable" });
    expect(onlyCall().init.signal?.aborted).toBe(true);
  });
});
