import { supabase } from "./client";

export type ClinicalCaseRecord = { id?: string; owner_id?: string; patient_id?: string | null; title: string; current_step?: number; source_verified?: boolean; created_at?: string; updated_at?: string };
export type MedicationReviewRecord = { id?: string; owner_id?: string; patient_id?: string | null; indication: string; effectiveness?: string; safety?: string; status?: "draft" | "submitted" | "completed"; created_at?: string; updated_at?: string };
export type InterventionRecord = { id?: string; owner_id?: string; patient_id?: string | null; intervention_type: string; soap_note?: string; evidence_url?: string; evidence_level?: string; status?: "draft" | "submitted" | "accepted" | "rejected"; created_at?: string; updated_at?: string };

function requireClient() { if (!supabase) throw new Error("Supabase is not configured"); return supabase; }

export const clinicalRepository = {
  cases: {
    async list(ownerId: string) { const { data, error } = await requireClient().from("clinical_cases").select("*").eq("owner_id", ownerId).order("updated_at", { ascending: false }); if (error) throw error; return data as ClinicalCaseRecord[]; },
    async create(ownerId: string, input: Omit<ClinicalCaseRecord, "owner_id" | "id">) { const { data, error } = await requireClient().from("clinical_cases").insert({ ...input, owner_id: ownerId }).select().single(); if (error) throw error; return data as ClinicalCaseRecord; },
    async update(ownerId: string, id: string, patch: Partial<ClinicalCaseRecord>) { const { data, error } = await requireClient().from("clinical_cases").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).eq("owner_id", ownerId).select().single(); if (error) throw error; return data as ClinicalCaseRecord; },
    async remove(ownerId: string, id: string) { const { error } = await requireClient().from("clinical_cases").delete().eq("id", id).eq("owner_id", ownerId); if (error) throw error; },
  },
  medicationReviews: {
    async list(ownerId: string) { const { data, error } = await requireClient().from("medication_reviews").select("*").eq("owner_id", ownerId).order("updated_at", { ascending: false }); if (error) throw error; return data as MedicationReviewRecord[]; },
    async upsert(ownerId: string, input: Omit<MedicationReviewRecord, "owner_id">) { const { data, error } = await requireClient().from("medication_reviews").upsert({ ...input, owner_id: ownerId }, { onConflict: "id" }).select().single(); if (error) throw error; return data as MedicationReviewRecord; },
    async remove(ownerId: string, id: string) { const { error } = await requireClient().from("medication_reviews").delete().eq("id", id).eq("owner_id", ownerId); if (error) throw error; },
  },
  interventions: {
    async list(ownerId: string) { const { data, error } = await requireClient().from("clinical_interventions").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }); if (error) throw error; return data as InterventionRecord[]; },
    async create(ownerId: string, input: Omit<InterventionRecord, "owner_id" | "id">) { const { data, error } = await requireClient().from("clinical_interventions").insert({ ...input, owner_id: ownerId }).select().single(); if (error) throw error; return data as InterventionRecord; },
    async update(ownerId: string, id: string, patch: Partial<InterventionRecord>) { const { data, error } = await requireClient().from("clinical_interventions").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).eq("owner_id", ownerId).select().single(); if (error) throw error; return data as InterventionRecord; },
    async remove(ownerId: string, id: string) { const { error } = await requireClient().from("clinical_interventions").delete().eq("id", id).eq("owner_id", ownerId); if (error) throw error; },
  },
  guidelines: {
    async search(query: string) { const { data, error } = await requireClient().from("guidelines").select("*").or(`title.ilike.%${query}%,organization.ilike.%${query}%`).order("year", { ascending: false }); if (error) throw error; return data ?? []; },
  },
};
