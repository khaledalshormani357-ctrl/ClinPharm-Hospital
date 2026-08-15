import { supabase } from "./client";
import type { CloudPatient, PatientDraft } from "./types";

export const patientRepository = {
  async list(ownerId?: string) {
    if (!supabase) throw new Error("Supabase is not configured");
    let query = supabase.from("clinical_patients").select("*").order("updated_at", { ascending: false });
    if (ownerId) query = query.eq("owner_id", ownerId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as CloudPatient[];
  },
  async create(patient: PatientDraft, ownerId: string) {
    if (!supabase) throw new Error("Supabase is not configured");
    const { data, error } = await supabase.from("clinical_patients").insert({ ...patient, owner_id: ownerId, sync_state: "synced" }).select().single();
    if (error) throw error;
    return data as CloudPatient;
  },
  async update(id: string, ownerId: string, patch: Partial<PatientDraft>) {
    if (!supabase) throw new Error("Supabase is not configured");
    const { data, error } = await supabase.from("clinical_patients").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).eq("owner_id", ownerId).select().single();
    if (error) throw error;
    return data as CloudPatient;
  },
  async remove(id: string, ownerId: string) {
    if (!supabase) throw new Error("Supabase is not configured");
    const { error } = await supabase.from("clinical_patients").delete().eq("id", id).eq("owner_id", ownerId);
    if (error) throw error;
  },
};
