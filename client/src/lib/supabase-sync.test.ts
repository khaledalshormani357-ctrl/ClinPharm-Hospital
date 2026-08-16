import { beforeEach, describe, expect, it } from "vitest";
import { resolveConflict, syncQueue } from "./supabase/syncQueue";

const storage = new Map<string, string>();

globalThis.localStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value); },
  removeItem: (key: string) => { storage.delete(key); },
  clear: () => { storage.clear(); },
  key: (index: number) => Array.from(storage.keys())[index] ?? null,
  get length() { return storage.size; },
} as Storage;

describe("Supabase sync conflict policy", () => {
  beforeEach(() => syncQueue.clear());
  it("keeps the most recently updated record", () => {
    const local = { id: "p1", updated_at: "2026-08-16T12:00:00.000Z", value: "local" };
    const remote = { id: "p1", updated_at: "2026-08-16T11:00:00.000Z", value: "remote" };
    expect(resolveConflict(local, remote)).toEqual(local);
  });

  it("persists a patient-linked clinical record, retries failure, then flushes it", async () => {
    syncQueue.enqueue({ id: "intervention-p1", operation: "create", table: "clinical_interventions", payload: { patient_id: "PT-10482", status: "draft" } });
    syncQueue.enqueue({ id: "intervention-p1", operation: "create", table: "clinical_interventions", payload: { patient_id: "PT-10482", status: "draft" } });
    syncQueue.enqueue({ id: "intervention-update-p1", operation: "update", table: "clinical_interventions", payload: { id: "i1", patient_id: "PT-10482", status: "review" } });
    expect(syncQueue.list()).toHaveLength(2);
    syncQueue.fail("intervention-p1", "offline");
    expect(syncQueue.list()[0]?.lastError).toBe("offline");
    const flushed = await syncQueue.flush(async (item) => {
      expect(["create", "update"]).toContain(item.operation);
      expect(item.payload).toMatchObject({ patient_id: "PT-10482" });
    });
    expect(flushed).toEqual([]);
  });
});
