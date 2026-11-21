// Mappatura principali città/province italiane → regione.
// Se la città non viene riconosciuta, il fallback è "Altre località / Da assegnare".

const CITTA_REGIONE: Record<string, string> = {
  // Piemonte
  torino: "Piemonte", novara: "Piemonte", alessandria: "Piemonte",
  asti: "Piemonte", cuneo: "Piemonte", biella: "Piemonte", vercelli: "Piemonte",
  verbania: "Piemonte", ivrea: "Piemonte", moncalieri: "Piemonte",
  rivoli: "Piemonte", collegno: "Piemonte", nichelino: "Piemonte", pinerolo: "Piemonte",
  // Lombardia
  milano: "Lombardia", bergamo: "Lombardia", brescia: "Lombardia", como: "Lombardia",
  crema: "Lombardia", cremona: "Lombardia", lecco: "Lombardia", lodi: "Lombardia",
  mantova: "Lombardia", pavia: "Lombardia", sondrio: "Lombardia", varese: "Lombardia",
  monza: "Lombardia", "sesto san giovanni": "Lombardia", cinisello: "Lombardia",
  legnano: "Lombardia", rho: "Lombardia", gallarate: "Lombardia",
  "busto arsizio": "Lombardia", desio: "Lombardia",
  // Veneto
  venezia: "Veneto", verona: "Veneto", padova: "Veneto", vicenza: "Veneto",
  treviso: "Veneto", belluno: "Veneto", rovigo: "Veneto", mestre: "Veneto",
  bassano: "Veneto", schio: "Veneto", valdagno: "Veneto", cittadella: "Veneto",
  // Friuli-Venezia Giulia
  trieste: "Friuli-Venezia Giulia", udine: "Friuli-Venezia Giulia",
  gorizia: "Friuli-Venezia Giulia", pordenone: "Friuli-Venezia Giulia",
  monfalcone: "Friuli-Venezia Giulia",
  // Liguria
  genova: "Liguria", savona: "Liguria", imperia: "Liguria",
  "la spezia": "Liguria", rapallo: "Liguria", chiavari: "Liguria",
  // Emilia-Romagna
  bologna: "Emilia-Romagna", parma: "Emilia-Romagna", modena: "Emilia-Romagna",
  "reggio emilia": "Emilia-Romagna", ferrara: "Emilia-Romagna", ravenna: "Emilia-Romagna",
  forli: "Emilia-Romagna", "forlì": "Emilia-Romagna", cesena: "Emilia-Romagna",
  rimini: "Emilia-Romagna", piacenza: "Emilia-Romagna", imola: "Emilia-Romagna",
  faenza: "Emilia-Romagna",
  // Toscana
  firenze: "Toscana", pisa: "Toscana", siena: "Toscana", arezzo: "Toscana",
  pistoia: "Toscana", prato: "Toscana", livorno: "Toscana", lucca: "Toscana",
  grosseto: "Toscana", massa: "Toscana", carrara: "Toscana", empoli: "Toscana",
  // Umbria
  perugia: "Umbria", terni: "Umbria", foligno: "Umbria", spoleto: "Umbria",
  // Marche
  ancona: "Marche", pesaro: "Marche", urbino: "Marche", fano: "Marche",
  "ascoli piceno": "Marche", macerata: "Marche", fermo: "Marche", jesi: "Marche",
  // Lazio
  roma: "Lazio", latina: "Lazio", frosinone: "Lazio",
  rieti: "Lazio", viterbo: "Lazio", civitavecchia: "Lazio",
  guidonia: "Lazio", palestrina: "Lazio", tivoli: "Lazio", fiumicino: "Lazio",
  // Abruzzo
  "l'aquila": "Abruzzo", aquila: "Abruzzo", pescara: "Abruzzo", chieti: "Abruzzo",
  teramo: "Abruzzo", vasto: "Abruzzo", sulmona: "Abruzzo",
  lanciano: "Abruzzo", ortona: "Abruzzo", giulianova: "Abruzzo",
  atripalda: "Abruzzo", penne: "Abruzzo", roccaraso: "Abruzzo",
  avezzano: "Abruzzo", francavilla: "Abruzzo",
  // Molise
  campobasso: "Molise", isernia: "Molise", termoli: "Molise",
  // Campania
  napoli: "Campania", salerno: "Campania", caserta: "Campania", benevento: "Campania",
  avellino: "Campania", pompei: "Campania", portici: "Campania",
  giugliano: "Campania", ercolano: "Campania", "castellammare di stabia": "Campania",
  // Puglia
  bari: "Puglia", brindisi: "Puglia", foggia: "Puglia", lecce: "Puglia",
  taranto: "Puglia", barletta: "Puglia", andria: "Puglia", trani: "Puglia",
  ostuni: "Puglia", monopoli: "Puglia", altamura: "Puglia",
  // Basilicata
  potenza: "Basilicata", matera: "Basilicata", melfi: "Basilicata",
  // Calabria
  catanzaro: "Calabria", "reggio calabria": "Calabria", cosenza: "Calabria",
  crotone: "Calabria", "vibo valentia": "Calabria", lamezia: "Calabria",
  // Sicilia
  palermo: "Sicilia", catania: "Sicilia", messina: "Sicilia", siracusa: "Sicilia",
  agrigento: "Sicilia", trapani: "Sicilia", caltanissetta: "Sicilia", enna: "Sicilia",
  ragusa: "Sicilia", gela: "Sicilia", bagheria: "Sicilia",
  // Sardegna
  cagliari: "Sardegna", sassari: "Sardegna", nuoro: "Sardegna", oristano: "Sardegna",
  olbia: "Sardegna", alghero: "Sardegna", "quartu sant'elenia": "Sardegna",
  // Trentino-Alto Adige
  trento: "Trentino-Alto Adige", bolzano: "Trentino-Alto Adige",
  rovereto: "Trentino-Alto Adige", merano: "Trentino-Alto Adige",
  bressanone: "Trentino-Alto Adige", brunico: "Trentino-Alto Adige",
  // Valle d'Aosta
  aosta: "Valle d'Aosta", courmayeur: "Valle d'Aosta",
};

export const FALLBACK_REGIONE = "Altre località / Da assegnare";

export function cittaToRegione(citta: string | null | undefined): string {
  if (!citta) return FALLBACK_REGIONE;
  const key = citta.trim().toLowerCase();
  if (CITTA_REGIONE[key]) return CITTA_REGIONE[key];
  for (const c of Object.keys(CITTA_REGIONE)) {
    if (key.startsWith(c) || key.includes(c)) return CITTA_REGIONE[c];
  }
  return FALLBACK_REGIONE;
}

export const REGIONI_ORDER = [
  "Piemonte", "Valle d'Aosta", "Lombardia", "Trentino-Alto Adige", "Veneto",
  "Friuli-Venezia Giulia", "Liguria", "Emilia-Romagna", "Toscana", "Umbria",
  "Marche", "Lazio", "Abruzzo", "Molise", "Campania", "Puglia", "Basilicata",
  "Calabria", "Sicilia", "Sardegna", FALLBACK_REGIONE,
];
