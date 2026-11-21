import { useEffect, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wrench,
  Mail,
  Phone,
} from "lucide-react";
import { supabase, type ProfiloTuttofare, type Recensione } from "@/lib/supabase";

const WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL;

const SERVICE_COLORS: Record<string, string> = {
  idraulica: "bg-blue-100 text-blue-800 ring-blue-600/20",
  elettricità: "bg-amber-100 text-amber-800 ring-amber-600/20",
  elettricista: "bg-amber-100 text-amber-800 ring-amber-600/20",
  "montaggio mobili": "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  imbiancatura: "bg-rose-100 text-rose-800 ring-rose-600/20",
  pittura: "bg-rose-100 text-rose-800 ring-rose-600/20",
  giardinaggio: "bg-green-100 text-green-800 ring-green-600/20",
  "piccola falegnameria": "bg-orange-100 text-orange-800 ring-orange-600/20",
  facchinaggio: "bg-sky-100 text-sky-800 ring-sky-600/20",
};

const serviceColor = (s: string) =>
  SERVICE_COLORS[s.trim().toLowerCase()] ?? "bg-slate-100 text-slate-700 ring-slate-500/20";

export function DetailPage({
  profilo,
  onBack,
}: {
  profilo: ProfiloTuttofare;
  onBack: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [recensioni, setRecensioni] = useState<Recensione[]>([]);
  const [loadingRev, setLoadingRev] = useState(true);

  // contact form state
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("recensioni")
        .select("*")
        .eq("tuttofare_id", profilo.id)
        .order("created_at", { ascending: false });
      if (data) setRecensioni(data as Recensione[]);
      setLoadingRev(false);
    })();
  }, [profilo.id]);

  const mediaVoto =
    recensioni.length > 0
      ? recensioni.reduce((s, r) => s + r.voto, 0) / recensioni.length
      : 0;

  const servizi = (profilo.servizi ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const iniziale = profilo.nome?.trim()?.[0]?.toUpperCase() ?? "?";

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
    } catch {
      setError("Impossibile inviare la richiesta. Riprova tra poco.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-slate-50">
      {/* Photo + back button */}
      <div className="bg-gradient-to-br from-teal-800 to-slate-900">
        <div className="mx-auto max-w-5xl px-4 pt-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-md backdrop-blur transition-colors hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" /> Indietro
          </button>
        </div>
        <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-8">
          {profilo.foto_url && !imgError ? (
            <img
              src={profilo.foto_url}
              alt={profilo.nome ?? "Tuttofare"}
              className="max-h-80 w-auto max-w-full rounded-2xl object-contain shadow-2xl ring-4 ring-white/10"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="flex h-32 w-32 items-center justify-center rounded-full bg-white/10 text-5xl font-semibold text-white ring-2 ring-white/25 backdrop-blur-sm">
              {iniziale}
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Name + city + rating header */}
        <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{profilo.nome}</h1>
              {profilo.citta && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="h-4 w-4 text-teal-700" />
                  {profilo.citta}
                </p>
              )}
            </div>
            {recensioni.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 ring-1 ring-amber-100">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-4 w-4 ${
                        n <= Math.round(mediaVoto)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-200 text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {mediaVoto.toFixed(1)}
                </span>
                <span className="text-sm text-slate-400">
                  ({recensioni.length} {recensioni.length === 1 ? "recensione" : "recensioni"})
                </span>
              </div>
            )}
          </div>

          {servizi.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {servizi.map((s) => (
                <span
                  key={s}
                  className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${serviceColor(s)}`}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          {/* Left: description + reviews */}
          <div className="space-y-6 lg:col-span-3">
            {profilo.descrizione && (
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Wrench className="h-5 w-5 text-teal-700" />
                  Attività
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {profilo.descrizione}
                </p>
              </div>
            )}

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Star className="h-5 w-5 text-amber-400" />
                Recensioni
              </h2>

              {loadingRev ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-700" />
                </div>
              ) : recensioni.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-400">
                  Nessuna recensione per ora.
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {recensioni.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900">{r.nome_cliente}</p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`h-3.5 w-3.5 ${
                                n <= r.voto
                                  ? "fill-amber-400 text-amber-400"
                                  : "fill-slate-200 text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {r.testo && (
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                          {r.testo}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(r.created_at).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: contact form */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
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
                  <h2 className="text-lg font-semibold text-slate-900">
                    Contatta {profilo.nome?.split(" ")[0] ?? "il professionista"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Compila il modulo: riceverà la tua richiesta via email.
                  </p>
                  <form onSubmit={submit} className="mt-5 space-y-4">
                    <div>
                      <label htmlFor="d-nome" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Nome *
                      </label>
                      <input
                        id="d-nome"
                        required
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="d-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="d-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="d-tel" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Telefono (opzionale)
                      </label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="d-tel"
                          type="tel"
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="d-msg" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Descrizione del lavoro *
                      </label>
                      <textarea
                        id="d-msg"
                        required
                        rows={4}
                        value={messaggio}
                        onChange={(e) => setMessaggio(e.target.value)}
                        className="w-full resize-none rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                        placeholder="Es: Ho bisogno di montare una libreria..."
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
        </div>
      </div>
    </div>
  );
}
