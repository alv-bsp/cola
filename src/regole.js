// Regole di Cola: età, calore, peso, scadenze, cose da fare. Funzioni pure, senza DOM né Supabase: si provano
// con node --test (test/regole.test.js). I giorni sono stringhe "AAAA-MM-GG" del calendario di Roma.

export const FUSO = "Europe/Rome";

// ───────────────────────────────────────── giorni
const fmtGiorno = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" });

/** Il giorno di calendario a Roma di un istante (di base: adesso). */
export const giornoRoma = (istante = new Date()) => fmtGiorno.format(new Date(istante));

const utc = (g) => Date.UTC(+g.slice(0, 4), +g.slice(5, 7) - 1, +g.slice(8, 10));
const daUtc = (ms) => new Date(ms).toISOString().slice(0, 10);

/** Giorni da a a b (positivo se b viene dopo). */
export const giorniTra = (a, b) => Math.round((utc(b) - utc(a)) / 86_400_000);

export const aggiungiGiorni = (g, n) => daUtc(utc(g) + n * 86_400_000);

/** Stesso giorno n mesi dopo; se il mese è più corto si ferma all'ultimo giorno (31 gen + 1 mese = 28 feb). */
export function aggiungiMesi(g, n) {
  const a = +g.slice(0, 4), m = +g.slice(5, 7) - 1 + n, d = +g.slice(8, 10);
  const anno = a + Math.floor(m / 12);
  const mese = ((m % 12) + 12) % 12;
  const ultimo = new Date(Date.UTC(anno, mese + 1, 0)).getUTCDate();
  return daUtc(Date.UTC(anno, mese, Math.min(d, ultimo)));
}

export const maxGiorno = (...g) => g.filter(Boolean).sort().at(-1) ?? null;

// ───────────────────────────────────────── età
/** Età in anni, mesi e giorni compiuti, più i mesi con la virgola (per la curva di crescita). */
export function eta(nata, oggi) {
  if (!nata || oggi < nata) return null;
  let mesi = (+oggi.slice(0, 4) - +nata.slice(0, 4)) * 12 + (+oggi.slice(5, 7) - +nata.slice(5, 7));
  if (aggiungiMesi(nata, mesi) > oggi) mesi -= 1;
  const giorni = giorniTra(aggiungiMesi(nata, mesi), oggi);
  const lunghezza = giorniTra(aggiungiMesi(nata, mesi), aggiungiMesi(nata, mesi + 1));
  return { anni: Math.floor(mesi / 12), mesi: mesi % 12, giorni, mesiTotali: mesi, mesiDecimali: mesi + giorni / lunghezza };
}

const plurale = (n, uno, tanti) => `${n} ${n === 1 ? uno : tanti}`;

/** "7 mesi e 29 giorni", "1 anno e 2 mesi", "3 settimane". */
export function etaInParole(nata, oggi) {
  const e = eta(nata, oggi);
  if (!e) return "";
  if (e.anni >= 2) return e.mesi ? `${plurale(e.anni, "anno", "anni")} e ${plurale(e.mesi, "mese", "mesi")}` : plurale(e.anni, "anno", "anni");
  if (e.mesiTotali >= 12) {
    return e.mesi ? `1 anno e ${plurale(e.mesi, "mese", "mesi")}` : "1 anno";
  }
  if (e.mesiTotali === 0) return e.giorni >= 7 ? plurale(Math.floor(e.giorni / 7), "settimana", "settimane") : plurale(e.giorni, "giorno", "giorni");
  return e.giorni ? `${plurale(e.mesiTotali, "mese", "mesi")} e ${plurale(e.giorni, "giorno", "giorni")}` : plurale(e.mesiTotali, "mese", "mesi");
}

