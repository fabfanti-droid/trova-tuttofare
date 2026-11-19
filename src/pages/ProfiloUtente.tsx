import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hammer, AlertCircle, AlertTriangle, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useProfiloUtente, aggiornaProfilo } from '../lib/profili';
import type { ProfiloTuttofare } from '../lib/types';

const LINK_RIATTIVAZIONE = 'https://fabfanti.systeme.io/31b4ebe8';

export default function ProfiloUtente() {
  const { user, caricamento: caricamentoAuth } = useAuth();
  const { profilo, caricamento } = useProfiloUtente(user?.id);
  const navigate = useNavigate();
  const [modifiche, setModifiche] = useState<Partial<ProfiloTuttofare>>({});
  const [salvataggio, setSalvataggio] = useState(false);
  const [salvato, setSalvato] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  if (caricamentoAuth || caricamento) {
    return <p className="py-16 text-center text-stone-500">Caricamento profilo…</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-stone-600">Accedi per gestire il tuo profilo.</p>
        <Link to="/accedi" className="mt-4 inline-block font-semibold text-amber-700 hover:underline">
          Vai al login
        </Link>
      </div>
    );
  }

  if (!profilo) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-stone-600">
          Non hai ancora un profilo pubblico di tuttofare. Contatta l'amministratore per attivarne uno.
        </p>
        <Link to="/" className="mt-4 inline-block font-semibold text-amber-700 hover:underline">
          Torna alla home
        </Link>
      </div>
    );
  }

  const scaduto = profilo.stato_abbonamento === 'Scaduto';

  const campo = (k: keyof ProfiloTuttofare) => modifiche[k] ?? (profilo[k] as string) ?? '';

  async function handleSalva(e: FormEvent) {
    e.preventDefault();
    setErrore(null);
    setSalvato(false);
    setSalvataggio(true);
    try {
      const aggiornato = await aggiornaProfilo(profilo!.id, modifiche);
      if (aggiornato) {
        setModifiche({});
        setSalvato(true);
      }
    } catch {
      setErrore('Salvataggio non riuscito. Riprova.');
    } finally {
      setSalvataggio(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-stone-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Torna alla home
      </Link>

      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-stone-900">
          <Hammer className="h-6 w-6 text-amber-600" />
          Il mio profilo
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            scaduto ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {scaduto ? 'Abbonamento scaduto' : 'Abbonamento attivo'}
        </span>
      </div>

      {scaduto && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Il tuo abbonamento è scaduto</p>
              <p className="mt-1 text-sm leading-relaxed text-red-700">
                Il tuo profilo non è più visibile nella directory. Per tornare online, riattiva il tuo
                abbonamento: bastano pochi minuti.
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

      <form
        onSubmit={handleSalva}
        className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="p-nome" className="mb-1 block text-sm font-medium text-stone-700">
              Nome
            </label>
            <input
              id="p-nome"
              type="text"
              value={campo('nome')}
              onChange={(e) => setModifiche((m) => ({ ...m, nome: e.target.value }))}
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
            />
          </div>
          <div>
            <label htmlFor="p-citta" className="mb-1 block text-sm font-medium text-stone-700">
              Città
            </label>
            <input
              id="p-citta"
              type="text"
              value={campo('citta')}
              onChange={(e) => setModifiche((m) => ({ ...m, citta: e.target.value }))}
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
            />
          </div>
          <div>
            <label htmlFor="p-email" className="mb-1 block text-sm font-medium text-stone-700">
              Email di contatto
            </label>
            <input
              id="p-email"
              type="email"
              value={campo('email')}
              onChange={(e) => setModifiche((m) => ({ ...m, email: e.target.value }))}
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
            />
          </div>
          <div>
            <label htmlFor="p-telefono" className="mb-1 block text-sm font-medium text-stone-700">
              Telefono
            </label>
            <input
              id="p-telefono"
              type="tel"
              value={campo('telefono')}
              onChange={(e) => setModifiche((m) => ({ ...m, telefono: e.target.value }))}
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
            />
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="p-descrizione" className="mb-1 block text-sm font-medium text-stone-700">
            Descrizione
          </label>
          <textarea
            id="p-descrizione"
            rows={4}
            value={campo('descrizione')}
            onChange={(e) => setModifiche((m) => ({ ...m, descrizione: e.target.value }))}
            className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
          />
        </div>

        {errore && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{errore}</span>
          </div>
        )}
        {salvato && (
          <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            Profilo aggiornato con successo.
          </p>
        )}

        <button
          type="submit"
          disabled={salvataggio || Object.keys(modifiche).length === 0}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {salvataggio ? 'Salvataggio…' : 'Salva modifiche'}
        </button>
      </form>
    </div>
  );
}
