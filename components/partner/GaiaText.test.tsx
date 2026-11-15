// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { GaiaText } from "./GaiaText";

it("renders Gaia's light Markdown without showing the asterisks", () => {
  const { container } = render(<GaiaText text={"**Short answer:** no clear trend.\n\n- Sen slope +0.10\n  - nested\n- p = 0.71\n\n1. first"} />);
  expect(screen.getByText("Short answer:").tagName).toBe("STRONG");
  expect(container.textContent).not.toContain("**");
  expect(container.querySelectorAll("ul li")).toHaveLength(3);
  expect(container.querySelectorAll("ol li")).toHaveLength(1);
});