/** Prossimo compleanno e anni che compie. */
export function compleanno(nata, oggi) {
  if (!nata) return null;
  let anni = +oggi.slice(0, 4) - +nata.slice(0, 4);
  let il = aggiungiMesi(nata, anni * 12);
  if (il < oggi) { anni += 1; il = aggiungiMesi(nata, anni * 12); }
  return { il, anni, mancano: giorniTra(oggi, il) };
}

// ───────────────────────────────────────── calore
// Valori tipici per una femmina di taglia media. Sono stime: con due o più calori segnati l'intervallo diventa
// la media dei suoi.
export const CALORE = {
  durata: 21,          // giorni dall'inizio del sanguinamento alla fine del calore, se la fine non è segnata
  inCorsoMax: 35,      // oltre questo, un calore senza fine si considera finito (alla durata tipica)
  intervallo: 183,     // circa sei mesi tra un inizio e il successivo
  intervalloMin: 120,
  intervalloMax: 400,
  margine: 30,         // la stima del prossimo è ± un mese
  sorveglianza: 56,    // piometra: da tenere d'occhio fino a 8 settimane dopo la fine (rischio più alto tra 4 e 8)
};

/**
 * Lo stato del ciclo oggi.
 * Restituisce null senza calori; altrimenti l'ultimo calore con la sua fine (segnata o stimata), se è in corso,
 * l'intervallo usato, la stima del prossimo e la finestra di sorveglianza della piometra.
 */
export function ciclo(calori, oggi) {
  const elenco = [...(calori || [])].sort((a, b) => a.inizio.localeCompare(b.inizio));
  if (!elenco.length) return null;
  const ultimo = elenco.at(-1);
  const giorno = giorniTra(ultimo.inizio, oggi) + 1;

  let fine = ultimo.fine;
  let fineStimata = false;
  let inCorso = false;
  if (!fine) {
    if (giorno <= CALORE.inCorsoMax) inCorso = giorno >= 1;
    else { fine = aggiungiGiorni(ultimo.inizio, CALORE.durata - 1); fineStimata = true; }
  } else inCorso = oggi >= ultimo.inizio && oggi <= fine;

  const salti = elenco.slice(1).map((c, i) => giorniTra(elenco[i].inizio, c.inizio))
    .filter((n) => n >= CALORE.intervalloMin && n <= CALORE.intervalloMax);
  const intervallo = salti.length ? Math.round(salti.reduce((s, n) => s + n, 0) / salti.length) : CALORE.intervallo;
  const previsto = aggiungiGiorni(ultimo.inizio, intervallo);

  const sorveglianza = fine
    ? { dal: aggiungiGiorni(fine, 1), al: aggiungiGiorni(fine, CALORE.sorveglianza) }
    : null;
  if (sorveglianza) sorveglianza.attiva = oggi >= sorveglianza.dal && oggi <= sorveglianza.al;

  return {
    ultimo,
    giorno,
    inCorso,
    fine,
    fineStimata,
    durata: fine ? giorniTra(ultimo.inizio, fine) + 1 : null,
    intervallo,
    basatoSu: salti.length + 1,            // quanti calori ha usato la stima (1 = solo il valore tipico)
    prossimo: {
      il: previsto,
      dal: aggiungiGiorni(previsto, -CALORE.margine),
      al: aggiungiGiorni(previsto, CALORE.margine),
      mancano: giorniTra(oggi, previsto),
    },
    sorveglianza,
    giorniDallInizio: giorno - 1,
  };
}

// ───────────────────────────────────────── peso
// Quota del peso adulto per età in mesi: curva indicativa per le razze medie (adulto tra 18 e 30 kg).
// Serve solo a disegnare una fascia di riferimento, non è una tabella veterinaria.
export const CRESCITA = [
  [0, 0.02], [2, 0.25], [3, 0.4], [4, 0.52], [5, 0.62], [6, 0.7], [7, 0.77], [8, 0.83],
  [9, 0.88], [10, 0.92], [12, 0.97], [15, 1], [600, 1],
];

