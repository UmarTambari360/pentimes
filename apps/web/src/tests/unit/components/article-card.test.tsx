// apps/web/src/tests/unit/components/ArticleCard.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArticleCard } from "../../../components/ui/article-card.js";
import type { ArticleCardType } from "../../../types/index.js";

const mockArticle: ArticleCardType = {
  id: "art-1",
  title: "Breaking News From Katsina",
  slug: "breaking-news-katsina",
  excerpt: "An important development in Katsina State today.",
  coverImage: null,
  status: "published",
  views: 500,
  readingTime: 3,
  publishedAt: "2024-06-01T10:00:00.000Z",
  createdAt: "2024-06-01T10:00:00.000Z",
  author: { id: "auth-1", name: "Musa Dankaba", avatar: null },
  categories: [{ id: "cat-1", name: "Politics", slug: "politics" }],
  likeCount: 12,
  commentCount: 4,
  isLiked: false,
  isBookmarked: false,
};

describe("ArticleCard — vertical variant", () => {
  it("renders title", () => {
    render(<ArticleCard article={mockArticle} variant="vertical" />);
    expect(screen.getByText("Breaking News From Katsina")).toBeDefined();
  });

  it("renders category badge", () => {
    render(<ArticleCard article={mockArticle} variant="vertical" />);
    expect(screen.getByText("Politics")).toBeDefined();
  });

  it("renders author name", () => {
    render(<ArticleCard article={mockArticle} variant="vertical" />);
    expect(screen.getByText("Musa Dankaba")).toBeDefined();
  });

  it("renders like count", () => {
    render(<ArticleCard article={mockArticle} variant="vertical" />);
    expect(screen.getByText("12")).toBeDefined();
  });
});

describe("ArticleCard — compact variant", () => {
  it("renders title and date", () => {
    render(<ArticleCard article={mockArticle} variant="compact" />);
    expect(screen.getByText("Breaking News From Katsina")).toBeDefined();
  });
});

describe("ArticleCard — horizontal variant", () => {
  it("renders title", () => {
    render(<ArticleCard article={mockArticle} variant="horizontal" />);
    expect(screen.getByText("Breaking News From Katsina")).toBeDefined();
  });

  it("shows status badge when showStatus=true", () => {
    render(
      <ArticleCard article={mockArticle} variant="horizontal" showStatus />,
    );
    expect(screen.getByText(/published/i)).toBeDefined();
  });
});

describe("ArticleCard — featured variant", () => {
  it("renders title", () => {
    render(<ArticleCard article={mockArticle} variant="featured" />);
    expect(screen.getByText("Breaking News From Katsina")).toBeDefined();
  });
});
