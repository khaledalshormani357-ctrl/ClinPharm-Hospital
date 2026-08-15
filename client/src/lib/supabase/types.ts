export type SyncState = "synced" | "pending" | "failed";

export type CloudPatient = {
  id: string;
  owner_id: string;
  initials: string;
  name: string;
  ward: string;
  issue: string;
  status: string;
  color: string;
  created_at: string;
  updated_at: string;
  sync_state?: SyncState;
};

export type PatientDraft = Omit<CloudPatient, "owner_id" | "created_at" | "updated_at"> & { sync_state?: SyncState };

export type SyncQueueItem = {
  id: string;
  operation: "create" | "update" | "delete";
  table: "clinical_patients" | "clinical_cases" | "clinical_interventions" | "medication_reviews";
  payload: Record<string, unknown>;
  attempts: number;
  createdAt: number;
  lastError?: string;
};
