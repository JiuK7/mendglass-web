import { buttonClasses } from "@/components/ui/Button";
import { layoutCopy } from "@/content/layout";

// The id of the <main> element the skip link jumps to (set in the root
// layout).
export const mainContentId = "main-content";

// The first focusable element on every page. It stays hidden until it has
// keyboard focus, then appears in the top-left corner as a primary button, so
// a keyboard user can jump past the header straight to the page content.
// It is a plain in-page link, so it works without JavaScript.
export function SkipLink() {
  return (
    <a
      href={`#${mainContentId}`}
      className={buttonClasses(
        "primary",
        "fixed top-4 left-4 z-10 not-focus:sr-only",
      )}
    >
      {layoutCopy.skipLink}
    </a>
  );
}