export function quotaAdulta(mesi) {
  if (mesi <= 0) return CRESCITA[0][1];
  for (let i = 1; i < CRESCITA.length; i++) {
    const [m1, q1] = CRESCITA[i];
    if (mesi <= m1) {
      const [m0, q0] = CRESCITA[i - 1];
      return q0 + ((q1 - q0) * (mesi - m0)) / (m1 - m0);
    }
  }
  return 1;
}

/** Fascia di peso attesa a un giorno dato, dal peso adulto stimato del profilo. */
export function fasciaAttesa(profilo, giorno) {
  const e = eta(profilo?.nata_il, giorno);
  const min = Number(profilo?.peso_adulto_min), max = Number(profilo?.peso_adulto_max);
  if (!e || !min || !max) return null;
  const q = quotaAdulta(e.mesiDecimali);
  return { min: arrotonda(min * q), max: arrotonda(max * q), quota: q };
}

const arrotonda = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

/** Pesate in ordine di data, con la variazione dalla precedente. */
export function pesateInOrdine(pesi) {
  const ordinati = [...(pesi || [])].map((p) => ({ ...p, kg: Number(p.kg) })).sort((a, b) => a.il.localeCompare(b.il));
  return ordinati.map((p, i) => ({ ...p, delta: i ? arrotonda(p.kg - ordinati[i - 1].kg) : null }));
}

/** Riassunto del peso: ultima pesata, variazione, ritmo, posizione nella fascia e proiezione da adulta. */
export function andamentoPeso(pesi, profilo, oggi) {
  const elenco = pesateInOrdine(pesi);
  if (!elenco.length) return null;
  const ultimo = elenco.at(-1);
  const precedente = elenco.at(-2) || null;
  const giorni = precedente ? giorniTra(precedente.il, ultimo.il) : null;
  const kgSettimana = precedente && giorni > 0 ? arrotonda(((ultimo.kg - precedente.kg) / giorni) * 7, 2) : null;
  const fascia = fasciaAttesa(profilo, ultimo.il);
  const posizione = !fascia ? null : ultimo.kg < fascia.min ? "sotto" : ultimo.kg > fascia.max ? "sopra" : "dentro";
  const e = eta(profilo?.nata_il, ultimo.il);
  // Proiezione: solo da cucciola, quando la curva dice ancora qualcosa.
  const proiezione = e && e.mesiDecimali >= 3 && e.mesiDecimali < 12 ? arrotonda(ultimo.kg / quotaAdulta(e.mesiDecimali)) : null;
  return {
    elenco, ultimo, precedente, delta: ultimo.delta, giorni, kgSettimana, fascia, posizione, proiezione,
    giorniDallUltima: giorniTra(ultimo.il, oggi),
  };
}

// ───────────────────────────────────────── salute
export const TIPI = {
  vaccino:          { nome: "Vaccino",          icona: "syringe",      tinta: "blu",     mesi: 12 },
  antiparassitario: { nome: "Antiparassitario", icona: "shield",       tinta: "verde",   mesi: 1 },
  vermifugo:        { nome: "Vermifugo",        icona: "pill",         tinta: "giallo",  mesi: 3 },
  filaria:          { nome: "Filaria",          icona: "heart",        tinta: "rosa",    mesi: 1 },
  farmaco:          { nome: "Farmaco",          icona: "pill",         tinta: "arancio", mesi: null },
  visita:           { nome: "Visita",           icona: "stethoscope",  tinta: "verde",   mesi: null },
  esame:            { nome: "Esame",            icona: "flask",        tinta: "blu",     mesi: null },
  altro:            { nome: "Altro",            icona: "notebook",     tinta: "grigio",  mesi: null },
};

/** Tipi raccolti nelle due sezioni di Salute. */
export const PROTEZIONE = ["vaccino", "antiparassitario", "vermifugo", "filaria", "farmaco"];
export const VISITE = ["visita", "esame", "altro"];

