import { describe, expect, it } from "vitest";
import { calculateCrCl, canFinalizeRecommendation, copilotProgress, serializePatientAssessmentDraft } from "./clinical";

describe("clinical helpers", () => {
  it("calculates Cockcroft-Gault CrCl with the female factor", () => {
    expect(calculateCrCl(67, 72, 1.2, "female")).toBe(52);
  });

  it("returns safe bounded copilot progress", () => {
    expect(copilotProgress(4, 10)).toBe(50);
    expect(copilotProgress(99, 10)).toBe(100);
  });

  it("does not allow an unverified recommendation", () => {
    expect(canFinalizeRecommendation(false, true)).toBe(false);
    expect(canFinalizeRecommendation(true, true)).toBe(true);
  });

  it("normalizes and serializes patient assessment fields", () => {
    expect(serializePatientAssessmentDraft({ id: " PT-7 ", initials: " a.k ", age: "67", ward: " ", complaint: "  CHF  ", allergies: " ", therapy: " furosemide  " })).toEqual({
      id: "PT-7",
      initials: "A.K",
      age: 67,
      ward: "Unassigned",
      complaint: "CHF",
      allergies: "NKDA",
      therapy: "furosemide",
    });
  });

  it("rejects high-risk finalization until the source is verified", () => {
    expect(canFinalizeRecommendation(false, true)).toBe(false);
    expect(canFinalizeRecommendation(true, true)).toBe(true);
  });
});
