import type { Metadata } from "next";
import localFont from "next/font/local";
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
  title: "Mendglass",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={instrumentSans.variable}>
      <body className="bg-mineral text-body text-carbon font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
