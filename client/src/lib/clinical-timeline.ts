export type TimelineEventType = "assessment" | "medication-review" | "intervention" | "soap" | "alert";

export type ClinicalTimelineEvent = {
  id: string;
  patientId: string;
  type: TimelineEventType;
  title: string;
  detail: string;
  actor: string;
  timestamp: number;
};

export type DocumentationTemplate = {
  type: "SOAP" | "Medication review" | "Intervention";
  title: string;
  fields: { label: string; placeholder: string }[];
};

export type DocumentationEntry = { templateType: DocumentationTemplate["type"]; fields: Record<string, string> };

export function serializeDocumentationEntry(entry: DocumentationEntry) {
  return JSON.stringify(entry);
}

export function parseDocumentationEntry(raw: string): DocumentationEntry | null {
  try {
    const parsed = JSON.parse(raw) as DocumentationEntry;
    if (!parsed || typeof parsed.templateType !== "string" || !parsed.fields || typeof parsed.fields !== "object") return null;
    return { templateType: parsed.templateType, fields: Object.fromEntries(Object.entries(parsed.fields).map(([key, value]) => [key, String(value ?? "")])) } as DocumentationEntry;
  } catch {
    return null;
  }
}

const TIMELINE_KEY = "clinpharm-clinical-timeline";

export const documentationTemplates: DocumentationTemplate[] = [
  { type: "SOAP", title: "SOAP follow-up", fields: [{ label: "Subjective", placeholder: "Patient report and symptoms" }, { label: "Objective", placeholder: "Vitals, labs, and medication data" }, { label: "Assessment", placeholder: "Clinical assessment" }, { label: "Plan", placeholder: "Monitoring and follow-up" }] },
  { type: "Medication review", title: "Medication review", fields: [{ label: "Indication", placeholder: "Indication and therapeutic goal" }, { label: "Effectiveness", placeholder: "Response and target" }, { label: "Safety", placeholder: "Risks and monitoring" }] },
  { type: "Intervention", title: "Clinical intervention", fields: [{ label: "Problem", placeholder: "Drug-related problem" }, { label: "Recommendation", placeholder: "Evidence-linked recommendation" }, { label: "Follow-up", placeholder: "Monitoring and owner" }] },
];

export function appendTimelineEvent(events: ClinicalTimelineEvent[], event: ClinicalTimelineEvent, limit = 250) {
  return [event, ...events].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

export function filterTimelineEvents(events: ClinicalTimelineEvent[], patientId: string, type?: TimelineEventType) {
  return events.filter((event) => (!patientId || event.patientId === patientId) && (!type || event.type === type)).sort((a, b) => b.timestamp - a.timestamp);
}

export function serializeTimelineEvents(events: ClinicalTimelineEvent[]) {
  return JSON.stringify(events.slice(0, 250));
}

export function parseTimelineEvents(raw: string | null): ClinicalTimelineEvent[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ClinicalTimelineEvent[];
    return Array.isArray(parsed) ? parsed.filter((event) => event && typeof event.id === "string" && typeof event.patientId === "string" && typeof event.timestamp === "number") : [];
  } catch {
    return [];
  }
}

export function readTimelineEvents(storage: Storage | undefined = typeof localStorage === "undefined" ? undefined : localStorage) {
  return parseTimelineEvents(storage?.getItem(TIMELINE_KEY) ?? null);
}

export function writeTimelineEvents(events: ClinicalTimelineEvent[], storage: Storage | undefined = typeof localStorage === "undefined" ? undefined : localStorage) {
  storage?.setItem(TIMELINE_KEY, serializeTimelineEvents(events));
}

export function createTimelineEvent(input: Omit<ClinicalTimelineEvent, "id" | "timestamp">, now = Date.now()): ClinicalTimelineEvent {
  return { ...input, id: `timeline-${now}-${Math.random().toString(36).slice(2, 8)}`, timestamp: now };
}
