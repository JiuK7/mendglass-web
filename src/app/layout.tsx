import type { Metadata } from "next";
import localFont from "next/font/local";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { mainContentId, SkipLink } from "@/components/layout/SkipLink";
import { siteOrigin } from "@/lib/site";
import "@/styles/globals.css";

// Instrument Sans is served from this site, not a font CDN (reference/02).
// Only the two weights the brand uses: Regular for body, Medium for headings
// and labels. Licence: ./fonts/OFL.txt.
const instrumentSans = localFont({
  src: [
    { path: "./fonts/InstrumentSans-Regular.woff2", weight: "400" },
    { path: "./fonts/InstrumentSans-Medium.woff2", weight: "500" },
  ],
  variable: "--font-instrument-sans",
  display: "swap",
});

export const metadata: Metadata = {
  // Relative URLs in page metadata (canonical, Open Graph) resolve against
  // the canonical origin.
  metadataBase: new URL(siteOrigin),
  title: "Mendglass",
};

// Every part of this layout is a Server Component, so it adds no browser
// JavaScript of its own. The skip link must stay the first focusable element.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={instrumentSans.variable}>
      <body className="flex min-h-dvh flex-col bg-mineral font-sans text-body text-carbon antialiased">
        <SkipLink />
        <Header />
        {/*
         * tabIndex -1 lets the skip link move keyboard focus here in every
         * browser. <main> is a landing point, not a control, so it draws no
         * focus ring.
         */}
        <main
          id={mainContentId}
          tabIndex={-1}
          className="flex-1 focus-visible:outline-none"
        >
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
