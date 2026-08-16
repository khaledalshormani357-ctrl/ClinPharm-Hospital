export function hasPatientContext(patientId: string | undefined | null) {
  return Boolean(patientId?.trim());
}

export function canSaveIntervention(patientId: string | undefined | null, evidenceReady: boolean) {
  return hasPatientContext(patientId) && evidenceReady;
}
