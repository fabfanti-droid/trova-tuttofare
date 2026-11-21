import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Upload,
  ImageIcon,
  RefreshCw,
  Mail,
  MailCheck,
  Copy,
  Star,
  Inbox,
} from "lucide-react";
import {
  supabase,
  uploadFotoProfilo,
  type ProfiloTuttofare,
  type RichiestaContatto,
} from "@/lib/supabase";
import { PhotoCropModal } from "@/components/PhotoCropModal";

const RIATTIVA_URL = "https://fabfanti.systeme.io/31b4ebe8";

function Avatar({
  url,
  nome,
  className,
}: {
  url: string | null;
  nome: string | null;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const iniziale = nome?.trim()?.[0]?.toUpperCase() ?? "?";
  if (url && !imgError) {
    return (
      <img
        src={url}
        alt={nome ?? "Foto profilo"}
        onError={() => setImgError(true)}
        className={className}
      />
    );
  }
  return (
    <span
      className={`flex items-center justify-center bg-teal-100 font-semibold text-teal-800 ${className}`}
    >
      {iniziale}
    </span>
  );
}

export function ProfilePage({
  session,
  onLogout,
}: {
  session: { userId: string; email: string };
  onLogout: () => void;
}) {
  const [profilo, setProfilo] = useState<ProfiloTuttofare | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fotoError, setFotoError] = useState(false);
  const [queryError, setQueryError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [richieste, setRichieste] = useState<RichiestaContatto[]>([]);
  const [richiesteLoading, setRichiesteLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let row: ProfiloTuttofare | null = null;
      let failed = false;
      const byId = await supabase
        .from("profili_tuttofare")
        .select("*")
        .eq("id", session.userId)
        .maybeSingle();
      if (byId.error) {
        console.error(byId.error);
        failed = true;
      } else {
        row = byId.data;
      }
      if (!row && !failed) {
        const byEmail = await supabase
          .from("profili_tuttofare")
          .select("*")
          .eq("email", session.email)
          .maybeSingle();
        if (byEmail.error) {
          console.error(byEmail.error);
          failed = true;
        } else {
          row = byEmail.data;
        }
      }
      if (!cancelled) {
        setQueryError(failed);
        setProfilo(row);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session.userId, session.email]);

  const caricaRichieste = async () => {
    setRichiesteLoading(true);
    const { data, error } = await supabase
      .from("richieste_contatto")
      .select("*")
      .or(`tuttofare_id.eq.${session.userId},email_tuttofare.eq.${session.email}`)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setRichieste(data as RichiestaContatto[]);
    }
    setRichiesteLoading(false);
  };

  useEffect(() => {
    if (profilo) caricaRichieste();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilo?.id]);

  const segnaRisposta = async (id: string) => {
    setMarkingId(id);
    const token = crypto.randomUUID();
    const { error } = await supabase
      .from("richieste_contatto")
      .update({ risposta_inviata: true, token_recensione: token })
      .eq("id", id);
    setMarkingId(null);
    if (!error) {
      setRichieste((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, risposta_inviata: true, token_recensione: token } : r
        )
      );
    }
  };

  const copiaLink = async (r: RichiestaContatto) => {
    const link = `${window.location.origin}${window.location.pathname}#recensione=${r.token_recensione}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(r.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback: select text prompt
      window.prompt("Copia questo link e invialo al cliente:", link);
    }
  };

  const attivo = profilo?.stato === "Attivo";
  const set = (field: keyof ProfiloTuttofare, value: string) => {
    setProfilo((p) => (p ? { ...p, [field]: value } : p));
    setSaved(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    e.target.value = "";
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    setPendingFile(null);
    if (!profilo) return;
    setUploading(true);
    setFotoError(false);
    const { url, error } = await uploadFotoProfilo(profilo.id, croppedBlob);
    setUploading(false);
    if (error) {
      setSaveError("Errore durante il caricamento della foto. Riprova.");
    } else if (url) {
      set("foto_url", url);
      setSaving(true);
      setSaveError(null);
      const { error: uErr } = await supabase
        .from("profili_tuttofare")
        .update({ foto_url: url })
        .eq("id", profilo.id);
      setSaving(false);
      if (uErr) setSaveError("Foto caricata ma non salvata nel profilo. Riprova a salvare.");
    }
  };

  const salva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profilo || !attivo || saving) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    const { error } = await supabase
      .from("profili_tuttofare")
      .update({
        nome: profilo.nome,
        citta: profilo.citta,
        servizi: profilo.servizi,
        descrizione: profilo.descrizione,
        foto_url: profilo.foto_url,
      })
      .eq("id", profilo.id);
    setSaving(false);
    if (error) {
      setSaveError("Errore durante il salvataggio. Riprova.");
    } else {
      setSaved(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
      </div>
    );
  }

  if (!profilo) {
    return queryError ? (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-7 w-7 text-red-600" />
          </span>
          <h2 className="text-lg font-semibold text-slate-900">Errore di caricamento</h2>
          <p className="mt-2 text-sm text-slate-500">
            Non è stato possibile leggere il profilo dal database. Ricarica la pagina.
          </p>
        </div>
      </div>
    ) : (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="h-7 w-7 text-amber-600" />
          </span>
          <h2 className="text-lg font-semibold text-slate-900">Profilo non trovato</h2>
          <p className="mt-2 text-sm text-slate-500">
            Nessun profilo associato a questo account. Contatta l'amministratore per la creazione
            del profilo.
          </p>
        </div>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50 disabled:text-slate-400";
  const labelCls = "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <div className="bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        {!attivo && (
          <div className="rounded-xl bg-red-50 p-5 ring-1 ring-red-600/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="font-semibold text-red-800">Abbonamento scaduto</p>
                <p className="mt-0.5 text-sm text-red-700">
                  Il tuo abbonamento risulta scaduto. Il tuo profilo non è più visibile nella
                  vetrina e le modifiche sono bloccate. Riattiva ora per tornare online.
                </p>
                <a
                  href={RIATTIVA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Riattiva abbonamento
                </a>
              </div>
            </div>
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-600/20">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <p className="font-medium text-emerald-800">Profilo salvato con successo!</p>
          </div>
        )}
        {saveError && (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 ring-1 ring-red-600/20">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            <p className="font-medium text-red-800">{saveError}</p>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="h-24 bg-gradient-to-r from-teal-800 to-teal-600" />
          <div className="flex items-end gap-4 px-6 pb-6 -mt-10">
            <Avatar
              url={fotoError ? null : profilo.foto_url}
              nome={profilo.nome}
              className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white shadow-md"
            />
            <div className="pb-1">
              <h1 className="text-xl font-bold text-slate-900">
                {profilo.nome || "Il Mio Profilo"}
              </h1>
              <p className="text-sm text-slate-500">{session.email}</p>
            </div>
            <span
              className={`ml-auto mb-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                attivo
                  ? "bg-emerald-100 text-emerald-800 ring-emerald-600/20"
                  : "bg-red-100 text-red-800 ring-red-600/20"
              }`}
            >
              {attivo ? "Abbonamento attivo" : "Abbonamento scaduto"}
            </span>
          </div>
        </div>

        <form
          onSubmit={salva}
          className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <fieldset disabled={!attivo} className="space-y-5 disabled:opacity-60">
            <div>
              <label htmlFor="p-nome" className={labelCls}>
                Nome completo o Ditta
              </label>
              <input
                id="p-nome"
                value={profilo.nome ?? ""}
                onChange={(e) => set("nome", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="p-citta" className={labelCls}>
                Città in cui opera
              </label>
              <input
                id="p-citta"
                value={profilo.citta ?? ""}
                onChange={(e) => set("citta", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="p-servizi" className={labelCls}>
                Servizi offerti
              </label>
              <input
                id="p-servizi"
                value={profilo.servizi ?? ""}
                onChange={(e) => set("servizi", e.target.value)}
                className={inputCls}
                placeholder="Idraulica, Elettricità, Montaggio mobili"
              />
              <p className="mt-1.5 text-xs text-slate-400">Separa i servizi con una virgola.</p>
            </div>
            <div>
              <label htmlFor="p-desc" className={labelCls}>
                Descrizione attività
              </label>
              <textarea
                id="p-desc"
                rows={4}
                value={profilo.descrizione ?? ""}
                onChange={(e) => set("descrizione", e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className={labelCls}>Foto profilo</label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    disabled={!attivo || uploading}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={!attivo || uploading}
                    className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploading ? "Caricamento..." : "Carica una foto"}
                  </button>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Formati: JPG, PNG. La foto verrà caricata automaticamente.
                  </p>
                </div>
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
                  {profilo.foto_url && !fotoError ? (
                    <img
                      src={profilo.foto_url}
                      alt="Anteprima"
                      onError={() => setFotoError(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-slate-300" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={!attivo || saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Salvataggio..." : "Salva modifiche"}
            </button>
          </fieldset>
        </form>

        <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-teal-700" />
            <h2 className="text-lg font-semibold text-slate-900">Richieste ricevute</h2>
          </div>
          <p className="text-sm text-slate-500">
            Quando rispondi a un cliente, segna la richiesta come "Risposta inviata" per generare un
            link di recensione da condividere con lui.
          </p>

          {richiesteLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-teal-700" />
            </div>
          ) : richieste.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-400">
              Nessuna richiesta ricevuta per ora.
            </div>
          ) : (
            <ul className="space-y-3">
              {richieste.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-slate-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{r.nome_cliente}</p>
                        <a
                          href={`mailto:${r.email_cliente}`}
                          className="text-xs text-teal-700 hover:underline"
                        >
                          {r.email_cliente}
                        </a>
                        {r.telefono_cliente && (
                          <span className="text-xs text-slate-400">· {r.telefono_cliente}</span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.messaggio}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(r.created_at).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {r.risposta_inviata ? (
                        <>
                          <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                            <MailCheck className="h-3.5 w-3.5" /> Risposto
                          </span>
                          {r.token_recensione && (
                            <button
                              onClick={() => copiaLink(r)}
                              className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-800"
                            >
                              {copiedId === r.id ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Copiato!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" /> Link recensione
                                </>
                              )}
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => segnaRisposta(r.id)}
                          disabled={markingId === r.id}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                        >
                          {markingId === r.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Mail className="h-3.5 w-3.5" />
                          )}
                          Segna come risposto
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {pendingFile && (
        <PhotoCropModal
          file={pendingFile}
          onCancel={() => setPendingFile(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
