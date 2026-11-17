import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { expect, test } from "vitest";

// Brief 4: none of the layout files is a client component, so the layout adds
// no browser JavaScript of its own. A file becomes a client component when it
// starts with the "use client" directive.
//
// Brief 16 adds MobileMenu to src/components/layout/ as the one client
// component the header may import; list it here as the only exception then.
const root = process.cwd();

function componentFiles(dir: string): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true })
    .filter((entry) => /\.tsx?$/.test(entry.name))
    .filter((entry) => !/\.test\./.test(entry.name))
    .map((entry) => join(dir, entry.name));
}

const files = [
  "src/app/layout.tsx",
  ...componentFiles("src/components/layout"),
  ...componentFiles("src/components/ui"),
];

test("the layout files exist", () => {
  expect(files.map((file) => relative(".", file))).toEqual(
    expect.arrayContaining([
      "src/app/layout.tsx",
      "src/components/layout/Footer.tsx",
      "src/components/layout/Header.tsx",
      "src/components/layout/SkipLink.tsx",
      "src/components/ui/Button.tsx",
    ]),
  );
});

test.each(files)("%s is not a client component", (file) => {
  const source = readFileSync(join(root, file), "utf8");
  expect(source).not.toMatch(/^\s*["']use client["']/m);
});
