import { supabase } from "./client";

export function resetPasswordRedirect(origin: string) { return `${origin}/reset-password`; }
export function hasRestoredSession(session: { user?: { id?: string } } | null | undefined) { return Boolean(session?.user?.id); }

export const authService = {
  async signUp(email: string, password: string, displayName?: string) {
    if (!supabase) throw new Error("Supabase is not configured");
    return supabase.auth.signUp({ email, password, options: { data: { full_name: displayName } } });
  },
  async signIn(email: string, password: string) {
    if (!supabase) throw new Error("Supabase is not configured");
    return supabase.auth.signInWithPassword({ email, password });
  },
  async signOut() {
    if (!supabase) return { error: null };
    return supabase.auth.signOut();
  },
  async resetPassword(email: string) {
    if (!supabase) throw new Error("Supabase is not configured");
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    return supabase.auth.resetPasswordForEmail(email, { redirectTo: resetPasswordRedirect(origin) });
  },
  getSession() {
    return supabase?.auth.getSession();
  },
};