/** Nomi proposti nel modulo, per tipo. Si può sempre scrivere altro. */
export const SUGGERIMENTI = {
  vaccino: ["Polivalente (DHPPi)", "Leptospirosi (L4)", "Polivalente + Lepto (DHPPi+L4)", "Antirabbica", "Tosse dei canili", "Leishmaniosi"],
  antiparassitario: ["NexGard", "NexGard Spectra", "Simparica", "Simparica Trio", "Bravecto", "Credelio", "Seresto (collare)", "Advantix", "Frontline"],
  vermifugo: ["Milbemax", "Drontal", "Panacur"],
  filaria: ["Prevenzione filaria (compressa)", "ProHeart (iniezione)"],
  farmaco: ["Metacam", "Cystocure"],
  visita: ["Visita di controllo", "Visita vaccinale", "Visita specialistica"],
  esame: ["Esami del sangue", "Esame delle feci", "Radiografia anche e gomiti (ENCI)", "Ecografia", "Test leishmania"],
  altro: [],
};

// Prodotti con una durata diversa da quella del loro tipo (in mesi).
const DURATE = [
  [/bravecto/i, 3],
  [/seresto|collare/i, 7],
  [/proheart.*12|sr-?12/i, 12],
  [/proheart/i, 6],
  [/leishmania|leishmaniosi|letifend|canileish/i, 12],
];

/** Mesi fino alla prossima dose suggeriti per un tipo e un nome; null se non c'è un richiamo. */
export function mesiSuggeriti(tipo, nome = "") {
  for (const [re, mesi] of DURATE) if (re.test(nome)) return mesi;
  return TIPI[tipo]?.mesi ?? null;
}

export function prossimoSuggerito(tipo, nome, il) {
  const mesi = mesiSuggeriti(tipo, nome);
  return mesi && il ? aggiungiMesi(il, mesi) : null;
}

const chiaveGruppo = (e) => `${e.tipo}|${e.nome.trim().toLowerCase()}`;

/**
 * Eventi raggruppati per tipo e nome (lo stesso vaccino, lo stesso antiparassitario), dal più recente.
 * La scadenza di un gruppo è il prossimo_il del suo evento più recente.
 */
export function gruppi(salute, tipi = null) {
  const m = new Map();
  for (const e of salute || []) {
    if (tipi && !tipi.includes(e.tipo)) continue;
    const k = chiaveGruppo(e);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(e);
  }
  return [...m.entries()].map(([chiave, eventi]) => {
    eventi.sort((a, b) => b.il.localeCompare(a.il) || (b.creato_il || "").localeCompare(a.creato_il || ""));
    const ultimo = eventi[0];
    return { chiave, tipo: ultimo.tipo, nome: ultimo.nome, eventi, ultimo, prossimo: ultimo.prossimo_il || null };
  }).sort((a, b) => (a.prossimo || "9999").localeCompare(b.prossimo || "9999") || b.ultimo.il.localeCompare(a.ultimo.il));
}

/** Quanto è vicina una scadenza: in ritardo, presto (entro la soglia) o ok. */
export function urgenza(mancano, soglia = 14) {
  if (mancano < 0) return "ritardo";
  if (mancano <= soglia) return "presto";
  return "ok";
}

/** Le scadenze di salute ancora aperte (una per gruppo), dalla più vicina. */
export function scadenzeSalute(salute, oggi) {
  return gruppi(salute)
    .filter((g) => g.prossimo)
    .map((g) => {
      const mancano = giorniTra(oggi, g.prossimo);
      // Per quelli mensili due settimane sarebbero metà del ciclo: avviso a una settimana.
      const soglia = (mesiSuggeriti(g.tipo, g.nome) ?? 12) <= 1 ? 7 : 14;
      return { ...g, il: g.prossimo, mancano, urgenza: urgenza(mancano, soglia) };
    })
    .sort((a, b) => a.il.localeCompare(b.il));
}

