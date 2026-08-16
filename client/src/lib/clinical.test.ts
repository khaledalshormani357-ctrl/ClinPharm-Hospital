import { describe, expect, it } from "vitest";
import { calculateCrCl, canFinalizeRecommendation, copilotProgress } from "./clinical";

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
});
