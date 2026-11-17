// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// route.ts only wires the handler to the sink the environment names. The
// response rules themselves are tested in handler.test.ts.

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  businessName: "The Analytical Kitchen",
  helpType: "not-sure",
  description: "We would like to talk about a website.",
};

function post(body: unknown): Request {
  return new Request("http://localhost/api/enquiry", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function useEmailSink(resendStatus: number) {
  vi.stubEnv("SITE_ENV", "production");
  vi.stubEnv("ENQUIRY_SINK", "email");
  vi.stubEnv("RESEND_API_KEY", "re_test_key");
  vi.stubEnv("ENQUIRY_EMAIL_FROM", "Website <enquiries@send.example.com>");
  vi.stubEnv("ENQUIRY_EMAIL_TO", "studio@example.com");
  const fetchMock = vi.fn<typeof fetch>(
    async () => new Response("{}", { status: resendStatus }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("POST /api/enquiry", () => {
  it("accepts a valid enquiry through the test sink when nothing is configured", async () => {
    vi.stubEnv("SITE_ENV", "");
    vi.stubEnv("ENQUIRY_SINK", "");
    const response = await POST(post(valid));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "accepted" });
  });

  it("fails closed (503) if the environment is invalid at request time", async () => {
    vi.stubEnv("SITE_ENV", "production");
    vi.stubEnv("ENQUIRY_SINK", "test");
    const response = await POST(post(valid));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ status: "unavailable" });
  });

  it("fails closed (503) for a production build with SITE_ENV missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SITE_ENV", "");
    vi.stubEnv("ENQUIRY_SINK", "");
    const response = await POST(post(valid));
    expect(response.status).toBe(503);
  });

  it("sends through Resend when ENQUIRY_SINK=email (fetch mocked)", async () => {
    const fetchMock = useEmailSink(200);
    const response = await POST(post(valid));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "accepted" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      "https://api.resend.com/emails",
    );
  });

  it("answers 503 when Resend refuses the email", async () => {
    useEmailSink(500);
    const response = await POST(post(valid));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ status: "unavailable" });
  });

  it("fails closed (503) for a sink that is not built yet", async () => {
    vi.stubEnv("SITE_ENV", "preview");
    vi.stubEnv("ENQUIRY_SINK", "n8n");
    vi.stubEnv("N8N_WEBHOOK_URL", "https://workflows.example.com/hook/test");
    vi.stubEnv("N8N_WEBHOOK_SECRET", "secret");
    const response = await POST(post(valid));
    expect(response.status).toBe(503);
  });
});
