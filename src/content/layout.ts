// Copy used by the site-wide layout: the skip link, the header and the footer.
//
// The footer strings are locked: they must match reference/01 section 5.8
// word for word. The two accessibility labels (skip link and wordmark link)
// are not in reference/01; the owner approved them for Brief 4 on
// 17 November 2026.
//
// Left out under D1 until their routes exist: the header's "Discuss your
// website" link (to /contact, Brief 7) and the footer's "Contact" (Brief 7)
// and "Privacy" (Brief 9) links. Each is restored in the pull request that
// ships its route.
export const layoutCopy = {
  skipLink: "Skip to content",
  wordmarkLink: "Mendglass home",
  footer: {
    location: "London, UK",
    copyright: "© Mendglass 2026",
  },
} as const;
