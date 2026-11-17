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
    expect(sinkFor(parseServerEnv({ ENQUIRY_SINK: "test" }))).toBe(testSink);
  });

  it("throws for email until Brief 6 builds it", () => {
    const env = parseServerEnv({
      ENQUIRY_SINK: "email",
      RESEND_API_KEY: "key",
      ENQUIRY_EMAIL_FROM: "from@example.com",
      ENQUIRY_EMAIL_TO: "to@example.com",
    });
    expect(() => sinkFor(env)).toThrow("not built yet");
  });

  it("throws for n8n until Brief 22 builds it", () => {
    const env = parseServerEnv({
      ENQUIRY_SINK: "n8n",
      N8N_WEBHOOK_URL: "https://workflows.example.com/hook",
      N8N_WEBHOOK_SECRET: "secret",
    });
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
