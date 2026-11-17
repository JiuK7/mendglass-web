import { z } from "zod";

// Temporary stub for the hosting test. Brief 5 replaces it with the real
// enquiry schema, validation and delivery. It accepts any JSON object and
// never logs or stores what it receives.
const stubBody = z.record(z.string(), z.unknown());

export async function POST(request: Request): Promise<Response> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const result = stubBody.safeParse(json);
  if (!result.success) {
    return Response.json({ ok: false }, { status: 400 });
  }

  return Response.json({ ok: true }, { status: 200 });
}
