// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  addSchemeToBareDomain,
  enquiryLimits,
  HONEYPOT_FIELD,
  isHoneypotFilled,
  parseEnquiry,
  type Enquiry,
} from "./enquiry";

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  businessName: "The Analytical Kitchen",
  websiteUrl: "https://example.com",
  helpType: "new-website",
  description: "We would like a new website for our restaurant.",
};

function withField(field: string, value: unknown): Record<string, unknown> {
  return { ...valid, [field]: value };
}

function without(field: string): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...valid };
  delete copy[field];
  return copy;
}

function errorFor(input: unknown, field: keyof Enquiry) {
  const result = parseEnquiry(input);
  if (result.success) {
    throw new Error(`Expected ${field} to fail, but the enquiry was valid.`);
  }
  return result.fieldErrors[field];
}

function parsed(input: unknown): Enquiry {
  const result = parseEnquiry(input);
  if (!result.success) {
    throw new Error(`Expected a valid enquiry: ${JSON.stringify(result)}`);
  }
  return result.enquiry;
}

describe("a complete, valid enquiry", () => {
  it("parses to the DTO", () => {
    expect(parsed(valid)).toEqual(valid);
  });

  it("drops keys that are not in the DTO, including the honeypot", () => {
    const enquiry = parsed({ ...valid, [HONEYPOT_FIELD]: "", role: "admin" });
    expect(Object.keys(enquiry).sort()).toEqual(Object.keys(valid).sort());
  });
});

describe("input that is not an object", () => {
  it.each([null, [], "text", 42])(
    "rejects %j with no field errors",
    (input) => {
      expect(parseEnquiry(input)).toEqual({ success: false, fieldErrors: {} });
    },
  );
});

describe("name", () => {
  it("accepts accented and non-Latin letters and emoji", () => {
    expect(parsed(withField("name", "Zoë Ōkubo 李")).name).toBe("Zoë Ōkubo 李");
    expect(parsed(withField("name", "Chef 👩‍🍳")).name).toBe("Chef 👩‍🍳");
  });

  it("accepts exactly 100 characters", () => {
    expect(parsed(withField("name", "a".repeat(100))).name).toHaveLength(100);
  });

  it("rejects 101 characters", () => {
    expect(errorFor(withField("name", "a".repeat(101)), "name")).toBe(
      "too-long",
    );
  });

  it("is required: missing, empty or only spaces", () => {
    expect(errorFor(without("name"), "name")).toBe("required");
    expect(errorFor(withField("name", ""), "name")).toBe("required");
    expect(errorFor(withField("name", "   "), "name")).toBe("required");
  });

  it("rejects a value that is not a string", () => {
    expect(errorFor(withField("name", 42), "name")).toBe("invalid");
    expect(errorFor(withField("name", null), "name")).toBe("invalid");
  });

  it.each([
    "Ada\nLovelace",
    "Ada\tLovelace",
    "Ada\u0000",
    "Ada\u007f",
    "Ada\u0085",
  ])("rejects control characters: %j", (value) => {
    expect(errorFor(withField("name", value), "name")).toBe("invalid");
  });
});

describe("email", () => {
  it("accepts an ordinary address", () => {
    expect(parsed(withField("email", "chef+web@kitchen.co.uk")).email).toBe(
      "chef+web@kitchen.co.uk",
    );
  });

  it("accepts exactly 254 characters", () => {
    const address = `${"a".repeat(64)}@${"b".repeat(185)}.com`;
    expect(address).toHaveLength(254);
    expect(parsed(withField("email", address)).email).toBe(address);
  });

  it("rejects 255 characters", () => {
    const address = `${"a".repeat(64)}@${"b".repeat(186)}.com`;
    expect(errorFor(withField("email", address), "email")).toBe("too-long");
  });

  it("is required", () => {
    expect(errorFor(without("email"), "email")).toBe("required");
    expect(errorFor(withField("email", " "), "email")).toBe("required");
  });

  it.each([
    "ada",
    "ada@",
    "@example.com",
    "ada@example",
    "ada @example.com",
    "ada@@example.com",
    "ada@exa\nmple.com",
  ])("rejects %j", (value) => {
    expect(errorFor(withField("email", value), "email")).toBe("invalid");
  });

  it("rejects a value that is not a string", () => {
    expect(errorFor(withField("email", ["ada@example.com"]), "email")).toBe(
      "invalid",
    );
  });
});

