import { useEffect, useMemo, useState } from "react";
import { MapPin, AlertCircle, Loader2, Filter, ChevronDown, ChevronRight } from "lucide-react";
import { supabase, type ProfiloTuttofare } from "@/lib/supabase";
import { cittaToRegione, REGIONI_ORDER, FALLBACK_REGIONE } from "@/lib/regioni";
import { ProCard } from "@/components/ProCard";

export function RegioniPage({ onContact, onApriDettaglio }: { onContact: (p: ProfiloTuttofare) => void; onApriDettaglio: (p: ProfiloTuttofare) => void }) {
  const [profili, setProfili] = useState<ProfiloTuttofare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [regioneSelezionata, setRegioneSelezionata] = useState<string>("");

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

  const grouped = useMemo(() => {
    const map = new Map<string, ProfiloTuttofare[]>();
    for (const p of profili) {
      const r = cittaToRegione(p.citta);
      if (!map.has(r)) map.set(r, []);
      map.get(r)!.push(p);
    }
    // ordina per REGIONI_ORDER, poi quelle non in lista in fondo
    const sorted = Array.from(map.entries()).sort((a, b) => {
      const ia = REGIONI_ORDER.indexOf(a[0]);
      const ib = REGIONI_ORDER.indexOf(b[0]);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
    return sorted;
  }, [profili]);

  const regioniDisponibili = grouped.map(([r]) => r);

  const filtrati = regioneSelezionata
    ? grouped.find(([r]) => r === regioneSelezionata)?.[1] ?? []
    : profili;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <h2 className="mt-3 text-lg font-semibold text-slate-900">Errore di caricamento</h2>
        <p className="mt-1 text-sm text-slate-500">
          Non è stato possibile caricare l'elenco. Ricarica la pagina.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Profili per Regione</h1>
        <p className="mt-2 text-sm text-slate-500">
          Sfoglia i tuttofare attivi raggruppati per regione italiana.
        </p>
      </div>

      {/* Filtro regione */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <button
          onClick={() => setRegioneSelezionata("")}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            !regioneSelezionata
              ? "bg-teal-700 text-white"
              : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
          }`}
        >
          Tutte le regioni
        </button>
        {regioniDisponibili.map((r) => (
          <button
            key={r}
            onClick={() => setRegioneSelezionata(r)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              regioneSelezionata === r
                ? "bg-teal-700 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
            }`}
          >
            {r}
            <span className="ml-1.5 text-xs opacity-70">
              ({grouped.find(([g]) => g === r)?.[1].length ?? 0})
            </span>
          </button>
        ))}
      </div>

      {/* Elenco raggruppato */}
      {regioneSelezionata ? (
        <div>
          <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold text-slate-900">
            <MapPin className="h-5 w-5 text-teal-700" />
            {regioneSelezionata}
            <span className="text-sm font-normal text-slate-400">
              ({filtrati.length} professionisti)
            </span>
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtrati.map((p) => (
              <ProCard key={p.id} profilo={p} onContact={onContact} onApri={onApriDettaglio} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(([regione, profiliR]) => (
            <div key={regione}>
              <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-3">
                <ChevronRight className="h-5 w-5 text-teal-700" />
                <h2 className="text-xl font-semibold text-slate-900">{regione}</h2>
                <span className="text-sm text-slate-400">
                  {profiliR.length} professionisti
                </span>
                {regione === FALLBACK_REGIONE && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20">
                    città non riconosciuta
                  </span>
                )}
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {profiliR.map((p) => (
                  <ProCard key={p.id} profilo={p} onContact={onContact} onApri={onApriDettaglio} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
