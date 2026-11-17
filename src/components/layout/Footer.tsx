import { layoutCopy } from "@/content/layout";

// Site footer (reference/01 section 5.8). Contact and Privacy links are left
// out under D1 until Briefs 7 and 9 ship those routes. The middle dot is the
// visual separator from the approved string; screen readers skip it.
export function Footer() {
  const { location, copyright } = layoutCopy.footer;

  return (
    <footer className="border-t border-neutral-light">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-5 py-8 text-body-sm text-neutral-dark md:px-8">
        <p>{location}</p>
        <span aria-hidden="true">·</span>
        <p>{copyright}</p>
      </div>
    </footer>
  );
}