describe("businessName", () => {
  it("accepts exactly 150 characters", () => {
    expect(
      parsed(withField("businessName", "b".repeat(150))).businessName,
    ).toHaveLength(150);
  });

  it("rejects 151 characters", () => {
    expect(
      errorFor(withField("businessName", "b".repeat(151)), "businessName"),
    ).toBe("too-long");
  });

  it("is required", () => {
    expect(errorFor(without("businessName"), "businessName")).toBe("required");
    expect(errorFor(withField("businessName", ""), "businessName")).toBe(
      "required",
    );
  });

  it("rejects control characters", () => {
    expect(
      errorFor(withField("businessName", "Café\r\nBcc: x"), "businessName"),
    ).toBe("invalid");
  });

  it("rejects a value that is not a string", () => {
    expect(errorFor(withField("businessName", {}), "businessName")).toBe(
      "invalid",
    );
  });
});

describe("websiteUrl", () => {
  it("is optional: missing or empty means no website", () => {
    expect(parsed(without("websiteUrl"))).not.toHaveProperty("websiteUrl");
    expect(parsed(withField("websiteUrl", ""))).not.toHaveProperty(
      "websiteUrl",
    );
    expect(parsed(withField("websiteUrl", "   "))).not.toHaveProperty(
      "websiteUrl",
    );
  });

  it.each([
    "https://example.com",
    "http://example.com",
    "https://www.example.co.uk/menu?lang=en",
  ])("keeps a full address as it is: %s", (value) => {
    expect(parsed(withField("websiteUrl", value)).websiteUrl).toBe(value);
  });

  it.each([
    "javascript:alert(1)",
    "ftp://example.com",
    "mailto:ada@example.com",
    "https://ada:secret@example.com",
    "localhost",
    "https://example",
    "not a website",
    "https://exa mple.com",
  ])("rejects %j", (value) => {
    expect(errorFor(withField("websiteUrl", value), "websiteUrl")).toBe(
      "invalid",
    );
  });

  it("rejects control characters", () => {
    expect(
      errorFor(withField("websiteUrl", "example.com/\u0000"), "websiteUrl"),
    ).toBe("invalid");
  });

  it("rejects an address over the limit once https:// is added", () => {
    const max = enquiryLimits.websiteUrl.max;
    const fits = `example.com/${"a".repeat(max - "https://example.com/".length)}`;
    expect(parsed(withField("websiteUrl", fits)).websiteUrl).toHaveLength(max);
    expect(errorFor(withField("websiteUrl", `${fits}a`), "websiteUrl")).toBe(
      "too-long",
    );
  });

  it("rejects a value that is not a string", () => {
    expect(errorFor(withField("websiteUrl", 42), "websiteUrl")).toBe("invalid");
    expect(errorFor(withField("websiteUrl", null), "websiteUrl")).toBe(
      "invalid",
    );
  });
});

describe("helpType", () => {
  it.each([
    "new-website",
    "website-redesign",
    "ongoing-care",
    "not-sure",
    "other",
  ])("accepts %s", (value) => {
    expect(parsed(withField("helpType", value)).helpType).toBe(value);
  });

  it("is required: missing or the empty choice", () => {
    expect(errorFor(without("helpType"), "helpType")).toBe("required");
    expect(errorFor(withField("helpType", ""), "helpType")).toBe("required");
  });

  it.each(["New website", "seo", 1, null])("rejects %j", (value) => {
    expect(errorFor(withField("helpType", value), "helpType")).toBe("invalid");
  });
});

