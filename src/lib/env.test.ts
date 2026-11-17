// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { getServerEnv, parseServerEnv, ServerEnvError } from "./env";

const emailVariables = {
  ENQUIRY_SINK: "email",
  RESEND_API_KEY: "re_test_SECRET_VALUE_123",
  ENQUIRY_EMAIL_FROM: "Mendglass website <enquiries@example.com>",
  ENQUIRY_EMAIL_TO: "studio@example.com",
};

const n8nVariables = {
  ENQUIRY_SINK: "n8n",
  N8N_WEBHOOK_URL: "https://workflows.example.com/hook/abc",
  N8N_WEBHOOK_SECRET: "SECRET_HEADER_VALUE_456",
};

function failure(source: Record<string, string | undefined>): ServerEnvError {
  try {
    parseServerEnv(source);
  } catch (error) {
    expect(error).toBeInstanceOf(ServerEnvError);
    return error as ServerEnvError;
  }
  throw new Error("Expected the environment to be refused.");
}

describe("defaults", () => {
  it("with nothing set: development and the test sink", () => {
    expect(parseServerEnv({})).toEqual({
      SITE_ENV: "development",
      ENQUIRY_SINK: "test",
    });
  });

  it("treats an empty value as unset", () => {
    expect(parseServerEnv({ SITE_ENV: "", ENQUIRY_SINK: "" })).toEqual({
      SITE_ENV: "development",
      ENQUIRY_SINK: "test",
    });
  });

  it("ignores variables it does not read", () => {
    expect(
      parseServerEnv({ PATH: "/usr/bin", NEXTJS_ENV: "development" }),
    ).toEqual({
      SITE_ENV: "development",
      ENQUIRY_SINK: "test",
    });
  });
});

describe("SITE_ENV", () => {
  it.each(["development", "preview"])(
    "allows the test sink in %s",
    (siteEnv) => {
      expect(
        parseServerEnv({ SITE_ENV: siteEnv, ENQUIRY_SINK: "test" }),
      ).toEqual({
        SITE_ENV: siteEnv,
        ENQUIRY_SINK: "test",
      });
    },
  );

  it.each(["prod", "Production", "staging"])(
    "refuses an unknown value: %s",
    (siteEnv) => {
      expect(failure({ SITE_ENV: siteEnv }).message).toContain(
        "SITE_ENV must be one of",
      );
    },
  );

  it("is never inferred from a host's own variables", () => {
    const env = parseServerEnv({
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      CF_PAGES_BRANCH: "main",
      NEXTJS_ENV: "production",
    });
    expect(env.SITE_ENV).toBe("development");
  });
});

describe("production refuses the test sink", () => {
  it("when ENQUIRY_SINK is test", () => {
    expect(
      failure({ SITE_ENV: "production", ENQUIRY_SINK: "test" }).message,
    ).toContain(
      "ENQUIRY_SINK must be email or n8n when SITE_ENV is production",
    );
  });

  it("when ENQUIRY_SINK is unset, because it then defaults to test", () => {
    expect(failure({ SITE_ENV: "production" }).message).toContain(
      "ENQUIRY_SINK must be email or n8n when SITE_ENV is production",
    );
  });
});

describe("ENQUIRY_SINK", () => {
  it.each(["webhook", "TEST", "database"])(
    "refuses an unknown value: %s",
    (sink) => {
      expect(failure({ ENQUIRY_SINK: sink }).message).toContain(
        "ENQUIRY_SINK must be one of test, email, n8n",
      );
    },
  );

  it("test needs no other variables", () => {
    expect(parseServerEnv({ ENQUIRY_SINK: "test" })).toEqual({
      SITE_ENV: "development",
      ENQUIRY_SINK: "test",
    });
  });
});

describe("the email sink", () => {
  it("is accepted with all its variables, in development and production", () => {
    expect(parseServerEnv(emailVariables)).toEqual({
      SITE_ENV: "development",
      ...emailVariables,
    });
    expect(
      parseServerEnv({ ...emailVariables, SITE_ENV: "production" }),
    ).toEqual({
      SITE_ENV: "production",
      ...emailVariables,
    });
  });

  it.each(["RESEND_API_KEY", "ENQUIRY_EMAIL_FROM", "ENQUIRY_EMAIL_TO"])(
    "needs %s",
    (name) => {
      expect(
        failure({ ...emailVariables, [name]: undefined }).message,
      ).toContain(`${name} is required`);
      expect(failure({ ...emailVariables, [name]: "" }).message).toContain(
        `${name} is required`,
      );
    },
  );

  it("needs ENQUIRY_EMAIL_TO to be an email address", () => {
    expect(
      failure({ ...emailVariables, ENQUIRY_EMAIL_TO: "studio" }).message,
    ).toContain("ENQUIRY_EMAIL_TO must be an email address");
  });

  it("drops the n8n variables it does not use", () => {
    const env = parseServerEnv({
      ...emailVariables,
      N8N_WEBHOOK_URL: "https://x.example.com",
    });
    expect(env).not.toHaveProperty("N8N_WEBHOOK_URL");
  });
});

describe("the n8n sink", () => {
  it("is accepted with all its variables, in development and production", () => {
    expect(parseServerEnv(n8nVariables)).toEqual({
      SITE_ENV: "development",
      ...n8nVariables,
    });
    expect(parseServerEnv({ ...n8nVariables, SITE_ENV: "production" })).toEqual(
      {
        SITE_ENV: "production",
        ...n8nVariables,
      },
    );
  });

  it.each(["N8N_WEBHOOK_URL", "N8N_WEBHOOK_SECRET"])("needs %s", (name) => {
    expect(failure({ ...n8nVariables, [name]: undefined }).message).toContain(
      `${name} is required`,
    );
  });

  it.each([
    "http://workflows.example.com/hook",
    "workflows.example.com",
    "not a url",
  ])("needs an https webhook address, not %s", (address) => {
    expect(
      failure({ ...n8nVariables, N8N_WEBHOOK_URL: address }).message,
    ).toContain("N8N_WEBHOOK_URL must be an https address");
  });
});

describe("error messages", () => {
  it("name the variable but never show a secret's value", () => {
    const message = failure({
      SITE_ENV: "production",
      ENQUIRY_SINK: "email",
      RESEND_API_KEY: emailVariables.RESEND_API_KEY,
      ENQUIRY_EMAIL_TO: "not-an-address-SECRET",
    }).message;
    expect(message).toContain("ENQUIRY_EMAIL_FROM is required");
    expect(message).not.toContain(emailVariables.RESEND_API_KEY);
    expect(message).not.toContain("not-an-address-SECRET");
  });

  it("list every problem at once", () => {
    const message = failure({ ENQUIRY_SINK: "email" }).message;
    expect(message).toContain("RESEND_API_KEY is required");
    expect(message).toContain("ENQUIRY_EMAIL_FROM is required");
    expect(message).toContain("ENQUIRY_EMAIL_TO is required");
  });
});

describe("getServerEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads process.env", () => {
    vi.stubEnv("SITE_ENV", "preview");
    vi.stubEnv("ENQUIRY_SINK", "test");
    expect(getServerEnv()).toEqual({
      SITE_ENV: "preview",
      ENQUIRY_SINK: "test",
    });
  });

  it("throws for production with the test sink", () => {
    vi.stubEnv("SITE_ENV", "production");
    vi.stubEnv("ENQUIRY_SINK", "test");
    expect(() => getServerEnv()).toThrow(ServerEnvError);
  });
});
