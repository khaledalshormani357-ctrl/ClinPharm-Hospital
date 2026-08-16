export type Medication = { name: string; doseMg: number; frequency: string; indication?: string; highAlert?: boolean; renalThreshold?: number };
export type PatientSnapshot = { egfr: number; allergies: string[]; diagnoses: string[] };

export type DrugRelatedProblem = {
  code: "INTERACTION" | "CONTRAINDICATION" | "DOSE" | "DUPLICATION" | "OMISSION" | "MONITORING";
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
};

export function detectDrugRelatedProblems(medications: Medication[], patient: PatientSnapshot): DrugRelatedProblem[] {
  const problems: DrugRelatedProblem[] = [];
  const names = medications.map((med) => med.name.toLowerCase());
  if (names.includes("warfarin") && names.includes("ibuprofen")) problems.push({ code: "INTERACTION", severity: "high", title: "Bleeding-risk interaction", detail: "Warfarin and ibuprofen require urgent clinical review and source verification." });
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  duplicates.forEach((name) => problems.push({ code: "DUPLICATION", severity: "medium", title: "Therapeutic duplication", detail: `Duplicate therapy detected for ${name}.` }));
  medications.filter((med) => med.renalThreshold !== undefined && patient.egfr < (med.renalThreshold ?? 0)).forEach((med) => problems.push({ code: "DOSE", severity: "high", title: "Renal dose review", detail: `${med.name} requires dose or interval reassessment at the current kidney function.` }));
  medications.filter((med) => med.highAlert).forEach((med) => problems.push({ code: "MONITORING", severity: "high", title: "High-alert medication", detail: `${med.name} requires independent verification and explicit monitoring parameters.` }));
  if (patient.allergies.some((allergy) => names.includes(allergy.toLowerCase()))) problems.push({ code: "CONTRAINDICATION", severity: "high", title: "Allergy conflict", detail: "A listed medication matches a documented allergy and must be reconciled." });
  patient.diagnoses.filter((diagnosis) => diagnosis.toLowerCase().includes("diabetes") && !names.some((name) => name.includes("insulin") || name.includes("metformin"))).forEach(() => problems.push({ code: "OMISSION", severity: "medium", title: "Untreated indication", detail: "The assessment contains diabetes without an obvious glucose-lowering therapy; verify intent and contraindications." }));
  return problems;
}

export function renalDoseAdjustment(doseMg: number, egfr: number) {
  if (egfr < 30) return { doseMg: Math.round(doseMg * 0.5), interval: "extend interval; verify reference", rationale: "Severe renal impairment" };
  if (egfr < 60) return { doseMg: Math.round(doseMg * 0.75), interval: "consider extended interval", rationale: "Moderate renal impairment" };
  return { doseMg, interval: "standard interval", rationale: "No renal reduction suggested by this rule" };
}

export function hepaticDoseAdjustment(doseMg: number, childPugh: "A" | "B" | "C") {
  if (childPugh === "C") return { doseMg: Math.round(doseMg * 0.5), rationale: "Severe hepatic impairment; verify product label and specialist reference" };
  if (childPugh === "B") return { doseMg: Math.round(doseMg * 0.75), rationale: "Moderate hepatic impairment; verify product label" };
  return { doseMg, rationale: "Mild or no hepatic adjustment suggested by this rule" };
}

export function evidenceGate(sourceUrl: string | undefined, evidenceLevel: string | undefined) {
  return Boolean(sourceUrl?.trim() && evidenceLevel?.trim());
}

export function buildSoapNote(input: { subjective: string; objective: string; assessment: string; plan: string; source?: string }) {
  return [`S: ${input.subjective}`, `O: ${input.objective}`, `A: ${input.assessment}`, `P: ${input.plan}`, input.source ? `Evidence: ${input.source}` : "Evidence: Insufficient evidence / source not available."].join("\n\n");
}

export function reconcileMedications(home: Medication[], inpatient: Medication[]) {
  const homeNames = new Set(home.map((med) => med.name.toLowerCase()));
  const inpatientNames = new Set(inpatient.map((med) => med.name.toLowerCase()));
  return { continued: inpatient.filter((med) => homeNames.has(med.name.toLowerCase())), omitted: home.filter((med) => !inpatientNames.has(med.name.toLowerCase())), newTherapy: inpatient.filter((med) => !homeNames.has(med.name.toLowerCase())) };
}

