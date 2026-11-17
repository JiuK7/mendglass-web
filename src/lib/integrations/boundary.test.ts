// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// Brief 5: searching src/ finds no Airtable or n8n identifiers. The website
// knows about an enquiry, never the CRM behind it (reference/02 section 9).
// n8n's internals belong to n8n and Airtable's to Airtable.
//
// The word "n8n" itself is allowed: it is the name of one ENQUIRY_SINK value
// and of that sink's variables (src/lib/env.ts). What may not appear is
// anything that identifies their insides: Airtable at all, Airtable's base,
// table, field, view or record IDs, n8n hosts, or webhook paths. Brief 22
// keeps this test passing.

const srcRoot = join(process.cwd(), "src");
const thisFile = relative(srcRoot, __filename);
const textExtensions = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".js",
  ".mjs",
  ".css",
  ".json",
  ".md",
  ".txt",
]);

const forbidden: [string, RegExp][] = [
  ["mention of Airtable", /airtable/i],
  ["Airtable ID", /\b(?:app|tbl|fld|viw|rec|sel|usr|wsp)[A-Za-z0-9]{14}\b/],
  ["n8n host", /n8n\.(?:cloud|io)|\.app\.n8n\./i],
  ["n8n webhook path", /\/webhook(?:-test)?\//i],
];

function textFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return textFiles(path);
    return textExtensions.has(extname(entry.name)) ? [path] : [];
  });
}

describe("src/ has no Airtable or n8n identifiers", () => {
  const files = textFiles(srcRoot).filter(
    (path) => relative(srcRoot, path) !== thisFile,
  );

  it("scans the source files", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(forbidden)("finds no %s", (_label, pattern) => {
    const hits = files.flatMap((path) =>
      readFileSync(path, "utf8")
        .split("\n")
        .flatMap((line, index) =>
          pattern.test(line) ? [`${relative(srcRoot, path)}:${index + 1}`] : [],
        ),
    );
    expect(hits).toEqual([]);
  });
});
