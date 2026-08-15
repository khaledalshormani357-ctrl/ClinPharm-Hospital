import { describe, expect, it } from "vitest";

describe("Supabase configuration", () => {
  it("has a valid public project configuration", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    expect(url).toMatch(/^https:\/\//);
    expect(anonKey).toBeTruthy();
    const response = await fetch(`${url}/rest/v1/`, { headers: { apikey: anonKey ?? "" } });
    expect([200, 401, 404]).toContain(response.status);
  });
});
