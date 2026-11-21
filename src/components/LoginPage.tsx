import { useState } from "react";
import { Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) setError("Credenziali non valide. Controlla email e password.");
    else onSuccess();
  };

  const reset = async () => {
    if (!email.trim() || resetLoading) return;
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(email.trim());
    setResetLoading(false);
    setResetSent(true);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 shadow-lg shadow-teal-700/25">
            <Lock className="h-7 w-7 text-white" />
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Area Tuttofare</h1>
          <p className="mt-1 text-sm text-slate-500">Accedi per gestire il tuo profilo</p>
        </div>
        <form
          onSubmit={login}
          className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <div>
            <label htmlFor="l-email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="l-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>
          <div>
            <label htmlFor="l-pass" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="l-pass"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-10 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Nascondi password" : "Mostra password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-600/10">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Accesso..." : "Accedi"}
          </button>
          <div className="text-center">
            {resetSent ? (
              <p className="text-xs text-emerald-700">
                Email di recupero inviata! Controlla la tua casella di posta.
              </p>
            ) : (
              <button
                type="button"
                onClick={reset}
                disabled={!email.trim() || resetLoading}
                className="text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline disabled:opacity-50"
              >
                Password dimenticata?
              </button>
            )}
          </div>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">
          Gli account vengono creati solo dall'amministratore.
        </p>
      </div>
    </div>
  );
}