// ───────────────────────────────────────── cose da fare
/** Cose aperte divise per quando, più le ultime fatte. */
export function coseDivise(cose, oggi) {
  const aperte = (cose || []).filter((c) => !c.fatta_il);
  const perData = (a, b) => a.entro.localeCompare(b.entro) || a.testo.localeCompare(b.testo, "it");
  const conData = aperte.filter((c) => c.entro).sort(perData);
  const settimana = aggiungiGiorni(oggi, 7);
  return {
    ritardo: conData.filter((c) => c.entro < oggi),
    presto: conData.filter((c) => c.entro >= oggi && c.entro <= settimana),
    avanti: conData.filter((c) => c.entro > settimana),
    senzaData: aperte.filter((c) => !c.entro).sort((a, b) => (a.creato_il || "").localeCompare(b.creato_il || "")),
    fatte: (cose || []).filter((c) => c.fatta_il).sort((a, b) => b.fatta_il.localeCompare(a.fatta_il)),
    aperte: aperte.length,
  };
}

// ───────────────────────────────────────── addestramento
export const STATI_TRICK = { "da-iniziare": "Da iniziare", "in-corso": "In corso", imparato: "Imparato" };

/** I tre livelli di affidabilità, in ordine: colonna con la data e nome. */
export const LIVELLI = [
  { chiave: "casa", colonna: "casa_il", nome: "In casa" },
  { chiave: "fuori", colonna: "fuori_il", nome: "Fuori" },
  { chiave: "distrazioni", colonna: "distrazioni_il", nome: "Con distrazioni" },
];

export const livelliRaggiunti = (t) => LIVELLI.filter((l) => t[l.colonna]).length;

/**
 * Rimette in fila stato e date di un trick: un livello raggiunto vuol dire che è iniziato; tutti e tre vogliono dire
 * imparato; imparato senza data prende oggi; tornando indietro dallo stato imparato la data si toglie.
 */
export function normalizzaTrick(t, oggi) {
  const r = { ...t };
  const date = LIVELLI.map((l) => r[l.colonna]).filter(Boolean).sort();
  if (date.length && r.stato === "da-iniziare") r.stato = "in-corso";
  if (date.length === LIVELLI.length && r.stato !== "imparato" && !t._statoScelto) {
    r.stato = "imparato";
    r.imparato_il = r.imparato_il || date.at(-1);
  }
  if (r.stato === "imparato") r.imparato_il = r.imparato_il || oggi;
  else r.imparato_il = null;
  if (r.stato !== "da-iniziare") r.iniziato_il = r.iniziato_il || date[0] || oggi;
  delete r._statoScelto;
  return r;
}

/** Il livello segnato come raggiunto oggi, con lo stato che segue. Restituisce solo i campi che cambiano. */
export function conLivello(t, chiave, oggi) {
  const l = LIVELLI.find((x) => x.chiave === chiave);
  const nuovo = normalizzaTrick({ ...t, [l.colonna]: oggi }, oggi);
  const campi = {};
  for (const k of ["stato", "iniziato_il", "casa_il", "fuori_il", "distrazioni_il", "imparato_il"]) {
    if (nuovo[k] !== t[k]) campi[k] = nuovo[k];
  }
  return campi;
}

/** Trick divisi per stato: in corso dal più avanti, da iniziare in ordine di inserimento, imparati dal più recente. */
export function trickDivisi(trick) {
  const elenco = trick || [];
  return {
    inCorso: elenco.filter((t) => t.stato === "in-corso")
      .sort((a, b) => livelliRaggiunti(b) - livelliRaggiunti(a) || (a.iniziato_il || "").localeCompare(b.iniziato_il || "")),
    daIniziare: elenco.filter((t) => t.stato === "da-iniziare")
      .sort((a, b) => (a.creato_il || "").localeCompare(b.creato_il || "") || a.nome.localeCompare(b.nome, "it")),
    imparati: elenco.filter((t) => t.stato === "imparato")
      .sort((a, b) => (b.imparato_il || "").localeCompare(a.imparato_il || "")),
  };
}

