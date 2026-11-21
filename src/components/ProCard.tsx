import { useEffect, useState } from "react";
import { MapPin, Star } from "lucide-react";
import { supabase, type ProfiloTuttofare, type Recensione } from "@/lib/supabase";

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

export function ProCard({
  profilo,
  onContact,
  onApri,
}: {
  profilo: ProfiloTuttofare;
  onContact: (p: ProfiloTuttofare) => void;
  onApri: (p: ProfiloTuttofare) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [recensioni, setRecensioni] = useState<Recensione[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("recensioni")
        .select("*")
        .eq("tuttofare_id", profilo.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (data) setRecensioni(data as Recensione[]);
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

  return (
    <div
      onClick={() => onApri(profilo)}
      className="group flex cursor-pointer flex-col rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:ring-teal-600/30">
      <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-teal-800 to-slate-900">
        {profilo.foto_url && !imgError ? (
          <img
            src={profilo.foto_url}
            alt={profilo.nome ?? "Tuttofare"}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-4xl font-semibold text-white ring-2 ring-white/25 backdrop-blur-sm">
              {iniziale}
            </span>
          </div>
        )}
        <span className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-emerald-500/95 px-3 py-1 text-xs font-semibold text-white shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          Disponibile
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{profilo.nome}</h3>
          {profilo.citta && (
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-4 w-4 text-teal-700" />
              {profilo.citta}
            </p>
          )}
        </div>
        {servizi.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {servizi.map((s) => (
              <span
                key={s}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${serviceColor(s)}`}
              >
                {s}
              </span>
            ))}
          </div>
        )}
        {profilo.descrizione && (
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
            {profilo.descrizione}
          </p>
        )}
        {recensioni.length > 0 && (
          <div className="space-y-2 rounded-lg bg-amber-50/60 p-3 ring-1 ring-amber-100">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-3.5 w-3.5 ${
                      n <= Math.round(mediaVoto)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-slate-200 text-slate-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-700">
                {mediaVoto.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400">({recensioni.length} recensioni)</span>
            </div>
            {recensioni[0]?.testo && (
              <p className="line-clamp-2 text-xs italic text-slate-500">
                "{recensioni[0].testo}"
              </p>
            )}
          </div>
        )}
        <div className="mt-auto pt-3 text-center">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700">
            Clicca per vedere il profilo
          </span>
        </div>
      </div>
    </div>
  );
}
