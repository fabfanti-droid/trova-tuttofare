import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Wrench, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { regioneDaCitta } from '../lib/regioni';
import type { ProfiloTuttofare } from '../lib/types';

export default function Home() {
  const [profili, setProfili] = useState<ProfiloTuttofare[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);
  const [ricerca, setRicerca] = useState('');

  useEffect(() => {
    supabase
      .from('profili_tuttofare')
      .select('*')
      .eq('stato_abbonamento', 'Attivo')
      .order('nome')
      .then(({ data, error }) => {
        if (error) {
          setErrore('Impossibile caricare i profili. Riprova più tardi.');
        } else {
          setProfili(data ?? []);
        }
        setCaricamento(false);
      });
  }, []);

  const profiliFiltrati = profili.filter((p) => {
    const q = ricerca.trim().toLowerCase();
    if (!q) return true;
    return (
      p.nome.toLowerCase().includes(q) ||
      (p.citta ?? '').toLowerCase().includes(q) ||
      regioneDaCitta(p.citta).toLowerCase().includes(q) ||
      p.categorie.some((c) => c.toLowerCase().includes(q))
    );
  });

  const categorie = Array.from(new Set(profili.flatMap((p) => p.categorie))).sort();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Trova il tuttofare giusto per te
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-stone-600">
          Professionisti verificati per piccoli lavori di casa, in tutta Italia.
        </p>
        <div className="relative mx-auto mt-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={ricerca}
            onChange={(e) => setRicerca(e.target.value)}
            placeholder="Cerca per nome, città o categoria…"
            className="w-full rounded-full border border-stone-300 bg-white py-3 pl-11 pr-4 text-stone-900 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
          />
        </div>
      </section>

      {caricamento && <p className="py-16 text-center text-stone-500">Caricamento profili…</p>}

      {errore && (
        <p className="mx-auto max-w-lg rounded-lg bg-red-50 p-4 text-center text-red-700">{errore}</p>
      )}

      {!caricamento && !errore && profiliFiltrati.length === 0 && (
        <p className="py-16 text-center text-stone-500">Nessun profilo trovato per la tua ricerca.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {profiliFiltrati.map((profilo) => (
          <article
            key={profilo.id}
            className="flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-stone-900">{profilo.nome}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
              <MapPin className="h-4 w-4" />
              {profilo.citta ?? 'Non specificata'} · {regioneDaCitta(profilo.citta)}
            </p>
            <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-stone-600">
              {profilo.descrizione ?? 'Nessuna descrizione disponibile.'}
            </p>
            {profilo.categorie.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {profilo.categorie.slice(0, 3).map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
                  >
                    <Wrench className="h-3 w-3" />
                    {cat}
                  </span>
                ))}
              </div>
            )}
            <Link
              to={`/tuttofare/${profilo.id}`}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700"
            >
              Vedi dettaglio e contatta
            </Link>
          </article>
        ))}
      </div>

      {categorie.length > 0 && (
        <section className="mt-14 rounded-2xl bg-stone-100 p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Categorie disponibili
          </h3>
          <div className="flex flex-wrap gap-2">
            {categorie.map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-white px-3 py-1.5 text-sm text-stone-700 shadow-sm"
              >
                {cat}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
