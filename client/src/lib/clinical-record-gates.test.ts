import { describe, expect, it } from "vitest";
import { canSaveIntervention, hasPatientContext } from "./clinical-record-gates";

describe("clinical record save gates", () => {
  it("requires a non-empty patient context", () => {
    expect(hasPatientContext("PT-10482")).toBe(true);
    expect(hasPatientContext("  PT-10482  ")).toBe(true);
    expect(hasPatientContext("")).toBe(false);
    expect(hasPatientContext("   ")).toBe(false);
    expect(hasPatientContext(null)).toBe(false);
  });

  it("requires both patient context and evidence for interventions", () => {
    expect(canSaveIntervention("PT-10482", true)).toBe(true);
    expect(canSaveIntervention("PT-10482", false)).toBe(false);
    expect(canSaveIntervention("", true)).toBe(false);
    expect(canSaveIntervention(null, true)).toBe(false);
  });
});
