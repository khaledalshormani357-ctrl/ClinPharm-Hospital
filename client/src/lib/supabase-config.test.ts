import { describe, expect, it } from "vitest";

describe("Supabase configuration", () => {
  it("has a valid public project configuration", async () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
    expect(url).toBe("https://iwtyddokiwcqwnmmlwlt.supabase.co");
    expect(anonKey).toMatch(/^sb_publishable_[A-Za-z0-9_-]+$/);
    const response = await fetch(`${url}/rest/v1/`, { headers: { apikey: anonKey ?? "" } });
    expect([200, 401, 404]).toContain(response.status);
  });
});
