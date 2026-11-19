import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Wrench, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { inviaMessaggioContatto } from '../lib/profili';
import type { ProfiloTuttofare } from '../lib/types';

export default function ModuloContatto({ profilo }: { profilo: ProfiloTuttofare }) {
  const { id } = useParams();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [messaggio, setMessaggio] = useState('');
  const [invio, setInvio] = useState(false);
  const [inviato, setInviato] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrore(null);
    setInvio(true);
    try {
      await inviaMessaggioContatto({
        nome,
        email,
        messaggio,
        destinatario: profilo.email ?? '',
        profilo_id: id ?? profilo.id,
        profilo_nome: profilo.nome,
      });
      setInviato(true);
      setNome('');
      setEmail('');
      setMessaggio('');
    } catch {
      setErrore('Invio non riuscito. Controlla la connessione e riprova.');
    } finally {
      setInvio(false);
    }
  }

  if (inviato) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-5">
        <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-600" />
        <div>
          <p className="font-semibold text-emerald-800">Messaggio inviato!</p>
          <p className="mt-1 text-sm text-emerald-700">
            {profilo.nome} ti risponderà all'indirizzo email che hai indicato.
          </p>
          <button
            type="button"
            onClick={() => setInviato(false)}
            className="mt-3 text-sm font-semibold text-emerald-800 hover:underline"
          >
            Invia un altro messaggio
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contatto-nome" className="mb-1 block text-sm font-medium text-stone-700">
            Il tuo nome
          </label>
          <input
            id="contatto-nome"
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
            placeholder="Mario Bianchi"
          />
        </div>
        <div>
          <label htmlFor="contatto-email" className="mb-1 block text-sm font-medium text-stone-700">
            La tua email
          </label>
          <input
            id="contatto-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
            placeholder="tu@email.it"
          />
        </div>
      </div>
      <div>
        <label htmlFor="contatto-messaggio" className="mb-1 block text-sm font-medium text-stone-700">
          Messaggio
        </label>
        <textarea
          id="contatto-messaggio"
          required
          rows={4}
          value={messaggio}
          onChange={(e) => setMessaggio(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
          placeholder={`Descrivi il lavoro che vuoi affidare a ${profilo.nome}…`}
        />
      </div>

      {errore && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{errore}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={invio}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {invio ? 'Invio in corso…' : 'Invia messaggio'}
      </button>
    </form>
  );
}