/** I traguardi di addestramento come voci con data: inizio, livelli, imparato. */
export function traguardi(trick) {
  const voci = [];
  for (const t of trick || []) {
    if (t.iniziato_il) voci.push({ il: t.iniziato_il, titolo: `${t.nome}: si comincia`, rif: t });
    for (const l of LIVELLI) if (t[l.colonna]) voci.push({ il: t[l.colonna], titolo: `${t.nome}: ${l.nome.toLowerCase()}`, rif: t });
    if (t.imparato_il) voci.push({ il: t.imparato_il, titolo: `${t.nome}: imparato`, rif: t, imparato: true });
  }
  return voci.sort((a, b) => b.il.localeCompare(a.il));
}

// ───────────────────────────────────────── dog sitter e pensioni
export const TIPI_SOGGIORNO = { "dog-sitter": "Dog sitter", pensione: "Pensione" };
export const GIUDIZI = {
  su: { emoji: "👍", nome: "Sì", tono: "verde" },
  medio: { emoji: "😐", nome: "Medio", tono: "giallo" },
  giu: { emoji: "👎", nome: "No", tono: "rosso" },
};

/** Notti di una permanenza: senza la fine, o finita lo stesso giorno, è una giornata. */
export const notti = (s) => (s.al ? Math.max(0, giorniTra(s.dal, s.al)) : 0);

export function durataSoggiorno(s) {
  const n = notti(s);
  if (n === 0) return "una giornata";
  return n === 1 ? "una notte" : `${n} notti`;
}

const chiavePosto = (s) => s.nome.trim().toLowerCase();

/**
 * Le permanenze raggruppate per dog sitter o pensione, dal posto usato più di recente. Per ognuno: le permanenze
 * (dalla più recente), il giudizio dell'ultima che ne ha uno e quanti sì, medio e no.
 */
export function posti(soggiorni) {
  const m = new Map();
  for (const s of soggiorni || []) {
    const k = chiavePosto(s);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(s);
  }
  return [...m.entries()].map(([chiave, elenco]) => {
    elenco.sort((a, b) => b.dal.localeCompare(a.dal) || (b.creato_il || "").localeCompare(a.creato_il || ""));
    const ultimo = elenco[0];
    const conteggi = { su: 0, medio: 0, giu: 0 };
    for (const s of elenco) if (s.giudizio) conteggi[s.giudizio] += 1;
    return {
      chiave, nome: ultimo.nome.trim(), citta: elenco.find((s) => s.citta)?.citta || "", tipo: ultimo.tipo,
      soggiorni: elenco, ultimo, giudizio: elenco.find((s) => s.giudizio)?.giudizio || null, conteggi,
      notti: elenco.reduce((t, s) => t + notti(s), 0),
    };
  }).sort((a, b) => b.ultimo.dal.localeCompare(a.ultimo.dal));
}

// ───────────────────────────────────────── in arrivo
/**
 * Quello che arriva, per la pagina Oggi: scadenze di salute, cose da fare con una data, il prossimo calore
 * stimato e i compleanni. Ogni voce: { tipo, titolo, sotto, il, mancano, urgenza, rif }.
 */
