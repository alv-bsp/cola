// Supabase finto per la demo (npm run demo): niente rete, niente login, dati in memoria.
// Parte dai dati di partenza veri e aggiunge eventi di salute e contatti INVENTATI, solo per vedere l'app piena.
// Quello che salvi resta finché non ricarichi la pagina.
import { PARTENZA } from "/src/partenza.js";
import { TRICK_BASE } from "/src/trick-base.js";

let n = 0;
const id = () => `demo-${++n}`;
const ora = new Date().toISOString();
const conId = (righe) => righe.map((r) => ({ id: id(), creato_il: ora, ...r }));

const DB = {
  cola_membri: [{ user_id: "demo" }],
  cola_profilo: [{ id: 1, ...PARTENZA.profilo }],
  cola_pesi: conId(PARTENZA.pesi),
  cola_calori: conId(PARTENZA.calori),
  cola_salute: conId([
    { tipo: "vaccino", nome: "Polivalente + Lepto (DHPPi+L4)", il: "2026-06-10", prossimo_il: "2027-06-10", veterinario: "Veterinario di prova" },
    { tipo: "vaccino", nome: "Polivalente + Lepto (DHPPi+L4)", il: "2026-05-12", prossimo_il: "2026-06-10", veterinario: "Allevatore" },
    { tipo: "antiparassitario", nome: "NexGard Spectra", il: "2026-09-20", prossimo_il: "2026-10-20" },
    { tipo: "antiparassitario", nome: "NexGard Spectra", il: "2026-10-21", prossimo_il: "2026-11-21" },
    { tipo: "vermifugo", nome: "Milbemax", il: "2026-08-30", prossimo_il: "2026-11-30" },
    { tipo: "visita", nome: "Visita di controllo", il: "2026-10-18", veterinario: "Veterinario di prova", note: "Esempio: tutto bene, calore precoce da annotare." },
  ]),
  cola_cose: conId(PARTENZA.cose.map((c) => ({ fatta_il: null, ...c }))),
  cola_diario: conId(PARTENZA.diario),
  cola_contatti: conId([...PARTENZA.contatti, { ruolo: "veterinario", nome: "Veterinario di prova", telefono: "+39 000 0000000" }]),
  // Permanenze inventate
  cola_soggiorni: conId([
    { tipo: "dog-sitter", nome: "Dog sitter di prova", citta: "Lecco", dal: "2026-08-08", al: "2026-08-09", giudizio: "su", note: "Esempio: ha un gatto, Cola tranquilla." },
    { tipo: "dog-sitter", nome: "Dog sitter di prova", citta: "Lecco", dal: "2026-10-03", al: "2026-10-05", giudizio: "su" },
    { tipo: "pensione", nome: "Pensione di prova", citta: "Bergamo", dal: "2026-09-12", al: "2026-09-19", giudizio: "medio", note: "Esempio: tornata stanca e un po' dimagrita." },
    { tipo: "dog-sitter", nome: "Dog sitter di prova", citta: "Lecco", dal: "2026-12-20", al: "2026-12-27" },
  ]),
  // Progressi inventati, per vedere la scheda piena
  cola_trick: conId(TRICK_BASE.map((t) => ({ stato: "da-iniziare", ...t }))).map((t, i) => {
    if (i < 3) return { ...t, stato: "imparato", iniziato_il: "2026-06-10", casa_il: "2026-06-20", fuori_il: "2026-07-15", distrazioni_il: "2026-09-01", imparato_il: "2026-09-01" };
    if (i === 3) return { ...t, stato: "in-corso", iniziato_il: "2026-08-01", casa_il: "2026-08-20", fuori_il: "2026-11-02" };
    if (i === 8) return { ...t, stato: "in-corso", iniziato_il: "2026-10-10", casa_il: "2026-11-05" };
    if (i === 11) return { ...t, stato: "in-corso", iniziato_il: "2026-11-12" };
    return t;
  }),
};

class Query {
  constructor(tabella) { this.tabella = tabella; this.op = "select"; this.filtri = []; this.dati = null; this.uno = false; }
  select() { return this; }
  eq(k, v) { this.filtri.push([k, v]); return this; }
  limit() { return this; }
  order() { return this; }
  gte() { return this; }
  insert(r) { this.op = "insert"; this.dati = r; return this; }
  update(c) { this.op = "update"; this.dati = c; return this; }
  upsert(r) { this.op = "upsert"; this.dati = r; return this; }
  delete() { this.op = "delete"; return this; }
  single() { this.uno = true; return this; }
  maybeSingle() { this.uno = true; return this; }
  esegui() {
    const righe = (DB[this.tabella] ||= []);
    const passa = (r) => this.filtri.every(([k, v]) => r[k] === v);
    let fuori = [];
    if (this.op === "select") fuori = righe.filter(passa);
    if (this.op === "insert") {
      fuori = [this.dati].flat().map((r) => ({ id: id(), creato_il: new Date().toISOString(), ...r }));
      righe.push(...fuori);
    }
    if (this.op === "update") {
      for (const r of righe.filter(passa)) Object.assign(r, this.dati);
      fuori = righe.filter(passa);
    }
    if (this.op === "upsert") {
      const r = righe.find((x) => x.id === this.dati.id);
      if (r) Object.assign(r, this.dati);
      else righe.push({ ...this.dati });
      fuori = [righe.find((x) => x.id === this.dati.id)];
    }
    if (this.op === "delete") DB[this.tabella] = righe.filter((r) => !passa(r));
    return { data: this.uno ? (fuori[0] ? { ...fuori[0] } : null) : fuori.map((r) => ({ ...r })), error: null };
  }
  then(ok, ko) {
    return new Promise((fatto) => setTimeout(() => fatto(this.esegui()), 40)).then(ok, ko);
  }
}

const sessione = { user: { id: "demo", email: "demo (dati finti)" } };

export const sb = {
  from: (tabella) => new Query(tabella),
  auth: {
    getSession: async () => ({ data: { session: sessione } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithPassword: async () => ({ error: null }),
    signOut: async () => ({}),
  },
  storage: {
    from: () => ({
      upload: async () => ({ error: null }),
      remove: async () => ({ error: null }),
      createSignedUrls: async () => ({ data: [], error: null }),
    }),
  },
};
