import { describe, expect, it } from "vitest";

const projectUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

describe("configured Supabase project", () => {
  it("has the requested project URL and a publishable client key", () => {
    expect(projectUrl).toBe("https://iwtyddokiwcqwnmmlwlt.supabase.co");
    expect(publishableKey).toMatch(/^sb_publishable_[A-Za-z0-9_-]+$/);
    expect(publishableKey).not.toContain("service_role");
  });

  it("reaches the Auth settings endpoint with the publishable key", async () => {
    if (!projectUrl || !publishableKey) throw new Error("Supabase public environment is not configured");
    const response = await fetch(`${projectUrl}/auth/v1/settings`, {
      headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}` },
    });
    expect(response.ok).toBe(true);
  }, 15000);
});
