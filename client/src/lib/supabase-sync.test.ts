import { describe, expect, it } from "vitest";
import { resolveConflict } from "./supabase/syncQueue";

describe("Supabase sync conflict policy", () => {
  it("keeps the most recently updated record", () => {
    const local = { id: "p1", updated_at: "2026-08-16T12:00:00.000Z", value: "local" };
    const remote = { id: "p1", updated_at: "2026-08-16T11:00:00.000Z", value: "remote" };
    expect(resolveConflict(local, remote)).toEqual(local);
  });
});
