import { expect, test } from "@playwright/test";

test("fonts are served by this site, never by a font CDN", async ({
  page,
  baseURL,
}) => {
  const fontRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "font") fontRequests.push(request.url());
  });

  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);

  expect(fontRequests.length).toBeGreaterThan(0);
  for (const url of fontRequests) {
    expect(new URL(url).origin).toBe(new URL(baseURL!).origin);
  }

  const loaded = await page.evaluate(() =>
    [...document.fonts].some(
      (face) =>
        face.family.includes("instrumentSans") && face.status === "loaded",
    ),
  );
  expect(loaded).toBe(true);
});

test("every favicon in the page head is served as an image", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const hrefs = await page
    .locator('head link[rel="icon"], head link[rel="apple-touch-icon"]')
    .evaluateAll((links) => links.map((l) => l.getAttribute("href")!));

  // favicon.ico, the four small PNG sizes, 512 and the Apple touch icon.
  expect(hrefs).toHaveLength(7);
  for (const href of hrefs) {
    const response = await request.get(href);
    expect(response.status(), href).toBe(200);
    expect(response.headers()["content-type"], href).toMatch(/^image\//);
  }
});

test("both wordmark files are served", async ({ request }) => {
  for (const tone of ["carbon", "mineral"]) {
    const response = await request.get(`/brand/mendglass-wordmark-${tone}.svg`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/svg+xml");
  }
});