describe("description", () => {
  it("accepts exactly 10 and exactly 2000 characters", () => {
    expect(
      parsed(withField("description", "d".repeat(10))).description,
    ).toHaveLength(10);
    expect(
      parsed(withField("description", "d".repeat(2000))).description,
    ).toHaveLength(2000);
  });

  it("rejects 9 and 2001 characters", () => {
    expect(
      errorFor(withField("description", "d".repeat(9)), "description"),
    ).toBe("too-short");
    expect(
      errorFor(withField("description", "d".repeat(2001)), "description"),
    ).toBe("too-long");
  });

  it("counts length after trimming", () => {
    expect(
      errorFor(
        withField("description", `   ${"d".repeat(9)}   `),
        "description",
      ),
    ).toBe("too-short");
  });

  it("is required", () => {
    expect(errorFor(without("description"), "description")).toBe("required");
    expect(errorFor(withField("description", "  "), "description")).toBe(
      "required",
    );
  });

  it("keeps line breaks and tabs, because it is multi-line", () => {
    const text = "Line one\nLine two\r\nLine three\tindented";
    expect(parsed(withField("description", text)).description).toBe(text);
  });

  it.each([
    "Hello there\u0000",
    "Hello there\u0007",
    "Hello there\u001b[31m",
    "Hello there\u009b",
  ])("rejects other control characters: %j", (value) => {
    expect(errorFor(withField("description", value), "description")).toBe(
      "invalid",
    );
  });

  it("rejects a value that is not a string", () => {
    expect(
      errorFor(withField("description", ["a long description"]), "description"),
    ).toBe("invalid");
  });
});

describe("normalisation", () => {
  it("trims every text field", () => {
    const enquiry = parsed({
      name: "  Ada Lovelace \n",
      email: "  ada@example.com ",
      businessName: "\tThe Analytical Kitchen  ",
      websiteUrl: "  https://example.com  ",
      helpType: "ongoing-care",
      description: "\n  We would like a new website.  \n",
    });
    expect(enquiry).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      businessName: "The Analytical Kitchen",
      websiteUrl: "https://example.com",
      helpType: "ongoing-care",
      description: "We would like a new website.",
    });
  });

  it("lower-cases the email", () => {
    expect(parsed(withField("email", "Ada.Lovelace@Example.COM")).email).toBe(
      "ada.lovelace@example.com",
    );
  });

  it("adds https:// to a bare domain", () => {
    expect(parsed(withField("websiteUrl", "example.com")).websiteUrl).toBe(
      "https://example.com",
    );
    expect(
      parsed(withField("websiteUrl", " www.example.co.uk/menu ")).websiteUrl,
    ).toBe("https://www.example.co.uk/menu");
  });

  it("leaves an address that already has a scheme alone", () => {
    expect(addSchemeToBareDomain("http://example.com")).toBe(
      "http://example.com",
    );
    expect(addSchemeToBareDomain("HTTPS://example.com")).toBe(
      "HTTPS://example.com",
    );
  });
});

describe("field errors", () => {
  it("reports every failing field, one code each", () => {
    const result = parseEnquiry({ email: "nope", helpType: "x" });
    expect(result).toEqual({
      success: false,
      fieldErrors: {
        name: "required",
        email: "invalid",
        businessName: "required",
        helpType: "invalid",
        description: "required",
      },
    });
  });
});

describe("honeypot", () => {
  it("is empty when missing, null, empty or blank", () => {
    expect(isHoneypotFilled(valid)).toBe(false);
    expect(isHoneypotFilled({ ...valid, [HONEYPOT_FIELD]: null })).toBe(false);
    expect(isHoneypotFilled({ ...valid, [HONEYPOT_FIELD]: "" })).toBe(false);
    expect(isHoneypotFilled({ ...valid, [HONEYPOT_FIELD]: "  " })).toBe(false);
  });

  it("is filled by any text or any other value", () => {
    expect(isHoneypotFilled({ ...valid, [HONEYPOT_FIELD]: "Buy now" })).toBe(
      true,
    );
    expect(isHoneypotFilled({ ...valid, [HONEYPOT_FIELD]: 0 })).toBe(true);
    expect(isHoneypotFilled({ ...valid, [HONEYPOT_FIELD]: false })).toBe(true);
  });

  it("is never filled for input that is not an object", () => {
    expect(isHoneypotFilled(null)).toBe(false);
    expect(isHoneypotFilled([HONEYPOT_FIELD])).toBe(false);
    expect(isHoneypotFilled("subject")).toBe(false);
  });
});
