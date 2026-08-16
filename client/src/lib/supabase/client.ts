import { createClient } from "@supabase/supabase-js";

const publicEnv = import.meta.env as unknown as Record<string, string | undefined>;
const supabaseUrl = publicEnv.EXPO_PUBLIC_SUPABASE_URL ?? publicEnv.VITE_SUPABASE_URL;
const supabaseAnonKey = publicEnv.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? publicEnv.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
