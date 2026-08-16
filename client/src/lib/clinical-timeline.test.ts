import { describe, expect, it } from "vitest";
import { appendTimelineEvent, createTimelineEvent, documentationTemplates, filterTimelineEvents, parseDocumentationEntry, parseTimelineEvents, serializeDocumentationEntry, serializeTimelineEvents } from "./clinical-timeline";

describe("clinical timeline", () => {
  it("orders events newest first and filters by patient and type", () => {
    const first = createTimelineEvent({ patientId: "PT-1", type: "assessment", title: "Assessment", detail: "Initial review", actor: "Pharmacist" }, 100);
    const second = createTimelineEvent({ patientId: "PT-1", type: "soap", title: "SOAP", detail: "Follow-up", actor: "Pharmacist" }, 200);
    const third = createTimelineEvent({ patientId: "PT-2", type: "alert", title: "Alert", detail: "High risk", actor: "System" }, 300);
    const events = appendTimelineEvent(appendTimelineEvent([first], second), third);
    expect(events[0]).toEqual(third);
    expect(filterTimelineEvents(events, "PT-1", "soap")).toEqual([second]);
    expect(filterTimelineEvents(events, "PT-2")).toEqual([third]);
  });

  it("serializes valid events and exposes documentation templates", () => {
    const event = createTimelineEvent({ patientId: "PT-1", type: "intervention", title: "Intervention", detail: "Monitor", actor: "Pharmacist" }, 100);
    expect(parseTimelineEvents(serializeTimelineEvents([event]))).toEqual([event]);
    expect(documentationTemplates.map((template) => template.type)).toEqual(["SOAP", "Medication review", "Intervention"]);
    expect(documentationTemplates.find((template) => template.type === "SOAP")?.fields.map((field) => [field.label, field.placeholder])).toEqual([["Subjective", "Patient report and symptoms"], ["Objective", "Vitals, labs, and medication data"], ["Assessment", "Clinical assessment"], ["Plan", "Monitoring and follow-up"]]);
    expect(documentationTemplates.find((template) => template.type === "Medication review")?.fields.map((field) => field.label)).toEqual(["Indication", "Effectiveness", "Safety"]);
    expect(documentationTemplates.find((template) => template.type === "Intervention")?.fields.map((field) => field.label)).toEqual(["Problem", "Recommendation", "Follow-up"]);
    const entry = { templateType: "SOAP" as const, fields: { Subjective: "Stable", Plan: "Repeat labs" } };
    expect(parseDocumentationEntry(serializeDocumentationEntry(entry))).toEqual(entry);
    expect(parseTimelineEvents("invalid")).toEqual([]);
  });
});
