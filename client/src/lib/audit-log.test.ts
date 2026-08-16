import { describe, expect, it } from "vitest";
import { appendAuditEvent, auditEventsToCsv, createAuditEvent, readAuditEvents, writeAuditEvents } from "./audit-log";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  } as unknown as Storage;
}

describe("audit log", () => {
  it("creates and persists a bounded audit event", () => {
    const storage = memoryStorage();
    const event = createAuditEvent({ actor: "Tester", action: "Reviewed", entity: "Medication", detail: "Dose checked" }, 1000);
    const events = appendAuditEvent([], event);
    writeAuditEvents(events, storage);
    expect(readAuditEvents(storage)).toEqual([event]);
  });

  it("exports escaped audit values as CSV", () => {
    const csv = auditEventsToCsv([{ id: "1", actor: "A, B", action: "Reviewed", entity: "Medication", detail: "Dose\nchecked", timestamp: 1000 }]);
    expect(csv).toContain('"A, B"');
    expect(csv).toContain('"Dose\nchecked"');
  });

  it("keeps newest events first and limits the log", () => {
    const events = Array.from({ length: 3 }, (_, index) => createAuditEvent({ actor: "Tester", action: "Action", entity: "Case", detail: String(index) }, index));
    expect(appendAuditEvent(events.slice(0, 2), events[2], 2)).toHaveLength(2);
    expect(appendAuditEvent(events.slice(0, 2), events[2], 2)[0]).toEqual(events[2]);
  });
});
