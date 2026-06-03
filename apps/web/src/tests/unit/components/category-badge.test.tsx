// apps/web/src/tests/unit/components/CategoryBadge.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryBadge } from "../../../components/ui/category-badge.js";

describe("CategoryBadge", () => {
  it("renders category name", () => {
    render(<CategoryBadge name="Politics" slug="politics" />);
    expect(screen.getByText("Politics")).toBeDefined();
  });

  it("renders as a link when interactive", () => {
    render(<CategoryBadge name="Education" slug="education" interactive />);
    const link = screen.getByRole("link");
    expect(link).toBeDefined();
    expect((link as HTMLAnchorElement).href).toContain("/category/education");
  });

  it("renders as a span when not interactive", () => {
    render(<CategoryBadge name="Health" slug="health" interactive={false} />);
    const span = screen.getByText("Health");
    expect(span.tagName.toLowerCase()).toBe("span");
  });
});
