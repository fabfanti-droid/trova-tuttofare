import { useEffect, useState } from "react";
import { Star, CheckCircle2, AlertCircle, Loader2, Hammer } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function ReviewPage({ token }: { token: string }) {
  const [voto, setVoto] = useState(0);
  const [hoverVoto, setHoverVoto] = useState(0);
  const [testo, setTesto] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [nomeTuttofare, setNomeTuttofare] = useState<string>("");

  useEffect(() => {
    (async () => {
      // Verifica che il token sia valido trovando la richiesta associata
      const { data, error } = await supabase
        .from("richieste_contatto")
        .select("nome_tuttofare, risposta_inviata, token_recensione")
        .eq("token_recensione", token)
        .maybeSingle();

      if (error || !data) {
        setTokenValido(false);
      } else if (!data.risposta_inviata) {
        setTokenValido(false);
        setError("Il tuttofare non ha ancora risposto alla tua richiesta.");
      } else {
        setTokenValido(true);
        setNomeTuttofare(data.nome_tuttofare ?? "il tuttofare");
      }
      setVerifying(false);
    })();
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (voto < 1 || submitting) return;
    setSubmitting(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc("inserisci_recensione", {
      p_token: token,
      p_voto: voto,
      p_testo: testo.trim() || null,
    });

    setSubmitting(false);

    if (rpcError) {
      setError("Errore durante l'invio della recensione. Riprova.");
      return;
    }

    const result = data as { success?: boolean; error?: string } | null;
    if (result?.success === true) {
      setSuccess(true);
    } else {
      setError(result?.error ?? "Non e stato possibile inviare la recensione.");
    }
  };

  if (verifying) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </span>
          <h2 className="text-lg font-semibold text-slate-900">Recensione inviata!</h2>
          <p className="mt-2 text-sm text-slate-500">
            Grazie per aver lasciato una recensione. Il tuo feedback e prezioso per altri clienti.
          </p>
        </div>
      </div>
    );
  }

  if (!tokenValido) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="h-7 w-7 text-amber-600" />
          </span>
          <h2 className="text-lg font-semibold text-slate-900">Link non valido</h2>
          <p className="mt-2 text-sm text-slate-500">
            {error ?? "Questo link non e valido o e gia stato utilizzato per lasciare una recensione."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-700 shadow-lg shadow-teal-700/25">
            <Hammer className="h-6 w-6 text-white" />
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Lascia una recensione</h1>
          <p className="mt-1 text-sm text-slate-500">
            Racconta la tua esperienza con {nomeTuttofare}
          </p>
        </div>
        <form
          onSubmit={submit}
          className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Il tuo voto *
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setVoto(n)}
                  onMouseEnter={() => setHoverVoto(n)}
                  onMouseLeave={() => setHoverVoto(0)}
                  className="rounded-lg p-1 transition-transform hover:scale-110"
                  aria-label={`${n} stelle`}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      n <= (hoverVoto || voto)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-slate-100 text-slate-300"
                    }`}
                  />
                </button>
              ))}
              {voto > 0 && (
                <span className="ml-2 text-sm font-medium text-slate-600">
                  {["", "Pessimo", "Deludente", "Discreto", "Buono", "Ottimo"][voto]}
                </span>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="r-testo" className="mb-1.5 block text-sm font-medium text-slate-700">
              Commento (opzionale)
            </label>
            <textarea
              id="r-testo"
              rows={4}
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              placeholder="Racconta com'e andato il lavoro..."
              className="w-full resize-none rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-600/10">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <button
            type="submit"
            disabled={voto < 1 || submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Invio in corso..." : "Invia recensione"}
          </button>
        </form>
      </div>
    </div>
  );
}
