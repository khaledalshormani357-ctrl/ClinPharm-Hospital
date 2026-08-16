import { describe, expect, it } from "vitest";
import { buildSoapNote, detectDrugRelatedProblems, evaluateTrainingAnswer, evidenceGate, advanceTrainingSession, calculateTrainingSummary, parseTrainingProgress, parseTrainingSummary, reconcileMedications, resetTrainingSession, serializeTrainingProgress, serializeTrainingSummary, updateTrainingProgress, renalDoseAdjustment, trainingQuestions } from "./clinical-engine";

describe("clinical engine", () => {
  it("detects interaction, renal risk, and high-alert monitoring", () => {
    const problems = detectDrugRelatedProblems([{ name: "warfarin", doseMg: 5, frequency: "daily", highAlert: true }, { name: "ibuprofen", doseMg: 400, frequency: "q8h" }, { name: "enoxaparin", doseMg: 40, frequency: "daily", renalThreshold: 60 }], { egfr: 35, allergies: [], diagnoses: [] });
    expect(problems.map((problem) => problem.code)).toEqual(expect.arrayContaining(["INTERACTION", "DOSE", "MONITORING"]));
  });

  it("flags allergy and omission risks in a patient context", () => {
    const problems = detectDrugRelatedProblems([{ name: "amoxicillin", doseMg: 500, frequency: "tid" }], { egfr: 90, allergies: ["amoxicillin"], diagnoses: ["diabetes"] });
    expect(problems.map((problem) => problem.code)).toEqual(expect.arrayContaining(["CONTRAINDICATION", "OMISSION"]));
  });

  it("flags a high-alert interaction and renal dose risk", () => {
    const problems = detectDrugRelatedProblems([{ name: "warfarin", doseMg: 5, frequency: "daily", highAlert: true }, { name: "ibuprofen", doseMg: 400, frequency: "q8h" }, { name: "enoxaparin", doseMg: 40, frequency: "daily", renalThreshold: 60 }], { egfr: 35, allergies: [], diagnoses: [] });
    expect(problems.some((problem) => problem.code === "INTERACTION")).toBe(true);
    expect(problems.some((problem) => problem.code === "MONITORING")).toBe(true);
    expect(problems.some((problem) => problem.code === "DOSE")).toBe(true);
  });

  it("requires a real source and an evidence level", () => {
    expect(evidenceGate("https://www.fda.gov/drugs", "Regulatory source")).toBe(true);
    expect(evidenceGate("https://example.org/guideline", "Guideline")).toBe(false);
    expect(evidenceGate("https://www.fda.gov/drugs", undefined)).toBe(false);
    expect(evidenceGate(undefined, "Guideline")).toBe(false);
  });

  it("reduces dose for severe renal impairment", () => {
    expect(renalDoseAdjustment(100, 25).doseMg).toBe(50);
  });

  it("generates a traceable SOAP note and handles absent evidence", () => {
    expect(buildSoapNote({ subjective: "No dyspnea", objective: "SCr 1.2", assessment: "Stable", plan: "Monitor" })).toContain("Insufficient evidence");
  });

  it("evaluates training answers with immediate rationale", () => {
    expect(evaluateTrainingAnswer(trainingQuestions[0], 1).correct).toBe(true);
    expect(evaluateTrainingAnswer(trainingQuestions[0], 0).rationale).toContain("Review needed");
  });

  it("tracks and serializes training completion without duplicate scoring", () => {
    const first = updateTrainingProgress({ completed: [], correct: 0 }, 0, true);
    const duplicate = updateTrainingProgress(first, 0, false);
    expect(first).toEqual({ completed: [0], correct: 1 });
    expect(duplicate).toEqual(first);
    expect(parseTrainingProgress(serializeTrainingProgress(first))).toEqual(first);
    expect(parseTrainingProgress("invalid-json")).toEqual({ completed: [], correct: 0 });
  });

  it("advances, completes, and resets a timed training session", () => {
    const started = { remainingSeconds: 2, running: true, completed: false };
    expect(advanceTrainingSession(started, 1)).toEqual({ remainingSeconds: 1, running: true, completed: false });
    expect(advanceTrainingSession(started, 2)).toEqual({ remainingSeconds: 0, running: false, completed: true });
    expect(resetTrainingSession(90)).toEqual({ remainingSeconds: 90, running: false, completed: false });
  });

  it("calculates and persists a training performance summary", () => {
    const summary = calculateTrainingSummary({ completed: [0, 1], correct: 1 }, 42, 4);
    expect(summary).toEqual({ completedQuestions: 2, correctAnswers: 1, accuracyPercent: 50, durationSeconds: 42, totalQuestions: 4 });
    expect(parseTrainingSummary(serializeTrainingSummary(summary))).toEqual(summary);
    expect(parseTrainingSummary("bad-summary")).toBeNull();
  });

  it("separates continued, omitted, and new medication therapy", () => {
    const result = reconcileMedications([{ name: "metformin", doseMg: 500, frequency: "bid" }, { name: "lisinopril", doseMg: 10, frequency: "daily" }], [{ name: "lisinopril", doseMg: 10, frequency: "daily" }, { name: "atorvastatin", doseMg: 20, frequency: "nightly" }]);
    expect(result.continued).toHaveLength(1);
    expect(result.omitted).toHaveLength(1);
    expect(result.newTherapy).toHaveLength(1);
  });
});
