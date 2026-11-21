import { useEffect, useState } from "react";
import { Hammer, MapPin, AlertCircle, Loader2, Wrench } from "lucide-react";
import { supabase, type ProfiloTuttofare } from "@/lib/supabase";
import { ProCard } from "@/components/ProCard";
import { cittaToRegione, REGIONI_ORDER } from "@/lib/regioni";

export function HomePage({ onContact, onApriDettaglio }: { onContact: (p: ProfiloTuttofare) => void; onApriDettaglio: (p: ProfiloTuttofare) => void }) {
  const [profili, setProfili] = useState<ProfiloTuttofare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [citta, setCitta] = useState("");
  const [regione, setRegione] = useState("");
  const [ricerca, setRicerca] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profili_tuttofare")
        .select("*")
        .eq("stato", "Attivo")
        .neq("nome", "")
        .not("nome", "is", null)
        .order("nome");
      if (!cancelled) {
        if (error) {
          console.error(error);
          setError(true);
        } else {
          setProfili(data ?? []);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cittaList = Array.from(
    new Set(profili.map((p) => p.citta?.trim()).filter(Boolean) as string[])
  ).sort();

  const regioneList = REGIONI_ORDER.filter((r) => r !== "Altre località / Da assegnare");

  const cittaListFiltrate = Array.from(
    new Set(
      profili
        .filter((p) => !regione || cittaToRegione(p.citta ?? "") === regione)
        .map((p) => p.citta?.trim())
        .filter(Boolean) as string[]
    )
  ).sort();

  const filtrati = profili.filter((p) => {
    const matchRegione = !regione || cittaToRegione(p.citta ?? "") === regione;
    const matchCitta = !citta || p.citta?.trim() === citta;
    const q = ricerca.trim().toLowerCase();
    const matchQ =
      !q ||
      [p.nome, p.citta, p.servizi, p.descrizione].some((f) => f?.toLowerCase().includes(q));
    return matchRegione && matchCitta && matchQ;
  });

  return (
    <>
      <section className="relative overflow-hidden bg-slate-900">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #0d9488 0%, transparent 45%), radial-gradient(circle at 80% 70%, #0d9488 0%, transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-teal-300 ring-1 ring-inset ring-teal-400/30">
            <Wrench className="h-3.5 w-3.5" /> Il modo piu semplice per trovare il tuo tuttofare
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl">
            Trova il <span className="text-teal-400">tuttofare</span> giusto per ogni lavoro in casa
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
            Scegli in base al servizio, regione o città. Contattali
            direttamente, senza commissioni.
          </p>
          <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Wrench className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                placeholder="Cerca un servizio o una parola chiave..."
                className="w-full rounded-xl border-0 bg-white/95 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <select
              value={regione}
              onChange={(e) => {
                setRegione(e.target.value);
                setCitta("");
              }}
              className="rounded-xl border-0 bg-white/95 py-3 px-4 text-sm font-medium text-slate-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400 sm:w-44"
            >
              <option value="">Tutte le regioni</option>
              {regioneList.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={citta}
              onChange={(e) => setCitta(e.target.value)}
              className="rounded-xl border-0 bg-white/95 py-3 px-4 text-sm font-medium text-slate-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400 sm:w-44"
            >
              <option value="">Tutte le città</option>
              {cittaListFiltrate.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Errore di caricamento</h2>
            <p className="mt-1 text-sm text-slate-500">
              Non è stato possibile caricare l'elenco dei tuttofare. Ricarica la pagina.
            </p>
          </div>
        ) : filtrati.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <Hammer className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Nessun tuttofare trovato</h2>
            <p className="mt-1 text-sm text-slate-500">
              Prova a modificare la ricerca o seleziona un'altra città.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-slate-500">
              {filtrati.length} {filtrati.length === 1 ? "tuttofare disponibile" : "tuttofare disponibili"}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtrati.map((p) => (
                <ProCard key={p.id} profilo={p} onContact={onContact} onApri={onApriDettaglio} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}

// re-export per compatibilità footer icon
export { MapPin };
