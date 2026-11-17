import Link from "next/link";
import { layoutCopy } from "@/content/layout";

// Site header: the wordmark, linking home. No other navigation and no
// MobileMenu (Brief 4). The "Discuss your website" link to /contact is left
// out under D1 until Brief 7 ships that route.
export function Header() {
  return (
    <header>
      <div className="mx-auto flex max-w-7xl items-center px-5 py-4 md:px-8">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-sm">
          {/*
           * A plain <img>, not next/image: the wordmark is a small SVG that
           * needs no resizing, and next/image is a client component, which
           * would add browser JavaScript to every page. Carbon on this light
           * header (Brand System section 2).
           */}
          {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
          <img
            src="/brand/mendglass-wordmark-carbon.svg"
            alt={layoutCopy.wordmarkLink}
            width={300}
            height={73}
            className="h-7 w-auto md:h-8"
          />
        </Link>
      </div>
    </header>
  );
}
