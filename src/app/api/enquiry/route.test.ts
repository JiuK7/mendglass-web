// @vitest-environment node
import { describe, expect, it } from "vitest";
import { POST } from "./route";

function post(body: string): Request {
  return new Request("http://localhost/api/enquiry", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("POST /api/enquiry (stub)", () => {
  it("returns 200 for a JSON object", async () => {
    const response = await POST(post(JSON.stringify({ name: "Test" })));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("returns 400 for a body that is not JSON", async () => {
    const response = await POST(post("not json"));

    expect(response.status).toBe(400);
  });

  it("returns 400 for JSON that is not an object", async () => {
    const response = await POST(post(JSON.stringify(["a", "b"])));

    expect(response.status).toBe(400);
  });
});
