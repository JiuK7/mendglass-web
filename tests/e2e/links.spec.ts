import { expect, test } from "@playwright/test";

// No link points to a route that does not exist (Brief 4, and rule 1 for
// later briefs). Starting from the homepage, this visits every page the site
// links to, follows every internal link on each one, and expects a
// successful response. In-page links (#id) must point to an element that
// exists on that page.

test("every internal link resolves", async ({ page, request, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const toVisit = ["/"];
  const visited = new Set<string>();
  const failures: string[] = [];

  while (toVisit.length > 0) {
    const path = toVisit.shift()!;
    if (visited.has(path)) continue;
    visited.add(path);

    const response = await page.goto(path);
    if (!response || response.status() !== 200) {
      failures.push(`${path} returned ${response?.status()}`);
      continue;
    }

    const hrefs = await page
      .locator("a[href]")
      .evaluateAll((links) => links.map((l) => l.getAttribute("href")!));

    for (const href of hrefs) {
      if (href.startsWith("#")) {
        const id = decodeURIComponent(href.slice(1));
        const found = await page.locator(`[id="${id}"]`).count();
        if (found !== 1) failures.push(`${path}: ${href} has no target`);
        continue;
      }

      const url = new URL(href, origin + path);
      if (url.origin !== origin) continue;

      const target = url.pathname;
      if (!visited.has(target) && !toVisit.includes(target)) {
        const check = await request.get(target);
        if (check.status() !== 200) {
          failures.push(`${path}: ${href} returned ${check.status()}`);
        } else {
          toVisit.push(target);
        }
      }
    }
  }

  expect(failures).toEqual([]);
  expect(visited.size).toBeGreaterThanOrEqual(1);
});
