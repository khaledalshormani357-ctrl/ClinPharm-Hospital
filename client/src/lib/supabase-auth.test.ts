import { describe, expect, it, vi } from "vitest";

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "restored-user", email: "pharmacist@example.com" } } } }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));
vi.mock("./supabase/client", () => ({ supabase: mockSupabase }));

import { authService, hasRestoredSession, resetPasswordRedirect } from "./supabase/auth";

describe("Supabase auth flow helpers", () => {
  it("recognizes a restored session only when a user id exists", () => {
    expect(hasRestoredSession({ user: { id: "user-1" } })).toBe(true);
    expect(hasRestoredSession(null)).toBe(false);
    expect(hasRestoredSession({ user: {} })).toBe(false);
  });

  it("builds a deterministic reset-password redirect", () => {
    expect(resetPasswordRedirect("https://clinpharm.example")).toBe("https://clinpharm.example/reset-password");
  });

  it("calls the real Auth session and reset-password methods", async () => {
    const sessionResult = await authService.getSession();
    expect(sessionResult?.data.session?.user.id).toBe("restored-user");
    await authService.resetPassword("pharmacist@example.com");
    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("pharmacist@example.com", { redirectTo: "http://localhost:3000/reset-password" });
  });
});
