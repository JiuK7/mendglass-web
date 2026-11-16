import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import HomePage from "./page";

test("the homepage renders exactly one level-one heading", () => {
  render(<HomePage />);

  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
});
