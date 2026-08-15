import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { patientRepository } from "@/lib/supabase/patientRepository";
import { clinicalRepository } from "@/lib/supabase/clinicalRepository";
import { resolveConflict, syncQueue } from "@/lib/supabase/syncQueue";
import type { CloudPatient, PatientDraft, SyncState, SyncQueueItem } from "@/lib/supabase/types";

const CACHE_KEY = "clinpharm-cloud-patients";

function readCache(): CloudPatient[] {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]") as CloudPatient[]; } catch { return []; }
}
function writeCache(items: CloudPatient[]) { localStorage.setItem(CACHE_KEY, JSON.stringify(items)); }

export function useCloudPatients() {
  const [patients, setPatients] = useState<CloudPatient[]>(readCache);
  const [syncState, setSyncState] = useState<SyncState>("pending");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data: sessionData } = await supabase?.auth.getSession() ?? { data: { session: null } };
    const ownerId = sessionData.session?.user.id;
    if (!ownerId || !supabase) { setSyncState("pending"); return; }
    try {
      await syncQueue.flush(async (item: SyncQueueItem) => {
        if (item.table === "clinical_patients") {
          if (item.operation === "create") await patientRepository.create(item.payload as PatientDraft, ownerId);
          if (item.operation === "update") await patientRepository.update(String(item.payload.id), ownerId, item.payload as Partial<PatientDraft>);
          if (item.operation === "delete") await patientRepository.remove(String(item.payload.id), ownerId);
        }
        if (item.table === "clinical_cases") {
          if (item.operation === "create") await clinicalRepository.cases.create(ownerId, item.payload as never);
          if (item.operation === "update") await clinicalRepository.cases.update(ownerId, String(item.payload.id), item.payload);
          if (item.operation === "delete") await clinicalRepository.cases.remove(ownerId, String(item.payload.id));
        }
        if (item.table === "clinical_interventions") {
          if (item.operation === "create") await clinicalRepository.interventions.create(ownerId, item.payload as never);
          if (item.operation === "update") await clinicalRepository.interventions.update(ownerId, String(item.payload.id), item.payload);
          if (item.operation === "delete") await clinicalRepository.interventions.remove(ownerId, String(item.payload.id));
        }
        if (item.table === "medication_reviews") {
          if (item.operation === "create" || item.operation === "update") await clinicalRepository.medicationReviews.upsert(ownerId, item.payload as never);
          if (item.operation === "delete") await clinicalRepository.medicationReviews.remove(ownerId, String(item.payload.id));
        }
      });
      let cloudPatients = await patientRepository.list(ownerId);
      const migrationKey = `clinpharm-migration-v1-${ownerId}`;
      if (cloudPatients.length === 0 && !localStorage.getItem(migrationKey)) {
        let legacyPatients: PatientDraft[] = [];
        try { legacyPatients = JSON.parse(localStorage.getItem("clinpharm-patient-drafts") || "[]") as PatientDraft[]; } catch { legacyPatients = []; }
        for (const legacy of legacyPatients) {
          try { await patientRepository.create(legacy, ownerId); } catch { /* duplicate or invalid legacy record; keep local cache */ }
        }
        cloudPatients = await patientRepository.list(ownerId);
        localStorage.setItem(migrationKey, new Date().toISOString());
      }
      const cachedById = new Map(readCache().map((item) => [item.id, item]));
      const mergedPatients = cloudPatients.map((remote) => {
        const local = cachedById.get(remote.id);
        const winner = local ? resolveConflict(local, remote) : remote;
        if (local && winner === local && local.updated_at !== remote.updated_at) syncQueue.enqueue({ id: `patient-conflict-${local.id}`, operation: "update", table: "clinical_patients", payload: local });
        return winner;
      });
      setPatients(mergedPatients);
      writeCache(mergedPatients);
      setSyncState("synced");
      setError(null);
    } catch (err) {
      setSyncState("failed");
      setError(err instanceof Error ? err.message : "Cloud sync failed");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange(() => { void refresh(); });
    return () => data.subscription.unsubscribe();
  }, [refresh]);
  useEffect(() => {
    const onOnline = () => { void refresh(); };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [refresh]);

  const createPatient = useCallback(async (draft: PatientDraft) => {
    const session = await supabase?.auth.getSession();
    const ownerId = session?.data.session?.user.id;
    const localPatient: CloudPatient = { ...draft, owner_id: ownerId || "local", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), sync_state: "pending" };
    const next = [localPatient, ...patients];
    setPatients(next); writeCache(next);
    if (!ownerId || !supabase || !navigator.onLine) {
      syncQueue.enqueue({ id: localPatient.id, operation: "create", table: "clinical_patients", payload: localPatient });
      setSyncState("pending");
      return localPatient;
    }
    try {
      const saved = await patientRepository.create(draft, ownerId);
      const savedItems = next.map((item) => item.id === saved.id ? saved : item);
      setPatients(savedItems); writeCache(savedItems); setSyncState("synced"); return saved;
    } catch (err) {
      syncQueue.enqueue({ id: localPatient.id, operation: "create", table: "clinical_patients", payload: localPatient });
      setSyncState("failed"); setError(err instanceof Error ? err.message : "Create failed"); return localPatient;
    }
  }, [patients]);

  return useMemo(() => ({ patients, syncState, error, refresh, createPatient, pendingCount: syncQueue.list().length }), [patients, syncState, error, refresh, createPatient]);
}
