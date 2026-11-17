import { z } from "zod";

// The server environment, validated once at start-up (src/instrumentation.ts)
// and again whenever the enquiry route picks a sink. Reference/02 section 11
// asks for it here, validated with Zod.
//
// Error messages name the variable and the problem, never its value, so a
// secret can never reach a log through them.

/** The three environments of reference/02 section 12. */
export const siteEnvironments = [
  "development",
  "preview",
  "production",
] as const;
export type SiteEnvironment = (typeof siteEnvironments)[number];

/** Where enquiries go. `test` delivers nowhere and is refused in production. */
export const enquirySinkNames = ["test", "email", "n8n"] as const;
export type EnquirySinkName = (typeof enquirySinkNames)[number];

const required = z
  .string({ error: "is required" })
  .min(1, { error: "is required" });

const emailAddress = required.regex(z.regexes.email, {
  error: "must be an email address",
});

const httpsAddress = required.refine(
  (value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  },
  { error: "must be an https address" },
);

// Production is only ever production because SITE_ENV says so. A host's own
// variables (such as one Vercel or Cloudflare sets) are never consulted, so
// the code reads the same on any host.
const siteEnv = z
  .enum(siteEnvironments, {
    error: `must be one of ${siteEnvironments.join(", ")}`,
  })
  .default("development");

const testSinkEnv = z.object({
  SITE_ENV: siteEnv,
  ENQUIRY_SINK: z.literal("test"),
});

// Variables for the email sink (Brief 6, Resend's HTTP API).
const emailSinkEnv = z.object({
  SITE_ENV: siteEnv,
  ENQUIRY_SINK: z.literal("email"),
  RESEND_API_KEY: required,
  ENQUIRY_EMAIL_FROM: required,
  ENQUIRY_EMAIL_TO: emailAddress,
});

// Variables for the n8n sink (Brief 22): the webhook address and the secret
// sent in a header.
const n8nSinkEnv = z.object({
  SITE_ENV: siteEnv,
  ENQUIRY_SINK: z.literal("n8n"),
  N8N_WEBHOOK_URL: httpsAddress,
  N8N_WEBHOOK_SECRET: required,
});

const serverEnvSchema = z
  .discriminatedUnion("ENQUIRY_SINK", [testSinkEnv, emailSinkEnv, n8nSinkEnv], {
    error: `must be one of ${enquirySinkNames.join(", ")}`,
  })
  .refine(
    (env) => !(env.SITE_ENV === "production" && env.ENQUIRY_SINK === "test"),
    {
      error:
        "must be email or n8n when SITE_ENV is production (the test sink delivers nowhere)",
      path: ["ENQUIRY_SINK"],
    },
  );

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Only the variables this file reads, so nothing else is copied around. */
const knownVariables = [
  "SITE_ENV",
  "ENQUIRY_SINK",
  "RESEND_API_KEY",
  "ENQUIRY_EMAIL_FROM",
  "ENQUIRY_EMAIL_TO",
  "N8N_WEBHOOK_URL",
  "N8N_WEBHOOK_SECRET",
] as const;

export class ServerEnvError extends Error {
  constructor(problems: string[]) {
    super(`Invalid server environment: ${problems.join("; ")}.`);
    this.name = "ServerEnvError";
  }
}

/**
 * Validates a set of environment variables. An empty value counts as unset.
 * ENQUIRY_SINK defaults to `test` and SITE_ENV to `development`, so a fresh
 * clone runs with no setup and can never deliver anywhere real.
 *
 * Throws ServerEnvError if anything is missing or wrong.
 */
export function parseServerEnv(
  source: Record<string, string | undefined>,
): ServerEnv {
  const values: Record<string, string> = {};
  for (const key of knownVariables) {
    const value = source[key];
    if (value !== undefined && value !== "") {
      values[key] = value;
    }
  }
  values.ENQUIRY_SINK ??= "test";

  const result = serverEnvSchema.safeParse(values);
  if (!result.success) {
    throw new ServerEnvError(
      result.error.issues.map(
        (issue) => `${issue.path.join(".") || "environment"} ${issue.message}`,
      ),
    );
  }
  return result.data;
}

/** The current server environment, read from `process.env`. */
export function getServerEnv(): ServerEnv {
  return parseServerEnv(process.env);
}
