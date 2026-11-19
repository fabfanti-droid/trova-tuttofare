import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
import { raggruppaPerRegione, ORDINE_REGIONI, REGIONE_FALLBACK } from '../lib/regioni';
import { useProfiliPubblici } from '../hooks/useProfiliPubblici';
import type { ProfiloTuttofare } from '../lib/types';

function CardProfilo({ profilo }: { profilo: ProfiloTuttofare }) {
  return (
    <Link
      to={`/tuttofare/${profilo.id}`}
      className="block rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
    >
      <h3 className="font-semibold text-stone-900">{profilo.nome}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
        <MapPin className="h-4 w-4" />
        {profilo.citta ?? 'Non specificata'}
      </p>
      {profilo.categorie.length > 0 && (
        <p className="mt-2 line-clamp-1 text-sm text-stone-600">{profilo.categorie.join(' · ')}</p>
      )}
    </Link>
  );
}

export default function ProfiliPerRegione() {
  const { profili, caricamento, errore } = useProfiliPubblici();
  const [ricerca, setRicerca] = useState('');
  const [regioneSelezionata, setRegioneSelezionata] = useState<string>('tutte');

  const gruppi = useMemo(() => raggruppaPerRegione(profili), [profili]);

  const nomiRegioni = useMemo(() => {
    const presenti = Array.from(gruppi.keys());
    return [...presenti].sort((a, b) => {
      const ia = ORDINE_REGIONI.indexOf(a);
      const ib = ORDINE_REGIONI.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [gruppi]);

  const profiliFiltrati = useMemo(() => {
    const q = ricerca.trim().toLowerCase();
    return profili.filter((p) => {
      const inRegione =
        regioneSelezionata === 'tutte' || raggruppaPerRegione([p]).has(regioneSelezionata);
      const inRicerca =
        !q ||
        p.nome.toLowerCase().includes(q) ||
        (p.citta ?? '').toLowerCase().includes(q) ||
        p.categorie.some((c) => c.toLowerCase().includes(q));
      return inRegione && inRicerca;
    });
  }, [profili, ricerca, regioneSelezionata]);

  const gruppiFiltrati = useMemo(() => raggruppaPerRegione(profiliFiltrati), [profiliFiltrati]);

  if (caricamento) {
    return <p className="py-16 text-center text-stone-500">Caricamento profili…</p>;
  }

  if (errore) {
    return (
      <p className="mx-auto my-16 max-w-lg rounded-lg bg-red-50 p-4 text-center text-red-700">{errore}</p>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">Profili per Regione</h1>
      <p className="mt-2 max-w-2xl text-stone-600">
        Sfoglia i tuttofare attivi organizzati per regione italiana.
      </p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={ricerca}
            onChange={(e) => setRicerca(e.target.value)}
            placeholder="Cerca per nome, città o categoria…"
            className="w-full rounded-full border border-stone-300 bg-white py-2.5 pl-11 pr-4 text-stone-900 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
          />
        </div>
        <select
          value={regioneSelezionata}
          onChange={(e) => setRegioneSelezionata(e.target.value)}
          className="rounded-full border border-stone-300 bg-white px-4 py-2.5 text-stone-900 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
        >
          <option value="tutte">Tutte le regioni</option>
          {nomiRegioni.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {gruppiFiltrati.size === 0 && (
        <p className="py-16 text-center text-stone-500">Nessun profilo trovato.</p>
      )}

      <div className="mt-8 space-y-10">
        {Array.from(gruppiFiltrati.entries()).map(([regione, lista]) => (
          <section key={regione}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-xl font-bold text-stone-900">{regione}</h2>
              <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
                {lista.length} {lista.length === 1 ? 'profilo' : 'profili'}
              </span>
            </div>
            {regione === REGIONE_FALLBACK && (
              <p className="mb-3 text-sm text-stone-500">
                Questi profili non hanno ancora una regione assegnata.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lista.map((p) => (
                <CardProfilo key={p.id} profilo={p} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
