export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId?: string;
  detail: string;
  evidence?: string;
  timestamp: number;
};

const AUDIT_KEY = "clinpharm-audit-log";

export function createAuditEvent(input: Omit<AuditEvent, "id" | "timestamp">, now = Date.now()): AuditEvent {
  return { ...input, id: `audit-${now}-${Math.random().toString(36).slice(2, 8)}`, timestamp: now };
}

export function appendAuditEvent(events: AuditEvent[], event: AuditEvent, limit = 100) {
  return [event, ...events].slice(0, limit);
}

export function readAuditEvents(storage: Storage | undefined = typeof localStorage === "undefined" ? undefined : localStorage): AuditEvent[] {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(AUDIT_KEY) || "[]") as AuditEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeAuditEvents(events: AuditEvent[], storage: Storage | undefined = typeof localStorage === "undefined" ? undefined : localStorage) {
  storage?.setItem(AUDIT_KEY, JSON.stringify(events.slice(0, 100)));
}

export function formatAuditTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}
