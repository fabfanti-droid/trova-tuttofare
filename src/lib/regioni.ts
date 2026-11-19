import type { ProfiloTuttofare } from './types';

const CITTA_REGIONE: Record<string, string> = {
  // Nord-Ovest
  torino: 'Piemonte',
  'moncalieri': 'Piemonte',
  novara: 'Piemonte',
  alessandria: 'Piemonte',
  asti: 'Piemonte',
  cuneo: 'Piemonte',
  milano: 'Lombardia',
  bergamo: 'Lombardia',
  brescia: 'Lombardia',
  monza: 'Lombardia',
  como: 'Lombardia',
  varese: 'Lombardia',
  'sesto san giovanni': 'Lombardia',
  genova: 'Liguria',
  'la spezia': 'Liguria',
  savona: 'Liguria',
  imperia: 'Liguria',
  aosta: "Valle d'Aosta",
  // Nord-Est
  venezia: 'Veneto',
  verona: 'Veneto',
  padova: 'Veneto',
  vicenza: 'Veneto',
  treviso: 'Veneto',
  belluno: 'Veneto',
  udine: 'Friuli-Venezia Giulia',
  trieste: 'Friuli-Venezia Giulia',
  pordenone: 'Friuli-Venezia Giulia',
  gorizia: 'Friuli-Venezia Giulia',
  trento: 'Trentino-Alto Adige',
  bolzano: 'Trentino-Alto Adige',
  bologna: 'Emilia-Romagna',
  parma: 'Emilia-Romagna',
  modena: 'Emilia-Romagna',
  "reggio nell'emilia": 'Emilia-Romagna',
  "reggio emilia": 'Emilia-Romagna',
  piacenza: 'Emilia-Romagna',
  rimini: 'Emilia-Romagna',
  ravenna: 'Emilia-Romagna',
  ferrara: 'Emilia-Romagna',
  forli: 'Emilia-Romagna',
  'forlì': 'Emilia-Romagna',
  cesena: 'Emilia-Romagna',
  // Centro
  roma: 'Lazio',
  latina: 'Lazio',
  guidonia: 'Lazio',
  fiumicino: 'Lazio',
  viterbo: 'Lazio',
  firenze: 'Toscana',
  prato: 'Toscana',
  livorno: 'Toscana',
  arezzo: 'Toscana',
  pisa: 'Toscana',
  pistoia: 'Toscana',
  lucca: 'Toscana',
  siena: 'Toscana',
  'massa': 'Toscana',
  ancona: 'Marche',
  pesaro: 'Marche',
  macerata: 'Marche',
  'ascoli piceno': 'Marche',
  perugia: 'Umbria',
  terni: 'Umbria',
  'Assisi': 'Umbria',
  // Centro-Sud
  'l\'aquila': 'Abruzzo',
  pescara: 'Abruzzo',
  chieti: 'Abruzzo',
  teramo: 'Abruzzo',
  'campobasso': 'Molise',
  isernia: 'Molise',
  'napoli': 'Campania',
  salerno: 'Campania',
  'giugliano in campania': 'Campania',
  'torre del greco': 'Campania',
  caserta: 'Campania',
  benevento: 'Campania',
  avellino: 'Campania',
  bari: 'Puglia',
  taranto: 'Puglia',
  lecce: 'Puglia',
  foggia: 'Puglia',
  andria: 'Puglia',
  barletta: 'Puglia',
  brindisi: 'Puglia',
  'potenza': 'Basilicata',
  matera: 'Basilicata',
  'cosenza': 'Calabria',
  'reggio calabria': 'Calabria',
  catanzaro: 'Calabria',
  'crotone': 'Calabria',
  'vibo valentia': 'Calabria',
  // Isole
  palermo: 'Sicilia',
  catania: 'Sicilia',
  messina: 'Sicilia',
  siracusa: 'Sicilia',
  'trapani': 'Sicilia',
  agrigento: 'Sicilia',
  'caltanissetta': 'Sicilia',
  enna: 'Sicilia',
  ragusa: 'Sicilia',
  cagliari: 'Sardegna',
  sassari: 'Sardegna',
  'quartu sant\'elena': 'Sardegna',
  olbia: 'Sardegna',
  nuoro: 'Sardegna',
  oristano: 'Sardegna',
};

export const REGIONE_FALLBACK = 'Altre località / Da assegnare';

export function regioneDaCitta(citta: string | null | undefined): string {
  if (!citta) return REGIONE_FALLBACK;
  const normalizzata = citta
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
  return CITTA_REGIONE[normalizzata] ?? REGIONE_FALLBACK;
}

export function raggruppaPerRegione(profili: ProfiloTuttofare[]): Map<string, ProfiloTuttofare[]> {
  const gruppi = new Map<string, ProfiloTuttofare[]>();
  for (const profilo of profili) {
    const regione = regioneDaCitta(profilo.citta);
    const lista = gruppi.get(regione);
    if (lista) {
      lista.push(profilo);
    } else {
      gruppi.set(regione, [profilo]);
    }
  }
  return gruppi;
}

export const ORDINE_REGIONI = [
  'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia',
  'Toscana', 'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto',
];
