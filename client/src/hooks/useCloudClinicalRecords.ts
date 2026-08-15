import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { clinicalRepository, type ClinicalCaseRecord, type InterventionRecord, type MedicationReviewRecord } from "@/lib/supabase/clinicalRepository";
import { syncQueue } from "@/lib/supabase/syncQueue";

export function useCloudClinicalRecords() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cases, setCases] = useState<ClinicalCaseRecord[]>([]);
  const [interventions, setInterventions] = useState<InterventionRecord[]>([]);
  const [guidelines, setGuidelines] = useState<Array<{ id: string; organization: string; title: string; year?: number; tier: string; source_url: string; status: string }>>([]);
  const [medicationReviews, setMedicationReviews] = useState<MedicationReviewRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const ownerId = data.session?.user.id ?? null;
    setSessionId(ownerId);
    if (!ownerId) return;
    try {
      const [nextCases, nextInterventions, nextMedicationReviews] = await Promise.all([clinicalRepository.cases.list(ownerId), clinicalRepository.interventions.list(ownerId), clinicalRepository.medicationReviews.list(ownerId)]);
      setCases(nextCases); setInterventions(nextInterventions); setMedicationReviews(nextMedicationReviews); setError(null);
    } catch (err) { setError(err instanceof Error ? err.message : "Clinical cloud data unavailable"); }
  }, []);

  useEffect(() => { void refresh(); if (!supabase) return; const { data } = supabase.auth.onAuthStateChange(() => { void refresh(); }); return () => data.subscription.unsubscribe(); }, [refresh]);

  const createCase = useCallback(async (input: Omit<ClinicalCaseRecord, "owner_id" | "id">) => {
    if (!sessionId) throw new Error("Sign in to create a cloud clinical case");
    try { const created = await clinicalRepository.cases.create(sessionId, input); setCases((items) => [created, ...items]); return created; }
    catch (err) { syncQueue.enqueue({ id: `case-create-${Date.now()}`, operation: "create", table: "clinical_cases", payload: { ...input } }); throw err; }
  }, [sessionId]);

  const saveMedicationReview = useCallback(async (input: Omit<MedicationReviewRecord, "owner_id">) => {
    if (!sessionId) throw new Error("Sign in to save a medication review");
    try { const saved = await clinicalRepository.medicationReviews.upsert(sessionId, input); setMedicationReviews((items) => [saved, ...items.filter((item) => item.id !== saved.id)]); return saved; }
    catch (err) { syncQueue.enqueue({ id: `medication-review-${input.id || Date.now()}`, operation: "update", table: "medication_reviews", payload: { ...input } }); throw err; }
  }, [sessionId]);

  const deleteMedicationReview = useCallback(async (id: string) => {
    if (!sessionId) throw new Error("Sign in to delete a medication review");
    await clinicalRepository.medicationReviews.remove(sessionId, id); setMedicationReviews((items) => items.filter((item) => item.id !== id));
  }, [sessionId]);

  const createIntervention = useCallback(async (input: Omit<InterventionRecord, "owner_id" | "id">) => {
    if (!sessionId) throw new Error("Sign in to create a cloud intervention");
    try { const created = await clinicalRepository.interventions.create(sessionId, input); setInterventions((items) => [created, ...items]); return created; }
    catch (err) { syncQueue.enqueue({ id: `intervention-create-${Date.now()}`, operation: "create", table: "clinical_interventions", payload: { ...input } }); throw err; }
  }, [sessionId]);

  const searchGuidelines = useCallback(async (query: string) => {
    if (!sessionId) return [];
    const results = await clinicalRepository.guidelines.search(query);
    setGuidelines(results as typeof guidelines);
    return results;
  }, [sessionId]);

  const updateIntervention = useCallback(async (id: string, patch: Partial<InterventionRecord>) => {
    if (!sessionId) throw new Error("Sign in to update a cloud intervention");
    try { const updated = await clinicalRepository.interventions.update(sessionId, id, patch); setInterventions((items) => items.map((item) => item.id === id ? updated : item)); return updated; }
    catch (err) { syncQueue.enqueue({ id: `intervention-update-${id}`, operation: "update", table: "clinical_interventions", payload: { id, ...patch } }); throw err; }
  }, [sessionId]);

  const deleteCase = useCallback(async (id: string) => {
    if (!sessionId) throw new Error("Sign in to delete a cloud clinical case");
    try { await clinicalRepository.cases.remove(sessionId, id); setCases((items) => items.filter((item) => item.id !== id)); }
    catch (err) { syncQueue.enqueue({ id: `case-delete-${id}`, operation: "delete", table: "clinical_cases", payload: { id } }); throw err; }
  }, [sessionId]);

  return { sessionId, cases, interventions, guidelines, medicationReviews, error, refresh, createCase, createIntervention, searchGuidelines, updateIntervention, deleteCase, saveMedicationReview, deleteMedicationReview, isProtected: !sessionId };
}
