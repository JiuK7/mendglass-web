// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseServerEnv } from "@/lib/env";
import type { Enquiry } from "@/lib/validation/enquiry";
import { sinkFor } from "./enquiry-sink";
import { testSink } from "./test-sink";

const enquiry: Enquiry = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  businessName: "The Analytical Kitchen",
  helpType: "other",
  description: "A description long enough.",
};
const meta = {
  requestId: "00000000-0000-4000-8000-000000000000",
  submittedAt: "2026-11-17T09:30:00.000Z",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sinkFor", () => {
  it("returns the test sink for ENQUIRY_SINK=test", () => {
    expect(sinkFor(parseServerEnv({ ENQUIRY_SINK: "test" }, "test"))).toBe(
      testSink,
    );
  });

  it("returns an email sink built from the email variables for ENQUIRY_SINK=email", async () => {
    const env = parseServerEnv(
      {
        ENQUIRY_SINK: "email",
        RESEND_API_KEY: "re_test_key",
        ENQUIRY_EMAIL_FROM: "Website <from@example.com>",
        ENQUIRY_EMAIL_TO: "to@example.com",
      },
      "test",
    );
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response("{}", { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    try {
      await sinkFor(env).deliver(enquiry, meta, new AbortController().signal);
    } finally {
      vi.unstubAllGlobals();
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0]![1]!;
    expect(new Headers(init.headers).get("authorization")).toBe(
      "Bearer re_test_key",
    );
    expect(JSON.parse(String(init.body))).toMatchObject({
      from: "Website <from@example.com>",
      to: "to@example.com",
    });
  });

  it("throws for n8n until Brief 22 builds it", () => {
    const env = parseServerEnv(
      {
        ENQUIRY_SINK: "n8n",
        N8N_WEBHOOK_URL: "https://workflows.example.com/hook",
        N8N_WEBHOOK_SECRET: "secret",
      },
      "test",
    );
    expect(() => sinkFor(env)).toThrow("not built yet");
  });
});

describe("the test sink", () => {
  it("resolves without using the network or writing any log", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const consoleSpies = (
      ["log", "info", "warn", "error", "debug"] as const
    ).map((method) => vi.spyOn(console, method));

    await expect(
      testSink.deliver(enquiry, meta, new AbortController().signal),
    ).resolves.toBeUndefined();

    expect(fetchSpy).not.toHaveBeenCalled();
    for (const spy of consoleSpies) {
      expect(spy).not.toHaveBeenCalled();
    }
  });

  it("rejects when the signal has already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      testSink.deliver(enquiry, meta, controller.signal),
    ).rejects.toThrow();
  });
});
