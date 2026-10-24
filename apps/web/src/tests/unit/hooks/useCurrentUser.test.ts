// apps/web/src/tests/unit/hooks/useCurrentUser.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCurrentUser } from "../../../hooks/useCurrentUser.js";

const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn().mockResolvedValue({
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
}));

// Keep the real `gql` export (query modules need it); replace only the client.
// A class is used because `getAuthClient()` calls `new GraphQLClient(...)`.
vi.mock("graphql-request", async (importOriginal) => ({
  ...(await importOriginal<typeof import("graphql-request")>()),
  GraphQLClient: class {
    request = mockRequest;
  },
}));

// The session marker cookie that `hasSession()` looks for
Object.defineProperty(document, "cookie", {
  writable: true,
  value: "session_active=1",
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
