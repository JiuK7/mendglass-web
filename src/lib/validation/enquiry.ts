import { z } from "zod";

// The enquiry the website accepts: the input schema, its normalisation and
// the DTO (data transfer object) every sink receives. Reference/02 section 9
// fixes the DTO; Brief 5 fixes the limits and the normalisation rules.
//
// The server always validates with this schema. Brief 7's form reuses it in
// the browser, so the two can never disagree.

export const helpTypes = [
  "new-website",
  "website-redesign",
  "ongoing-care",
  "not-sure",
  "other",
] as const;

export type HelpType = (typeof helpTypes)[number];

/** The normalised enquiry passed to a sink (reference/02 section 9). */
export type Enquiry = {
  name: string;
  email: string;
  businessName: string;
  websiteUrl?: string;
  helpType: HelpType;
  description: string;
};

/**
 * Lengths are counted after trimming, in JavaScript string length (UTF-16
 * code units). That is the same unit the browser's `maxlength` attribute
 * counts, so a form limit and this limit agree.
 *
 * Brief 5 sets name, email, businessName and description (to be confirmed
 * at review). The websiteUrl limit is not in the brief; see ADR 002.
 */
export const enquiryLimits = {
  name: { max: 100 },
  email: { max: 254 },
  businessName: { max: 150 },
  websiteUrl: { max: 2048 },
  description: { min: 10, max: 2000 },
} as const;

/**
 * The honeypot: a field people never see, so only bots fill it in. Brief 7
 * renders it hidden from people and from assistive technology. The name is
 * one that browsers' autofill does not recognise, so it stays empty for
 * real visitors.
 */
export const HONEYPOT_FIELD = "subject";

/**
 * Field errors are codes, not sentences. The words a visitor reads are copy,
 * and copy is approved separately (Brief 7); the form maps each code to its
 * approved message.
 */
export const fieldErrorCodes = [
  "required",
  "too-short",
  "too-long",
  "invalid",
] as const;

export type FieldErrorCode = (typeof fieldErrorCodes)[number];

export type EnquiryFieldErrors = Partial<Record<keyof Enquiry, FieldErrorCode>>;

export type EnquiryParseResult =
  | { success: true; enquiry: Enquiry }
  | { success: false; fieldErrors: EnquiryFieldErrors };

// Control characters (Unicode category Cc: U+0000 to U+001F and U+007F to
// U+009F) are rejected. The description is multi-line, so it may keep tab,
// line feed and carriage return; every other field is one line.
const controlCharacter = /\p{Cc}/u;
const controlCharacterExceptLineBreaksAndTab = /[^\P{Cc}\t\n\r]/u;

/** A missing value or an empty choice reads as "required", anything else of the wrong type as "invalid". */
function missingOrInvalid(issue: { input?: unknown }): FieldErrorCode {
  return issue.input === undefined || issue.input === ""
    ? "required"
    : "invalid";
}

function requiredText(options: {
  min?: number;
  max: number;
  multiLine?: boolean;
}) {
  const forbidden = options.multiLine
    ? controlCharacterExceptLineBreaksAndTab
    : controlCharacter;

  return z
    .string({ error: missingOrInvalid })
    .trim()
    .min(1, { error: "required" })
    .min(options.min ?? 1, { error: "too-short" })
    .max(options.max, { error: "too-long" })
    .refine((value) => !forbidden.test(value), { error: "invalid" });
}

const email = z
  .string({ error: missingOrInvalid })
  .trim()
  .toLowerCase()
  .min(1, { error: "required" })
  .max(enquiryLimits.email.max, { error: "too-long" })
  .regex(z.regexes.email, { error: "invalid" });

const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i;

/** "example.com" becomes "https://example.com"; an address with a scheme is left as it is. */
export function addSchemeToBareDomain(value: string): string {
  return hasScheme.test(value) ? value : `https://${value}`;
}

/** An http or https address with a dotted host name and no user name or password. */
function isWebsiteAddress(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    (url.protocol === "https:" || url.protocol === "http:") &&
    url.hostname.includes(".") &&
    url.username === "" &&
    url.password === ""
  );
}

// Optional: a missing or empty value means "no website".
const websiteUrl = z
  .string({ error: "invalid" })
  .optional()
  .transform((value, context) => {
    const trimmed = value?.trim() ?? "";
    if (trimmed === "") {
      return undefined;
    }
    if (controlCharacter.test(trimmed)) {
      context.addIssue({ code: "custom", message: "invalid" });
      return z.NEVER;
    }
    const address = addSchemeToBareDomain(trimmed);
    if (address.length > enquiryLimits.websiteUrl.max) {
      context.addIssue({ code: "custom", message: "too-long" });
      return z.NEVER;
    }
    if (!isWebsiteAddress(address)) {
      context.addIssue({ code: "custom", message: "invalid" });
      return z.NEVER;
    }
    return address;
  });

/**
 * The input schema. Parsing also normalises: text is trimmed, the email is
 * lower-cased and a bare domain gains `https://`. Unknown keys, including
 * the honeypot, are dropped.
 */
export const enquirySchema = z.object({
  name: requiredText({ max: enquiryLimits.name.max }),
  email,
  businessName: requiredText({ max: enquiryLimits.businessName.max }),
  websiteUrl,
  helpType: z.enum(helpTypes, { error: missingOrInvalid }),
  description: requiredText({
    min: enquiryLimits.description.min,
    max: enquiryLimits.description.max,
    multiLine: true,
  }),
});

const enquiryFields = Object.keys(enquirySchema.shape) as (keyof Enquiry)[];

function isEnquiryField(key: PropertyKey | undefined): key is keyof Enquiry {
  return enquiryFields.includes(key as keyof Enquiry);
}

function isFieldErrorCode(message: string): message is FieldErrorCode {
  return (fieldErrorCodes as readonly string[]).includes(message);
}

/** Validates and normalises untrusted input. Never throws. */
export function parseEnquiry(input: unknown): EnquiryParseResult {
  const result = enquirySchema.safeParse(input);

  if (!result.success) {
    // One code per field: the first problem found, which is the one to fix first.
    const fieldErrors: EnquiryFieldErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (isEnquiryField(field) && fieldErrors[field] === undefined) {
        fieldErrors[field] = isFieldErrorCode(issue.message)
          ? issue.message
          : "invalid";
      }
    }
    return { success: false, fieldErrors };
  }

  // Leave websiteUrl out entirely, rather than present but undefined, when
  // there is none.
  const { websiteUrl: address, ...rest } = result.data;
  const enquiry: Enquiry =
    address === undefined ? rest : { ...rest, websiteUrl: address };
  return { success: true, enquiry };
}

/**
 * True when the honeypot holds anything other than nothing or blank space.
 * Checked before validation, so a bot is told "accepted" whatever else it
 * sent.
 */
export function isHoneypotFilled(body: unknown): boolean {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return false;
  }
  const value: unknown = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  if (value === undefined || value === null) {
    return false;
  }
  return typeof value === "string" ? value.trim() !== "" : true;
}
