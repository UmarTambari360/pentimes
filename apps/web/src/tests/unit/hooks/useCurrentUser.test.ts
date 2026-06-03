// apps/web/src/tests/unit/hooks/useCurrentUser.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCurrentUser } from "../../../hooks/useCurrentUser.js";

// Mock graphql-request
vi.mock("graphql-request", () => ({
  GraphQLClient: vi.fn().mockImplementation(() => ({
    request: vi.fn().mockResolvedValue({
      me: {
        id: "user-1",
        name: "Test User",
        email: "test@test.com",
        role: "author",
        avatar: null,
        bio: null,
        createdAt: "2024-01-01",
      },
    }),
  })),
}));

// Mock document.cookie
Object.defineProperty(document, "cookie", {
  writable: true,
  value: "access_token=mock-token-value",
});

describe("useCurrentUser", () => {
  it("fetches and returns user when token exists", async () => {
    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.email).toBe("test@test.com");
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAuthor).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });
});