export function recordCalculation(history: Array<{ type: string; value: string; timestamp: number }>, type: string, value: string) {
  return [{ type, value, timestamp: Date.now() }, ...history].slice(0, 20);
}

export type TrainingQuestion = { prompt: string; options: string[]; correctIndex: number; rationale: string };
export type TrainingProgress = { completed: number[]; correct: number };

export function updateTrainingProgress(progress: TrainingProgress, questionIndex: number, correct: boolean): TrainingProgress {
  if (progress.completed.includes(questionIndex)) return progress;
  return { completed: [...progress.completed, questionIndex], correct: progress.correct + (correct ? 1 : 0) };
}

export function serializeTrainingProgress(progress: TrainingProgress) {
  return JSON.stringify(progress);
}

export function parseTrainingProgress(raw: string | null): TrainingProgress {
  if (!raw) return { completed: [], correct: 0 };
  try {
    const parsed = JSON.parse(raw) as TrainingProgress;
    if (!Array.isArray(parsed.completed) || typeof parsed.correct !== "number") return { completed: [], correct: 0 };
    return { completed: parsed.completed.filter((value) => Number.isInteger(value)), correct: Math.max(0, parsed.correct) };
  } catch {
    return { completed: [], correct: 0 };
  }
}

export type TrainingSession = { remainingSeconds: number; running: boolean; completed: boolean };

export function advanceTrainingSession(session: TrainingSession, seconds = 1): TrainingSession {
  if (!session.running || session.completed) return session;
  const remainingSeconds = Math.max(0, session.remainingSeconds - seconds);
  return { remainingSeconds, running: remainingSeconds > 0, completed: remainingSeconds === 0 };
}

export type TrainingPerformanceSummary = { completedQuestions: number; correctAnswers: number; accuracyPercent: number; durationSeconds: number; totalQuestions: number };

export function calculateTrainingSummary(progress: TrainingProgress, durationSeconds: number, totalQuestions: number): TrainingPerformanceSummary {
  const completedQuestions = Math.min(totalQuestions, progress.completed.length);
  return { completedQuestions, correctAnswers: Math.min(completedQuestions, progress.correct), accuracyPercent: completedQuestions ? Math.round((progress.correct / completedQuestions) * 100) : 0, durationSeconds: Math.max(0, durationSeconds), totalQuestions };
}

export function serializeTrainingSummary(summary: TrainingPerformanceSummary) {
  return JSON.stringify(summary);
}

export function parseTrainingSummary(raw: string | null): TrainingPerformanceSummary | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as TrainingPerformanceSummary;
    if (typeof parsed.completedQuestions !== "number" || typeof parsed.correctAnswers !== "number" || typeof parsed.accuracyPercent !== "number" || typeof parsed.durationSeconds !== "number" || typeof parsed.totalQuestions !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function resetTrainingSession(durationSeconds = 300): TrainingSession {
  return { remainingSeconds: durationSeconds, running: false, completed: false };
}

export function evaluateTrainingAnswer(question: TrainingQuestion, selectedIndex: number) {
  const correct = selectedIndex === question.correctIndex;
  return { correct, rationale: correct ? `Correct. ${question.rationale}` : `Review needed. ${question.rationale}` };
}

export const trainingQuestions: TrainingQuestion[] = [
  { prompt: "Which action is required before finalizing a high-risk recommendation?", options: ["Skip source review", "Verify the original source", "Delete the case", "Ignore monitoring"], correctIndex: 1, rationale: "High-risk recommendations require explicit original-source verification and monitoring." },
  { prompt: "What should be checked when eGFR is below a medication's renal threshold?", options: ["Dose or interval", "Patient initials only", "Training score", "Ward color"], correctIndex: 0, rationale: "Renal function may require dose or interval reassessment." },
];

export const trainingTracks = [
  { title: "Heart failure pharmacotherapy", progress: 76, cases: 8, questions: 24 },
  { title: "Antimicrobial stewardship", progress: 54, cases: 5, questions: 16 },
  { title: "Critical care and TDM", progress: 32, cases: 3, questions: 12 },
];
