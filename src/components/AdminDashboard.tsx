import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  MessageSquare,
  Users,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Trophy,
  UserCog,
  Star,
  MapPin,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react";
import {
  supabase,
  type RichiestaContatto,
  type ProfiloTuttofare,
  type Recensione,
} from "@/lib/supabase";
import { cittaToRegione } from "@/lib/regioni";

type TuttofareStats = {
  profilo: ProfiloTuttofare;
  richieste: RichiestaContatto[];
  count: number;
};

const MESI_IT = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
  "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
];

const CHART_COLORS = [
  "#0d9488", "#2563eb", "#dc2626", "#ea580c",
  "#7c3aed", "#0891b2", "#ca8a04", "#be185d",
  "#15803d", "#475569", "#9333ea", "#b45309",
];

function MeseChart({ stats }: { stats: TuttofareStats[] }) {
  const oggi = new Date();
  const annoCorrenteDefault = oggi.getFullYear();
  const [annoSelezionato, setAnnoSelezionato] = useState(annoCorrenteDefault);

  // Raccogli tutti gli anni che hanno richieste + anno corrente
  const anniDisponibili = useMemo(() => {
    const set = new Set<number>([annoCorrenteDefault]);
    for (const s of stats) {
      for (const r of s.richieste) {
        set.add(new Date(r.created_at).getFullYear());
      }
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [stats, annoCorrenteDefault]);

  // Mostra sempre tutti i 12 mesi
  const mesiLabels: { label: string; idx: number }[] = [];
  for (let i = 0; i <= 11; i++) {
    mesiLabels.push({ label: MESI_IT[i], idx: i });
  }

  const hasData = stats.some((s) =>
    s.richieste.some((r) => new Date(r.created_at).getFullYear() === annoSelezionato)
  );

  // Calcola il massimo per scalare le barre
  const maxValue = useMemo(() => {
    let max = 0;
    for (const s of stats) {
      for (const m of mesiLabels) {
        const count = s.richieste.filter((r) => {
          const d = new Date(r.created_at);
          return d.getFullYear() === annoSelezionato && d.getMonth() === m.idx;
        }).length;
        if (count > max) max = count;
      }
    }
    return max || 1;
  }, [stats, mesiLabels, annoSelezionato]);

  // Mostra sempre tutti i tuttofare, anche quelli senza richieste nell'anno selezionato
  const tuttofareDaMostrare = stats;

  return (
    <div className="space-y-6">
      {/* Selettore anno */}
      <div className="flex items-center gap-3">
        <label htmlFor="anno-select" className="text-sm font-medium text-slate-700">Anno:</label>
        <select
          id="anno-select"
          value={annoSelezionato}
          onChange={(e) => setAnnoSelezionato(Number(e.target.value))}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        >
          {anniDisponibili.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Grafico a barre raggruppate */}
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Barre */}
          <div className="grid grid-cols-12 gap-2 border-b border-slate-200 pb-2" style={{ height: "280px" }}>
            {mesiLabels.map((m) => (
              <div key={m.idx} className="flex h-full min-w-0 items-end justify-center">
                <div className="flex h-[240px] w-full items-end justify-center gap-1">
                  {tuttofareDaMostrare.map((s, i) => {
                    const count = s.richieste.filter((r) => {
                      const d = new Date(r.created_at);
                      return d.getFullYear() === annoSelezionato && d.getMonth() === m.idx;
                    }).length;
                    const heightPct = count > 0 ? Math.max((count / maxValue) * 100, 4) : 0;
                    return (
                      <div
                        key={s.profilo.id}
                        className="group relative min-w-0 flex-1 max-w-5 rounded-t transition-all hover:opacity-80"
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: count > 0 ? CHART_COLORS[i % CHART_COLORS.length] : "transparent",
                          minHeight: count > 0 ? "3px" : "0",
                        }}
                        title={`${s.profilo.nome || s.profilo.email}: ${count} richieste`}
                      >
                        {count > 0 && (
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-700 opacity-0 group-hover:opacity-100">
                            {count}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {/* Etichette mesi allineate con le barre */}
          <div className="grid grid-cols-12 gap-2 pt-2">
            {mesiLabels.map((m) => (
              <div key={m.idx} className="text-center">
                <span className="text-xs font-medium text-slate-500">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabella riassuntiva mese per mese */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 sticky left-0 bg-slate-50">Tuttofare</th>
              {mesiLabels.map((m) => (
                <th key={m.idx} className="px-3 py-3 text-center">{m.label}</th>
              ))}
              <th className="px-3 py-3 text-center">Totale</th>
              <th className="px-3 py-3 text-center">Totale generale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tuttofareDaMostrare.map((s, i) => {
              const totaliPerMese = mesiLabels.map((m) =>
                s.richieste.filter((r) => {
                  const d = new Date(r.created_at);
                  return d.getFullYear() === annoSelezionato && d.getMonth() === m.idx;
                }).length
              );
              const totaleAnno = totaliPerMese.reduce((a, b) => a + b, 0);
              return (
                <tr key={s.profilo.id} className="text-sm transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      {s.profilo.nome || s.profilo.email}
                    </span>
                  </td>
                  {totaliPerMese.map((c, mi) => (
                    <td key={mi} className="px-3 py-3 text-center text-slate-600">
                      {c > 0 ? <span className="font-semibold text-slate-900">{c}</span> : "—"}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center font-bold text-teal-700">{totaleAnno}</td>
                  <td className="px-3 py-3 text-center font-bold text-slate-900">{s.count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!hasData && (
        <p className="py-6 text-center text-sm text-slate-400">
          Nessuna richiesta registrata per l'anno {annoSelezionato}.
        </p>
      )}
    </div>
  );
}

function StarRow({ voto, size = "h-4 w-4" }: { voto: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${
            n <= Math.round(voto)
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

function RecensioniTab({
  stats,
  recensioni,
  onDelete,
}: {
  stats: TuttofareStats[];
  recensioni: Recensione[];
  onDelete: (recensione: Recensione) => void;
}) {
  const [ordinamento, setOrdinamento] = useState<"recensioni" | "alfabetico">("recensioni");

  const recPerTuttofare = useMemo(() => {
    const map = new Map<string, Recensione[]>();
    for (const r of recensioni) {
      const key = r.tuttofare_id ?? "";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }, [recensioni]);

  const mediaGenerale =
    recensioni.length > 0
      ? recensioni.reduce((s, r) => s + r.voto, 0) / recensioni.length
      : 0;

  const risposteSenzaRecensione = stats.reduce((acc, s) => {
    const risposte = s.richieste.filter((r) => r.risposta_inviata).length;
    const rec = recPerTuttofare.get(s.profilo.id)?.length ?? 0;
    return acc + Math.max(0, risposte - rec);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Sintesi recensioni */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <Star className="h-5 w-5 text-amber-500" />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900">{recensioni.length}</p>
              <p className="text-sm text-slate-500">Recensioni totali</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {mediaGenerale.toFixed(1)}
              </p>
              <p className="text-sm text-slate-500">Media generale</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
              <Clock className="h-5 w-5 text-orange-600" />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900">{risposteSenzaRecensione}</p>
              <p className="text-sm text-slate-500">Risposte senza recensione</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recensioni per tuttofare */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Ordina per:</span>
          <button
            onClick={() => setOrdinamento("recensioni")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              ordinamento === "recensioni"
                ? "bg-teal-700 text-white"
                : "bg-white text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            }`}
          >
            Numero recensioni
          </button>
          <button
            onClick={() => setOrdinamento("alfabetico")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              ordinamento === "alfabetico"
                ? "bg-teal-700 text-white"
                : "bg-white text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            }`}
          >
            Ordine alfabetico
          </button>
        </div>
        {stats.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Nessun tuttofare registrato.
          </p>
        ) : (
          [...stats]
            .sort((a, b) => {
              if (ordinamento === "alfabetico") {
                return (a.profilo.nome ?? "").localeCompare(b.profilo.nome ?? "");
              }
              const recA = recPerTuttofare.get(a.profilo.id)?.length ?? 0;
              const recB = recPerTuttofare.get(b.profilo.id)?.length ?? 0;
              return recB - recA;
            })
            .map((s) => {
            const recs = recPerTuttofare.get(s.profilo.id) ?? [];
            const media = recs.length > 0 ? recs.reduce((a, r) => a + r.voto, 0) / recs.length : 0;
            const risposte = s.richieste.filter((r) => r.risposta_inviata).length;
            return (
              <div
                key={s.profilo.id}
                className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800">
                      {s.profilo.nome?.trim()?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {s.profilo.nome || "(senza nome)"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {risposte} risposte · {recs.length} recensioni
                      </p>
                    </div>
                  </div>
                  {recs.length > 0 && (
                    <div className="flex items-center gap-2">
                      <StarRow voto={media} />
                      <span className="text-sm font-bold text-slate-900">
                        {media.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                {recs.length > 0 && (
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    {recs.slice(0, 3).map((r) => (
                      <div key={r.id} className="text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-slate-700">{r.nome_cliente}</span>
                          <div className="flex items-center gap-3">
                            <StarRow voto={r.voto} size="h-3 w-3" />
                            <button
                              type="button"
                              onClick={() => onDelete(r)}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                              aria-label={`Elimina recensione di ${r.nome_cliente}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Elimina
                            </button>
                          </div>
                        </div>
                        {r.testo && (
                          <p className="mt-1 italic text-slate-500">"{r.testo}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function AbbonamentiTab({
  stats,
  onToggle,
}: {
  stats: TuttofareStats[];
  onToggle: (id: string, nuovoStato: string) => void;
}) {
  const attivi = stats.filter((s) => s.profilo.stato === "Attivo").length;
  const scaduti = stats.length - attivi;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900">{attivi}</p>
              <p className="text-sm text-slate-500">Abbonamenti attivi</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900">{scaduti}</p>
              <p className="text-sm text-slate-500">Abbonamenti scaduti</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Tuttofare</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Stato</th>
              <th className="px-5 py-3 text-right">Azione</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stats.map((s) => (
              <tr key={s.profilo.id} className="text-sm transition-colors hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">
                  {s.profilo.nome || "(senza nome)"}
                </td>
                <td className="px-5 py-3 text-slate-600">{s.profilo.email}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                      s.profilo.stato === "Attivo"
                        ? "bg-emerald-100 text-emerald-800 ring-emerald-600/20"
                        : "bg-red-100 text-red-800 ring-red-600/20"
                    }`}
                  >
                    {s.profilo.stato ?? "—"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() =>
                      onToggle(
                        s.profilo.id,
                        s.profilo.stato === "Attivo" ? "Scaduto" : "Attivo"
                      )
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      s.profilo.stato === "Attivo"
                        ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-100"
                        : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    {s.profilo.stato === "Attivo" ? "Disattiva" : "Attiva"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TassoRispostaTab({ stats }: { stats: TuttofareStats[] }) {
  const dati = stats
    .filter((s) => s.richieste.length > 0)
    .map((s) => {
      const totale = s.richieste.length;
      const risposte = s.richieste.filter((r) => r.risposta_inviata).length;
      const tasso = totale > 0 ? (risposte / totale) * 100 : 0;
      return { profilo: s.profilo, totale, risposte, tasso };
    })
    .sort((a, b) => b.tasso - a.tasso);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Tasso di risposta</h2>
        <p className="mb-6 text-sm text-slate-500">
          Per ogni tuttofare, quante richieste ha ricevuto vs quante ha segnato come risposte.
        </p>

        {dati.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Nessuna richiesta ricevuta finora.
          </p>
        ) : (
          <div className="space-y-3">
            {dati.map((d) => (
              <div key={d.profilo.id} className="flex items-center gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800">
                  {d.profilo.nome?.trim()?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {d.profilo.nome || "(senza nome)"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {d.risposte} risposte su {d.totale} richieste
                  </p>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        d.tasso >= 70
                          ? "bg-emerald-500"
                          : d.tasso >= 40
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${Math.max(d.tasso, d.tasso > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`text-lg font-bold ${
                      d.tasso >= 70
                        ? "text-emerald-600"
                        : d.tasso >= 40
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {d.tasso.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GeografiaTab({ stats }: { stats: TuttofareStats[] }) {
  const perCitta = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of stats) {
      for (const r of s.richieste) {
        const citta = s.profilo.citta ?? "Sconosciuta";
        map.set(citta, (map.get(citta) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([citta, count]) => ({ citta, count }))
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  const perRegione = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of stats) {
      const regione = cittaToRegione(s.profilo.citta ?? "");
      const count = s.richieste.length;
      map.set(regione, (map.get(regione) ?? 0) + count);
    }
    return Array.from(map.entries())
      .map(([regione, count]) => ({ regione, count }))
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  const maxCitta = perCitta.length > 0 ? perCitta[0].count : 1;
  const maxRegione = perRegione.length > 0 ? perRegione[0].count : 1;

  const totaleRichieste = perCitta.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Distribuzione per regione</h2>
        <p className="mb-6 text-sm text-slate-500">
          Da dove arrivano le richieste, raggruppate per regione del tuttofare.
        </p>
        {perRegione.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">Nessuna richiesta ricevuta.</p>
        ) : (
          <div className="space-y-3">
            {perRegione.map((d) => (
              <div key={d.regione} className="flex items-center gap-4">
                <div className="w-48 shrink-0 truncate text-sm font-medium text-slate-700">
                  {d.regione}
                </div>
                <div className="flex-1">
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-teal-600 transition-all"
                      style={{
                        width: `${Math.max((d.count / maxRegione) * 100, d.count > 0 ? 5 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="w-20 shrink-0 text-right text-sm font-bold text-slate-900">
                  {d.count} ({totaleRichieste > 0 ? ((d.count / totaleRichieste) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Distribuzione per città</h2>
        <p className="mb-6 text-sm text-slate-500">
          Il numero di richieste ricevute dai tuttofare in ogni città.
        </p>
        {perCitta.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">Nessuna richiesta ricevuta.</p>
        ) : (
          <div className="space-y-2.5">
            {perCitta.map((d) => (
              <div key={d.citta} className="flex items-center gap-4">
                <div className="flex w-48 shrink-0 items-center gap-1.5 text-sm font-medium text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-teal-600" />
                  <span className="truncate">{d.citta}</span>
                </div>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{
                        width: `${Math.max((d.count / maxCitta) * 100, d.count > 0 ? 5 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="w-16 shrink-0 text-right text-sm font-bold text-slate-900">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Classifica({ stats }: { stats: TuttofareStats[] }) {
  const ordinati = [...stats].sort((a, b) => b.count - a.count);
  const maxCount = ordinati.length > 0 ? ordinati[0].count : 1;
  const medaglie = ["bg-amber-100 text-amber-800", "bg-slate-200 text-slate-700", "bg-orange-100 text-orange-800"];

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Classifica tuttofare</h2>
        <p className="mb-6 text-sm text-slate-500">
          I tuttofare ordinati per numero di richieste di contatto ricevute (totale di sempre).
        </p>

        {ordinati.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">Nessun tuttofare registrato.</p>
        ) : (
          <div className="space-y-3">
            {ordinati.map((s, i) => {
              const pct = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
              const isPodio = i < 3;
              return (
                <div key={s.profilo.id} className="flex items-center gap-4">
                  <div className="flex w-8 shrink-0 items-center justify-center">
                    {isPodio ? (
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${medaglie[i]}`}>
                        {i + 1}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-slate-400">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800">
                    {s.profilo.nome?.trim()?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {s.profilo.nome || "(senza nome)"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {s.profilo.email} {s.profilo.citta ? `· ${s.profilo.citta}` : ""}
                    </p>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-teal-600 transition-all"
                        style={{ width: `${Math.max(pct, s.count > 0 ? 5 : 0)}%` }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-lg font-bold text-slate-900">{s.count}</span>
                    <p className="text-xs text-slate-400">richieste</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminDashboard({ onVaiProfilo }: { onVaiProfilo?: () => void }) {
  const [stats, setStats] = useState<TuttofareStats[]>([]);
  const [recensioni, setRecensioni] = useState<Recensione[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ordinamento, setOrdinamento] = useState<"richieste" | "alfabetico">("richieste");
  const [regioneFiltro, setRegioneFiltro] = useState<string>("Tutte");
  const ora = new Date();
  const meseCorrente = ora.getMonth();
  const annoCorrente = ora.getFullYear();
  const [meseSelezionato, setMeseSelezionato] = useState(meseCorrente);
  const [annoSelezionatoCard, setAnnoSelezionatoCard] = useState(annoCorrente);
  const [tab, setTab] = useState<
    "richieste" | "clienti" | "andamento" | "classifica" | "recensioni" | "abbonamenti" | "risposta" | "geografia"
  >("richieste");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [profRes, ricRes, recRes] = await Promise.all([
        supabase.from("profili_tuttofare").select("*").order("nome"),
        supabase
          .from("richieste_contatto")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("recensioni")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      if (profRes.error || ricRes.error) {
        console.error(profRes.error ?? ricRes.error);
        setError(true);
        setLoading(false);
        return;
      }
      const profili = profRes.data ?? [];
      const richieste = ricRes.data ?? [];
      const mapped: TuttofareStats[] = profili.map((p) => {
        const r = richieste.filter(
          (x) => x.tuttofare_id === p.id || x.email_tuttofare === p.email
        );
        return { profilo: p, richieste: r, count: r.length };
      });
      mapped.sort((a, b) => b.count - a.count);
      setStats(mapped);
      if (!recRes.error && recRes.data) {
        setRecensioni(recRes.data as Recensione[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleStato = async (id: string, nuovoStato: string) => {
    const { error: updErr } = await supabase
      .from("profili_tuttofare")
      .update({ stato: nuovoStato })
      .eq("id", id);
    if (updErr) return;
    setStats((prev) =>
      prev.map((s) =>
        s.profilo.id === id ? { ...s, profilo: { ...s.profilo, stato: nuovoStato } } : s
      )
    );
  };

  const eliminaRecensione = async (recensione: Recensione) => {
    const conferma = window.confirm(
      `Vuoi eliminare definitivamente la recensione di ${recensione.nome_cliente}?`
    );
    if (!conferma) return;

    const { error: deleteError } = await supabase
      .from("recensioni")
      .delete()
      .eq("id", recensione.id);
    if (deleteError) {
      window.alert("Non è stato possibile eliminare la recensione. Riprova.");
      return;
    }
    setRecensioni((prev) => prev.filter((r) => r.id !== recensione.id));
  };

  const totaleRichieste = stats.reduce((s, x) => s + x.count, 0);

  const anniDisponibili = useMemo(() => {
    const set = new Set<number>([annoCorrente]);
    for (const s of stats) {
      for (const r of s.richieste) {
        set.add(new Date(r.created_at).getFullYear());
      }
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [stats, annoCorrente]);

  const MESI_IT_LUNGHI = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
  ];

  const richiesteMeseSelezionato = stats.reduce((acc, s) => acc + s.richieste.filter((r) => {
    const d = new Date(r.created_at);
    return d.getMonth() === meseSelezionato && d.getFullYear() === annoSelezionatoCard;
  }).length, 0);
  const richiesteAnnoSelezionato = stats.reduce((acc, s) => acc + s.richieste.filter((r) => {
    const d = new Date(r.created_at);
    return d.getFullYear() === annoSelezionatoCard;
  }).length, 0);
  const clientiUnici = new Map<string, RichiestaContatto>();
  for (const s of stats) {
    for (const r of s.richieste) {
      if (!clientiUnici.has(r.email_cliente)) {
        clientiUnici.set(r.email_cliente, r);
      }
    }
  }

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
          Non e stato possibile caricare i dati della dashboard. Ricarica la pagina.
        </p>
      </div>
    );
  }

  const fmtData = (iso: string) =>
    new Date(iso).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Admin</h1>
          <p className="mt-2 text-sm text-slate-500">
            Panoramica delle richieste ricevute dai tuttofare e dei contatti dei clienti.
          </p>
        </div>
        {onVaiProfilo && (
          <button
            onClick={onVaiProfilo}
            className="flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
          >
            <UserCog className="h-4 w-4" />
            Il Mio Profilo
          </button>
        )}
      </div>

      {/* Cards sintesi */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
              <Users className="h-5 w-5 text-teal-700" />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.length}</p>
              <p className="text-sm text-slate-500">Tuttofare totali</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-700" />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totaleRichieste}</p>
              <p className="text-sm text-slate-500">Richieste totali</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
              <BarChart3 className="h-5 w-5 text-sky-700" />
            </span>
            <div className="flex-1">
              <p className="text-2xl font-bold text-slate-900">{richiesteMeseSelezionato}</p>
              <p className="text-sm text-slate-500">Richieste mensili</p>
              <div className="mt-2">
                <select
                  value={meseSelezionato}
                  onChange={(e) => setMeseSelezionato(Number(e.target.value))}
                  className="rounded-md border border-slate-300 px-1.5 py-1 text-xs font-medium text-slate-700 focus:border-teal-600 focus:outline-none"
                >
                  {MESI_IT_LUNGHI.map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <TrendingUp className="h-5 w-5 text-indigo-700" />
            </span>
            <div className="flex-1">
              <p className="text-2xl font-bold text-slate-900">{richiesteAnnoSelezionato}</p>
              <p className="text-sm text-slate-500">Richieste annuali</p>
              <div className="mt-2">
                <select
                  value={annoSelezionatoCard}
                  onChange={(e) => setAnnoSelezionatoCard(Number(e.target.value))}
                  className="rounded-md border border-slate-300 px-1.5 py-1 text-xs font-medium text-slate-700 focus:border-teal-600 focus:outline-none"
                >
                  {anniDisponibili.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <Mail className="h-5 w-5 text-emerald-700" />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900">{clientiUnici.size}</p>
              <p className="text-sm text-slate-500">Clienti unici</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab switch */}
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab("richieste")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === "richieste"
              ? "border-teal-700 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Richieste per tuttofare
        </button>
        <button
          onClick={() => setTab("clienti")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === "clienti"
              ? "border-teal-700 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users className="h-4 w-4" />
          Contatti clienti
        </button>
        <button
          onClick={() => setTab("andamento")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === "andamento"
              ? "border-teal-700 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Andamento mensile
        </button>
        <button
          onClick={() => setTab("classifica")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === "classifica"
              ? "border-teal-700 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Trophy className="h-4 w-4" />
          Classifica
        </button>
        <button
          onClick={() => setTab("recensioni")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === "recensioni"
              ? "border-teal-700 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Star className="h-4 w-4" />
          Recensioni
        </button>
        <button
          onClick={() => setTab("abbonamenti")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === "abbonamenti"
              ? "border-teal-700 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Abbonamenti
        </button>
        <button
          onClick={() => setTab("risposta")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === "risposta"
              ? "border-teal-700 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Clock className="h-4 w-4" />
          Tasso di risposta
        </button>
        <button
          onClick={() => setTab("geografia")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === "geografia"
              ? "border-teal-700 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <MapPin className="h-4 w-4" />
          Geografia
        </button>
      </div>

      {tab === "richieste" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">Ordina per:</span>
            <button
              onClick={() => setOrdinamento("richieste")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                ordinamento === "richieste"
                  ? "bg-teal-700 text-white"
                  : "bg-white text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              }`}
            >
              Numero richieste
            </button>
            <button
              onClick={() => setOrdinamento("alfabetico")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                ordinamento === "alfabetico"
                  ? "bg-teal-700 text-white"
                  : "bg-white text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              }`}
            >
              Ordine alfabetico
            </button>
            <span className="ml-3 text-sm text-slate-500">Regione:</span>
            <select
              value={regioneFiltro}
              onChange={(e) => setRegioneFiltro(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            >
              <option value="Tutte">Tutte le regioni</option>
              {Array.from(new Set(stats.map((s) => cittaToRegione(s.profilo.citta ?? ""))))
                .sort((a, b) => a.localeCompare(b))
                .map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
            </select>
          </div>
          {stats.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Nessun tuttofare registrato.
            </p>
          ) : (
            [...stats]
              .filter((s) => regioneFiltro === "Tutte" || cittaToRegione(s.profilo.citta ?? "") === regioneFiltro)
              .sort((a, b) =>
                ordinamento === "alfabetico"
                  ? (a.profilo.nome ?? "").localeCompare(b.profilo.nome ?? "")
                  : b.count - a.count
              )
              .map((s) => (
              <div
                key={s.profilo.id}
                className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
              >
                <button
                  onClick={() => setExpanded(expanded === s.profilo.id ? null : s.profilo.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50"
                >
                  {expanded === s.profilo.id ? (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  )}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800">
                    {s.profilo.nome?.trim()?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      {s.profilo.nome || "(senza nome)"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.profilo.email} {s.profilo.citta ? `· ${s.profilo.citta}` : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                      s.profilo.stato === "Attivo"
                        ? "bg-emerald-100 text-emerald-800 ring-emerald-600/20"
                        : "bg-red-100 text-red-800 ring-red-600/20"
                    }`}
                  >
                    {s.profilo.stato ?? "—"}
                  </span>
                  <span className="ml-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                    {s.count} richieste
                  </span>
                </button>
                {expanded === s.profilo.id && (
                  <div className="border-t border-slate-100 bg-slate-50/50">
                    {s.richieste.length === 0 ? (
                      <p className="px-5 py-6 text-center text-sm text-slate-400">
                        Nessuna richiesta ricevuta.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {s.richieste.map((r) => (
                          <div key={r.id} className="px-5 py-4">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-slate-900">{r.nome_cliente}</p>
                              <span className="text-xs text-slate-400">
                                {fmtData(r.created_at)}
                              </span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" /> {r.email_cliente}
                              </span>
                              {r.telefono_cliente && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5" /> {r.telefono_cliente}
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                              {r.messaggio}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : tab === "clienti" ? (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          {clientiUnici.size === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              Nessun cliente ha ancora inviato richieste.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Telefono</th>
                  <th className="px-5 py-3">Tuttofare contattato</th>
                  <th className="px-5 py-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.from(clientiUnici.values()).map((r) => (
                  <tr key={r.id} className="text-sm transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{r.nome_cliente}</td>
                    <td className="px-5 py-3 text-slate-600">{r.email_cliente}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {r.telefono_cliente ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {r.nome_tuttofare ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{fmtData(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : tab === "andamento" ? (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Richieste mese per mese</h2>
          <p className="mb-6 text-sm text-slate-500">
            Andamento delle richieste di contatto ricevute da ogni tuttofare. Passa il mouse sulle barre per vedere il numero esatto.
          </p>
          <MeseChart stats={stats} />
        </div>
      ) : tab === "classifica" ? (
        <Classifica stats={stats} />
      ) : tab === "recensioni" ? (
        <RecensioniTab
          stats={stats}
          recensioni={recensioni}
          onDelete={eliminaRecensione}
        />
      ) : tab === "abbonamenti" ? (
        <AbbonamentiTab stats={stats} onToggle={toggleStato} />
      ) : tab === "risposta" ? (
        <TassoRispostaTab stats={stats} />
      ) : (
        <GeografiaTab stats={stats} />
      )}
    </div>
  );
}
