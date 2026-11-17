import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, test } from "vitest";
import { textPairings } from "./text-pairings";

const root = process.cwd();
const css = readFileSync(join(root, "src/styles/globals.css"), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`Token --${name} is not defined`);
  return match[1].trim();
}

// WCAG 2.2 relative luminance and contrast ratio.
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("colour tokens", () => {
  // Brand System v1, sections 5 and 6.
  test.each([
    ["color-carbon", "#0a0a09"],
    ["color-mineral", "#f5f4f0"],
    ["color-deep-mineral", "#3a4136"],
    ["color-warm-stone", "#e5d9c8"],
    ["color-mist", "#bac2c8"],
    ["color-optical-accent", "#c5e0df"],
  ])("--%s is %s", (name, hex) => {
    expect(token(name).toLowerCase()).toBe(hex);
  });

  test("Tailwind's default palette is cleared", () => {
    expect(css).toMatch(/--color-\*:\s*initial;/);
  });

  test("muted text neutrals are readable on Mineral (at least 4.5:1)", () => {
    for (const name of ["color-neutral", "color-neutral-dark"]) {
      expect(contrast(token(name), token("color-mineral"))).toBeGreaterThan(
        4.5,
      );
    }
  });
});

describe("text colour pairings (text-pairings.ts)", () => {
  const pairs = Object.entries(textPairings).flatMap(([background, texts]) =>
    texts.map((text) => [text, background] as const),
  );

  test.each(pairs)("%s text on %s is at least 4.5:1", (text, background) => {
    expect(
      contrast(token(`color-${text}`), token(`color-${background}`)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  // From the pull request #3 review: these muted greys fail 4.5:1, so they
  // must not be allowed on these backgrounds.
  test.each([
    ["neutral", "warm-stone"],
    ["neutral", "mist"],
    ["neutral-dark", "mist"],
  ] as const)("%s text is not allowed on %s", (text, background) => {
    expect(
      contrast(token(`color-${text}`), token(`color-${background}`)),
    ).toBeLessThan(4.5);
    expect(textPairings[background]).not.toContain(text);
  });
});

describe("radius tokens", () => {
  test("every radius is between 6 and 10px", () => {
    const radii = [...css.matchAll(/--radius-[a-z]+:\s*(\d+)px;/g)].map((m) =>
      Number(m[1]),
    );
    expect(radii.length).toBeGreaterThan(0);
    for (const r of radii) {
      expect(r).toBeGreaterThanOrEqual(6);
      expect(r).toBeLessThanOrEqual(10);
    }
  });
});

describe("focus ring", () => {
  test("is Carbon by default and Mineral on dark surfaces", () => {
    expect(css).toMatch(
      /:root\s*{\s*--focus-ring-color:\s*var\(--color-carbon\);/,
    );
    expect(css).toMatch(
      /\[data-surface="dark"\]\s*{\s*--focus-ring-color:\s*var\(--color-mineral\);/,
    );
  });

  test("never uses Optical Accent", () => {
    expect(css).not.toMatch(/--focus-ring-color:\s*var\(--color-optical/);
  });

  test("meets 3:1 on every section background it is used on", () => {
    const carbon = token("color-carbon");
    const mineral = token("color-mineral");
    for (const light of ["color-mineral", "color-warm-stone", "color-mist"]) {
      expect(contrast(carbon, token(light))).toBeGreaterThanOrEqual(3);
    }
    for (const dark of ["color-carbon", "color-deep-mineral"]) {
      expect(contrast(mineral, token(dark))).toBeGreaterThanOrEqual(3);
    }
  });

  test("Optical Accent would fail 3:1 on Mineral, which is why it is excluded", () => {
    expect(
      contrast(token("color-optical-accent"), token("color-mineral")),
    ).toBeLessThan(3);
  });
});

describe("components use colour only through tokens", () => {
  function sourceFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return /\.(tsx|ts)$/.test(entry.name) && !/\.test\./.test(entry.name)
        ? [path]
        : [];
    });
  }

  test("no hex colour values in components or pages", () => {
    const hex = /#[0-9a-fA-F]{3,8}\b/;
    const offenders = sourceFiles(join(root, "src"))
      .filter((file) => hex.test(readFileSync(file, "utf8")))
      .map((file) => relative(root, file));
    expect(offenders).toEqual([]);
  });
});

describe("wordmark", () => {
  // Brand System section 2: Carbon on light, Mineral on dark, no effects.
  test.each([
    ["mendglass-wordmark-carbon.svg", "#0A0A09"],
    ["mendglass-wordmark-mineral.svg", "#F5F4F0"],
  ])("%s is filled only with %s and has no effects", (file, colour) => {
    const svg = readFileSync(join(root, "public/brand", file), "utf8");
    const fills = [...svg.matchAll(/fill="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(fills.filter((f) => f !== "none"))).toEqual(
      new Set([colour]),
    );
    expect(svg).not.toMatch(
      /Gradient|<filter|opacity|<mask|<image|stroke=|style=/i,
    );
  });
});