export function inArrivo({ salute, cose, calori, profilo, soggiorni }, oggi, quanti = 6) {
  const voci = [];
  for (const s of (soggiorni || []).filter((x) => x.dal > oggi)) {
    const mancano = giorniTra(oggi, s.dal);
    voci.push({ genere: "soggiorno", tipo: s.tipo, titolo: `Da ${s.nome}`, sotto: [s.citta, durataSoggiorno(s)].filter(Boolean).join(" · "), il: s.dal, mancano, urgenza: urgenza(mancano, 7), rif: s });
  }
  for (const s of scadenzeSalute(salute, oggi)) {
    voci.push({ genere: "salute", tipo: s.tipo, titolo: s.nome, sotto: TIPI[s.tipo]?.nome || "", il: s.il, mancano: s.mancano, urgenza: s.urgenza, rif: s });
  }
  for (const c of (cose || []).filter((x) => !x.fatta_il && x.entro)) {
    const mancano = giorniTra(oggi, c.entro);
    voci.push({ genere: "cosa", tipo: "cosa", titolo: c.testo, sotto: "Da fare", il: c.entro, mancano, urgenza: urgenza(mancano, 7), rif: c });
  }
  const cl = ciclo(calori, oggi);
  if (cl && !cl.inCorso && cl.prossimo.mancano > -CALORE.margine) {
    voci.push({
      genere: "calore", tipo: "calore", titolo: "Prossimo calore", sotto: "Stima, ± un mese",
      il: cl.prossimo.il, mancano: cl.prossimo.mancano, urgenza: cl.prossimo.mancano <= CALORE.margine ? "presto" : "stima", rif: cl,
    });
  }
  const cp = compleanno(profilo?.nata_il, oggi);
  if (cp && cp.mancano <= 60) {
    voci.push({ genere: "compleanno", tipo: "compleanno", titolo: `Compie ${cp.anni === 1 ? "un anno" : `${cp.anni} anni`}`, sotto: "Compleanno", il: cp.il, mancano: cp.mancano, urgenza: "festa", rif: cp });
  }
  return voci.sort((a, b) => a.il.localeCompare(b.il)).slice(0, quanti);
}

// ───────────────────────────────────────── diario
/** Tutto quello che è successo, dal più recente: pesate, salute, calori, note e cose fatte. */
export function cronologia({ pesi, salute, calori, diario, cose, trick, soggiorni }) {
  const voci = [];
  for (const p of pesateInOrdine(pesi)) voci.push({ genere: "peso", il: p.il, titolo: `${formatoKg(p.kg)} kg`, sotto: p.delta == null ? "Prima pesata" : `${p.delta >= 0 ? "+" : "−"}${formatoKg(Math.abs(p.delta))} kg`, rif: p });
  for (const s of salute || []) voci.push({ genere: "salute", tipo: s.tipo, il: s.il, titolo: s.nome, sotto: TIPI[s.tipo]?.nome || "", rif: s });
  for (const c of calori || []) {
    voci.push({ genere: "calore", il: c.inizio, titolo: "Inizio del calore", sotto: c.note || "", rif: c });
    if (c.fine) voci.push({ genere: "calore", il: c.fine, titolo: "Fine del calore", sotto: `${giorniTra(c.inizio, c.fine) + 1} giorni`, rif: c });
  }
  for (const d of (diario || []).filter((x) => x.il)) voci.push({ genere: "nota", il: d.il, titolo: d.titolo, sotto: d.testo || "", rif: d });
  for (const c of (cose || []).filter((x) => x.fatta_il)) voci.push({ genere: "cosa", il: giornoRoma(c.fatta_il), titolo: c.testo, sotto: "Fatto", rif: c });
  for (const t of traguardi(trick)) voci.push({ genere: "trick", il: t.il, titolo: t.titolo, sotto: "Addestramento", rif: t.rif });
  for (const s of soggiorni || []) {
    voci.push({
      genere: "soggiorno", il: s.dal, titolo: `Da ${s.nome}${s.giudizio ? ` ${GIUDIZI[s.giudizio].emoji}` : ""}`,
      sotto: [TIPI_SOGGIORNO[s.tipo], s.citta, durataSoggiorno(s)].filter(Boolean).join(" · "), rif: s,
    });
  }
  return voci.sort((a, b) => b.il.localeCompare(a.il));
}

export const formatoKg = (kg) => Number(kg).toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Numero con al massimo un decimale, senza ",0": 50 · 50,5. */
export const formatoNumero = (n) => Number(n).toLocaleString("it-IT", { maximumFractionDigits: 1 });
