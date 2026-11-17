// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { ServerEnvError } from "@/lib/env";
import { register } from "./instrumentation";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("start-up check", () => {
  it("lets development start with the test sink", () => {
    vi.stubEnv("SITE_ENV", "development");
    vi.stubEnv("ENQUIRY_SINK", "test");
    expect(() => register()).not.toThrow();
  });

  it("refuses to start production with the test sink", () => {
    vi.stubEnv("SITE_ENV", "production");
    vi.stubEnv("ENQUIRY_SINK", "test");
    expect(() => register()).toThrow(ServerEnvError);
  });

  it("refuses to start production with no sink set", () => {
    vi.stubEnv("SITE_ENV", "production");
    vi.stubEnv("ENQUIRY_SINK", "");
    expect(() => register()).toThrow(ServerEnvError);
  });

  it("refuses to start with a sink whose variables are missing", () => {
    vi.stubEnv("SITE_ENV", "preview");
    vi.stubEnv("ENQUIRY_SINK", "email");
    vi.stubEnv("RESEND_API_KEY", "");
    expect(() => register()).toThrow(ServerEnvError);
  });
});
