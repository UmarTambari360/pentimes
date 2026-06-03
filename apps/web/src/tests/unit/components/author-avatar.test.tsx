// apps/web/src/tests/unit/components/AuthorAvatar.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthorAvatar } from "../../../components/ui/author-avatar.js";

const author = { id: "user-1", name: "Aisha Bello", avatar: null };

describe("AuthorAvatar", () => {
  it("renders initials when no avatar", () => {
    render(<AuthorAvatar author={author} />);
    expect(screen.getByText("AB")).toBeDefined();
  });

  it("renders name when showName is true", () => {
    render(<AuthorAvatar author={author} showName />);
    expect(screen.getByText("Aisha Bello")).toBeDefined();
  });

  it("does not render name when showName is false", () => {
    render(<AuthorAvatar author={author} showName={false} />);
    expect(screen.queryByText("Aisha Bello")).toBeNull();
  });

  it("renders different sizes without crashing", () => {
    const { rerender } = render(<AuthorAvatar author={author} size="xs" />);
    rerender(<AuthorAvatar author={author} size="sm" />);
    rerender(<AuthorAvatar author={author} size="md" />);
    rerender(<AuthorAvatar author={author} size="lg" />);
    expect(screen.getByText("AB")).toBeDefined();
  });
});
