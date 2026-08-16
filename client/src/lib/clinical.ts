export function calculateCrCl(age: number, weightKg: number, serumCreatinine: number, sex: "female" | "male" = "female") {
  if (age <= 0 || weightKg <= 0 || serumCreatinine <= 0) return null;
  const base = ((140 - age) * weightKg) / (72 * serumCreatinine);
  return Math.round(sex === "female" ? base * 0.85 : base);
}

export function copilotProgress(completedStep: number, totalSteps: number) {
  if (totalSteps <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round(((completedStep + 1) / totalSteps) * 100)));
}

export function canFinalizeRecommendation(hasVerifiedSource: boolean, isHighRisk: boolean) {
  return hasVerifiedSource && (!isHighRisk || hasVerifiedSource);
}

export type PatientAssessmentDraft = {
  id: string;
  initials: string;
  age: string;
  ward: string;
  complaint: string;
  allergies: string;
  therapy: string;
};

export function serializePatientAssessmentDraft(draft: PatientAssessmentDraft) {
  return {
    id: draft.id.trim(),
    initials: draft.initials.trim().toUpperCase(),
    age: draft.age.trim() ? Number(draft.age) : null,
    ward: draft.ward.trim() || "Unassigned",
    complaint: draft.complaint.trim(),
    allergies: draft.allergies.trim() || "NKDA",
    therapy: draft.therapy.trim(),
  };
}
