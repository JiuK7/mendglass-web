import { expect, test, type Page } from "@playwright/test";

// Brief 4: the site-wide layout (skip link, header, footer) on a real page.

test("the page language is British English", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");
});

test.describe("skip link", () => {
  test("is the first focusable element and appears when focused", async ({
    page,
  }) => {
    await page.goto("/");
    const skipLink = page.getByRole("link", { name: "Skip to content" });

    // Hidden from sight (but not from screen readers) until it has focus.
    const hidden = await skipLink.boundingBox();
    expect(hidden!.width).toBeLessThanOrEqual(1);

    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();

    const shown = await skipLink.boundingBox();
    expect(shown!.width).toBeGreaterThan(44);
    expect(shown!.height).toBeGreaterThanOrEqual(44);
    expect(shown!.y).toBeGreaterThanOrEqual(0);
  });

  test("moves keyboard focus to the main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    await expect(page.locator("main")).toBeFocused();
    expect(new URL(page.url()).hash).toBe("#main-content");
  });
});

test.describe("header", () => {
  test("holds only the wordmark, linking home", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");

    await expect(header.getByRole("link")).toHaveCount(1);
    const home = header.getByRole("link", { name: "Mendglass home" });
    await expect(home).toHaveAttribute("href", "/");
    await expect(home.locator("img")).toHaveAttribute(
      "src",
      "/brand/mendglass-wordmark-carbon.svg",
    );
    await expect(page.getByRole("navigation")).toHaveCount(0);
  });
});

test.describe("footer", () => {
  test("shows the approved location and copyright", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");

    await expect(footer).toContainText("London, UK");
    await expect(footer).toContainText("© Mendglass 2026");
    // Contact and Privacy return with their routes in Briefs 7 and 9.
    await expect(footer.getByRole("link")).toHaveCount(0);
  });
});

// Tab through the page and return every element that received focus, in
// order, until focus leaves the page or comes back round.
async function tabThroughPage(page: Page) {
  const seen: string[] = [];
  const results = [];
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return {
        key: el.outerHTML.slice(0, 120),
        name: el.textContent?.trim() || el.getAttribute("aria-label") || "",
        focusVisible: el.matches(":focus-visible"),
        outlineStyle: style.outlineStyle,
        outlineWidth: parseFloat(style.outlineWidth),
        outlineColor: style.outlineColor,
        width: box.width,
        height: box.height,
      };
    });
    if (!info || seen.includes(info.key)) break;
    seen.push(info.key);
    results.push(info);
  }
  return results;
}

for (const width of [390, 1440]) {
  test(`every control shows a focus ring and is at least 44px at ${width} wide`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const controls = await tabThroughPage(page);
    // At least the skip link and the wordmark link.
    expect(controls.length).toBeGreaterThanOrEqual(2);

    for (const control of controls) {
      expect(control.focusVisible, control.key).toBe(true);
      expect(control.outlineStyle, control.key).not.toBe("none");
      expect(control.outlineWidth, control.key).toBeGreaterThanOrEqual(2);
      expect(control.outlineColor, control.key).not.toBe("rgba(0, 0, 0, 0)");
      expect(control.width, control.key).toBeGreaterThanOrEqual(44);
      expect(control.height, control.key).toBeGreaterThanOrEqual(44);
    }
  });
}

test.describe("font weights", () => {
  // Brief 4: globals.css clears Tailwind's font settings with
  // `--font-*: initial`. This confirms that did not also remove the
  // font-weight utilities: `font-medium` must be in the built CSS and must
  // resolve to 500.
  test("font-medium exists in the built CSS and is weight 500", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    const hrefs = await page
      .locator('link[rel="stylesheet"]')
      .evaluateAll((links) => links.map((l) => l.getAttribute("href")!));
    expect(hrefs.length).toBeGreaterThan(0);

    let css = "";
    for (const href of hrefs) css += await (await request.get(href)).text();

    expect(css).toMatch(
      /\.font-medium\{[^}]*font-weight:var\(--font-weight-medium\)/,
    );
    expect(css).toMatch(/--font-weight-medium:500\b/);
  });

  test("a control using font-medium renders at weight 500", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const weight = await page
      .getByRole("link", { name: "Skip to content" })
      .evaluate((el) => getComputedStyle(el).fontWeight);
    expect(weight).toBe("500");
  });
});
