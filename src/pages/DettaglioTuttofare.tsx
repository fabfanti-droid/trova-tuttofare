import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Wrench, Mail, Phone, AlertTriangle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { regioneDaCitta } from '../lib/regioni';
import ModuloContatto from './ModuloContatto';
import type { ProfiloTuttofare } from '../lib/types';

const LINK_RIATTIVAZIONE = 'https://fabfanti.systeme.io/31b4ebe8';

export default function DettaglioTuttofare() {
  const { id } = useParams<{ id: string }>();
  const [profilo, setProfilo] = useState<ProfiloTuttofare | null>(null);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let attivo = true;
    supabase
      .from('profili_tuttofare')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!attivo) return;
        if (error) {
          setErrore('Impossibile caricare il profilo. Riprova più tardi.');
        } else if (!data) {
          setErrore('Profilo non trovato.');
        } else {
          setProfilo(data);
        }
        setCaricamento(false);
      });
    return () => {
      attivo = false;
    };
  }, [id]);

  if (caricamento) {
    return <p className="py-16 text-center text-stone-500">Caricamento profilo…</p>;
  }

  if (errore || !profilo) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="rounded-lg bg-red-50 p-4 text-red-700">{errore ?? 'Profilo non trovato.'}</p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center gap-2 font-semibold text-amber-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alla home
        </Link>
      </div>
    );
  }

  const scaduto = profilo.stato_abbonamento === 'Scaduto';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-stone-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Torna alla home
      </Link>

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">{profilo.nome}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-stone-500">
              <MapPin className="h-4 w-4" />
              {profilo.citta ?? 'Città non specificata'} · {regioneDaCitta(profilo.citta)}
            </p>
          </div>
          <span
            className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-semibold ${
              scaduto ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {scaduto ? 'Abbonamento scaduto' : 'Abbonamento attivo'}
          </span>
        </div>

        {profilo.descrizione && (
          <p className="mt-5 leading-relaxed text-stone-700">{profilo.descrizione}</p>
        )}

        {profilo.categorie.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {profilo.categorie.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800"
              >
                <Wrench className="h-3.5 w-3.5" />
                {cat}
              </span>
            ))}
          </div>
        )}

        {(profilo.email || profilo.telefono) && !scaduto && (
          <div className="mt-6 flex flex-wrap gap-6 border-t border-stone-200 pt-5 text-sm text-stone-600">
            {profilo.email && (
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-stone-400" />
                {profilo.email}
              </span>
            )}
            {profilo.telefono && (
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-stone-400" />
                {profilo.telefono}
              </span>
            )}
          </div>
        )}

        {scaduto && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">Abbonamento scaduto</p>
                <p className="mt-1 text-sm leading-relaxed text-red-700">
                  Il profilo di {profilo.nome} non è attualmente visibile nella directory perché
                  l'abbonamento è scaduto. Se sei il proprietario di questo profilo, puoi riattivarlo
                  subito.
                </p>
                <a
                  href={LINK_RIATTIVAZIONE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block rounded-lg bg-red-600 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/40"
                >
                  Riattiva abbonamento
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {!scaduto && (
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-stone-900">Contatta {profilo.nome}</h2>
          <p className="mt-1 text-sm text-stone-500">
            Descrivi il tuo progetto: ti risponderà direttamente via email.
          </p>
          <div className="mt-6">
            <ModuloContatto profilo={profilo} />
          </div>
        </div>
      )}
    </div>
  );
}
