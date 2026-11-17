import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Button, ButtonLink } from "./Button";

// No page renders these primitives yet (the header's "Discuss your website"
// link arrives with /contact in Brief 7), so their touch-target size and
// focus ring are checked here through their classes. The end-to-end tests
// check real sizes and focus rings on every control a page does render.

describe("Button", () => {
  test("is a real button that does not submit a form by default", () => {
    render(<Button>Send</Button>);
    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  test("primary is Carbon with Mineral text in Medium weight", () => {
    render(<Button>Send</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-carbon", "text-mineral", "font-medium");
  });

  test("secondary is transparent with a thin Carbon border and Carbon text", () => {
    render(<Button variant="secondary">Send</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass(
      "bg-transparent",
      "border",
      "border-carbon",
      "text-carbon",
    );
    expect(button).not.toHaveClass("bg-carbon");
  });
});

describe("ButtonLink", () => {
  test("is a real link to its destination", () => {
    render(<ButtonLink href="/">Home</ButtonLink>);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  test.each(["primary", "secondary"] as const)(
    "%s has the same look as the matching Button",
    (variant) => {
      render(
        <>
          <Button variant={variant}>A</Button>
          <ButtonLink variant={variant} href="/">
            B
          </ButtonLink>
        </>,
      );
      expect(screen.getByRole("link").className).toBe(
        screen.getByRole("button").className,
      );
    },
  );
});

describe("both primitives", () => {
  test.each(["primary", "secondary"] as const)(
    "%s is at least 44px tall and keeps the global focus ring",
    (variant) => {
      render(
        <>
          <Button variant={variant}>A</Button>
          <ButtonLink variant={variant} href="/">
            B
          </ButtonLink>
        </>,
      );
      for (const control of [
        screen.getByRole("button"),
        screen.getByRole("link"),
      ]) {
        // min-h-11 is 2.75rem, which is 44px.
        expect(control).toHaveClass("min-h-11");
        expect(control.className).not.toMatch(/outline-(none|hidden)/);
      }
    },
  );

  test("className adds placement classes and keeps the variant", () => {
    render(<Button className="mt-6">Send</Button>);
    expect(screen.getByRole("button")).toHaveClass("mt-6", "bg-carbon");
  });
});
