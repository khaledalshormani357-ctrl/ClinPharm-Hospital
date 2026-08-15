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
