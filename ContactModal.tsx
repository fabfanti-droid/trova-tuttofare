import { useState } from "react";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase, type ProfiloTuttofare } from "@/lib/supabase";

const WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL;

export function ContactModal({
  profilo,
  onClose,
}: {
  profilo: ProfiloTuttofare;
  onClose: () => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = nome.trim() && email.trim() && messaggio.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || sending) return;
    setSending(true);
    setError(null);
    const payload = {
      nome_tuttofare: profilo.nome,
      email_tuttofare: profilo.email,
      nome_cliente: nome.trim(),
      email_cliente: email.trim(),
      telefono_cliente: telefono.trim(),
      messaggio: messaggio.trim(),
    };
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      // Salva anche nel database per la dashboard admin
      await supabase.from("richieste_contatto").insert({
        tuttofare_id: profilo.id,
        nome_tuttofare: profilo.nome,
        email_tuttofare: profilo.email,
        nome_cliente: nome.trim(),
        email_cliente: email.trim(),
        telefono_cliente: telefono.trim() || null,
        messaggio: messaggio.trim(),
      });
      setSuccess(true);
      setTimeout(onClose, 2500);
    } catch {
      setError("Impossibile inviare la richiesta. Riprova tra poco.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Chiudi"
        >
          <X className="h-5 w-5" />
        </button>
        {success ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </span>
            <h3 className="text-lg font-semibold text-slate-900">Richiesta inviata!</h3>
            <p className="text-sm text-slate-600">
              Il tuo messaggio è stato inviato a {profilo.nome}. Ti risponderà al più presto.
            </p>
          </div>
        ) : (
          <>
            <h3 className="pr-8 text-lg font-semibold text-slate-900">
              Invia una richiesta a {profilo.nome}
            </h3>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="c-nome" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nome del cliente *
                </label>
                <input
                  id="c-nome"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>
              <div>
                <label htmlFor="c-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email del cliente *
                </label>
                <input
                  id="c-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>
              <div>
                <label htmlFor="c-tel" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Telefono del cliente (opzionale)
                </label>
                <input
                  id="c-tel"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>
              <div>
                <label htmlFor="c-msg" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Descrizione del lavoro richiesto *
                </label>
                <textarea
                  id="c-msg"
                  required
                  rows={4}
                  value={messaggio}
                  onChange={(e) => setMessaggio(e.target.value)}
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
                disabled={!valid || sending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                {sending ? "Invio in corso..." : "Invia richiesta"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
