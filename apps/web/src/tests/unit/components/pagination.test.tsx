// apps/web/src/tests/unit/components/Pagination.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Pagination } from "../../../components/public/pagination.js";

// Wrap in Suspense as useSearchParams requires it in test environment
import { Suspense } from "react";

function renderPagination(props: {
  total: number;
  limit: number;
  offset: number;
}) {
  return render(
    <Suspense fallback={null}>
      <Pagination {...props} />
    </Suspense>,
  );
}

describe("Pagination", () => {
  it("renders nothing when total <= limit", () => {
    const { container } = renderPagination({ total: 10, limit: 12, offset: 0 });
    expect(container.firstChild).toBeNull();
  });

  it("renders navigation when total > limit", () => {
    renderPagination({ total: 30, limit: 12, offset: 0 });
    expect(screen.getByLabelText("Pagination")).toBeDefined();
  });

  it("renders previous button disabled on first page", () => {
    renderPagination({ total: 30, limit: 12, offset: 0 });
    const prevBtn = screen.getByLabelText("Previous page");
    expect((prevBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders next button disabled on last page", () => {
    renderPagination({ total: 24, limit: 12, offset: 12 });
    const nextBtn = screen.getByLabelText("Next page");
    expect((nextBtn as HTMLButtonElement).disabled).toBe(true);
  });
});
