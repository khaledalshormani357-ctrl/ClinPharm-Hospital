import { useEffect, useState } from "react";
import { LogIn, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { queueItemStatus, syncQueue } from "@/lib/supabase/syncQueue";
import { uiCopy as t } from "@/lib/ui-copy";
import type { SyncQueueItem } from "@/lib/supabase/types";

export default function SupabaseAuthPanel({ syncState, onRetry }: { syncState: "synced" | "pending" | "failed"; onRetry?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>(() => syncQueue.list());
  const refreshQueue = () => setQueueItems(syncQueue.list());

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setSessionEmail(data.session?.user.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSessionEmail(nextSession?.user.email ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    setBusy(true); setMessage("");
    try {
      const result = mode === "signIn" ? await authService.signIn(email, password) : await authService.signUp(email, password);
      if (result.error) throw result.error;
      setMessage(mode === "signIn" ? t("Signed in; cloud sync is available.") : t("Account created. Check your email if confirmation is enabled."));
    } catch (error) { setMessage(error instanceof Error ? error.message : t("Authentication failed")); }
    finally { setBusy(false); }
  };

  const queuePanel = queueItems.length > 0 && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><div className="flex items-center justify-between"><p className="text-xs font-bold text-amber-900">{t("Sync recovery queue")}</p><span className="text-[10px] font-bold text-amber-800">{queueItems.length} item{queueItems.length === 1 ? "" : "s"}</span></div><div className="mt-2 space-y-2">{queueItems.map((item) => <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/70 p-2 text-[10px] text-amber-900"><span className="min-w-0 truncate"><b>{item.table}</b> · {item.operation} · <strong className={queueItemStatus(item) === "conflict" ? "text-violet-700" : queueItemStatus(item) === "failed" ? "text-rose-700" : "text-amber-800"}>{queueItemStatus(item) === "conflict" ? "conflict — choose recovery" : queueItemStatus(item)}</strong>{item.attempts > 0 ? ` · ${item.attempts} attempts` : ""}</span><span className="flex shrink-0 gap-1"><button onClick={() => { onRetry?.(); refreshQueue(); }} className="font-bold underline" aria-label={`Recover ${item.table} ${item.operation}`}>{queueItemStatus(item) === "conflict" ? "Recover" : "Retry"}</button><button onClick={() => { syncQueue.remove(item.id); refreshQueue(); }} className="text-slate-500 underline" aria-label={`Dismiss ${item.table} ${item.operation}`}>Dismiss</button></span></div>)}</div></div>;

  if (sessionEmail) return <div><div className="flex items-center gap-2 rounded-xl border border-[#cfe5df] bg-[#eaf7f2] px-3 py-2 text-xs text-teal-900"><ShieldCheck className="h-4 w-4 text-teal-700" /><span className="max-w-[180px] truncate font-semibold">{sessionEmail}</span><Button onClick={() => authService.signOut()} variant="ghost" size="sm" className="h-7 rounded-lg px-2 text-teal-800" aria-label="Sign out from Supabase"><LogOut className="h-3.5 w-3.5" /></Button>{syncState === "failed" && <Button onClick={() => { onRetry?.(); refreshQueue(); }} variant="ghost" size="sm" className="h-7 rounded-lg px-2 text-rose-700" aria-label="Retry cloud sync"><RefreshCw className="h-3.5 w-3.5" /></Button>}</div>{queuePanel}</div>;

  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-slate-800">{t("Cloud account")}</p><p className="mt-1 text-xs text-slate-500">{t("Sign in to enable Supabase sync.")}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${syncState === "failed" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>{syncState === "failed" ? "Retry needed" : "Local cache"}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" aria-label="Supabase email" /><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" aria-label="Supabase password" /></div><div className="mt-3 flex flex-wrap items-center gap-2">{syncState === "failed" && <Button onClick={onRetry} variant="outline" size="sm" className="h-9 rounded-lg text-xs"><RefreshCw className="mr-1.5 h-3.5 w-3.5" />{t("Retry sync")}</Button>}<Button disabled={busy || !email || !password} onClick={submit} className="h-9 rounded-lg bg-[#102b2c] text-xs text-white"><LogIn className="mr-1.5 h-3.5 w-3.5" />{mode === "signIn" ? t("Sign in") : t("Create account")}</Button><button onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")} className="text-xs font-semibold text-teal-700">{mode === "signIn" ? t("Create account") : t("Use existing account")}</button><button onClick={() => void authService.resetPassword(email).then(({ error }) => setMessage(error ? error.message : "Reset email requested."))} className="text-xs text-slate-500">{t("Reset password")}</button></div>{message && <p className="mt-3 text-xs leading-5 text-slate-500">{message}</p>}{queuePanel}</div>;
}
