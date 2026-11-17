import Link from "next/link";
import type { ComponentProps } from "react";

// Button and link primitives (Brand System v1, section 10), for light
// surfaces:
// - primary: Carbon background, Mineral text, Instrument Sans Medium.
// - secondary: transparent background, thin Carbon border, Carbon text.
//
// `Button` is a real <button> (an action on this page). `ButtonLink` is a
// real link styled the same way (it goes to another page). Both are at least
// 44px tall, so they meet the touch-target size, and both keep the global
// focus ring from globals.css. Neither has state or event handlers of its
// own, so neither is a client component.
//
// `className` is for placement only (margins, width), not for restyling.

export type ButtonVariant = "primary" | "secondary";

const base =
  "inline-flex min-h-11 items-center justify-center rounded-md border px-5 py-2 text-body font-medium";

// Every text and background pair used here is listed in text-pairings.ts.
const variants: Record<ButtonVariant, string> = {
  primary:
    "border-carbon bg-carbon text-mineral hover:border-neutral-darker hover:bg-neutral-darker",
  secondary:
    "border-carbon bg-transparent text-carbon hover:bg-carbon hover:text-mineral",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  className?: string,
): string {
  return [base, variants[variant], className].filter(Boolean).join(" ");
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant };

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, className)}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
};

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}
