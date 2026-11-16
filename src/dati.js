import { sb } from "./supabase.js";
import { stato, aggiorna } from "./stato.js";

// Letture e scritture su Supabase. I dati di Cola sono poche centinaia di righe in tutto: dopo il login si carica
// tutto in memoria e ogni scrittura aggiorna lo stato con la riga che torna dal database.

const TABELLE = {
  pesi: "cola_pesi",
  calori: "cola_calori",
  salute: "cola_salute",
  cose: "cola_cose",
  diario: "cola_diario",
  contatti: "cola_contatti",
};

const CAMPI = {
  pesi: "id, il, kg, nota, creato_da, creato_il",
  calori: "id, inizio, fine, note, creato_da, creato_il",
  salute: "id, tipo, nome, il, prossimo_il, veterinario, note, creato_da, creato_il",
  cose: "id, testo, entro, nota, fatta_il, fatta_da, creato_da, creato_il",
  diario: "id, il, titolo, testo, creato_da, creato_il",
  contatti: "id, ruolo, nome, telefono, email, indirizzo, note, creato_da, creato_il",
};

const CAMPI_PROFILO =
  "nome, nome_registrato, razza, sesso, nata_il, presa_il, provenienza, microchip, passaporto, pedigree, sterilizzata_il, " +
  "crocchette, razione_g, pasti, garrese_cm, garrese_il, collo_cm, peso_adulto_min, peso_adulto_max, foto, miniatura, note, modificato_il";

// I numeri arrivano da Postgres come stringhe (numeric): qui tornano numeri.
const NUMERI = ["kg", "razione_g", "garrese_cm", "collo_cm", "peso_adulto_min", "peso_adulto_max"];
function pulisci(riga) {
  if (!riga) return riga;
  const r = { ...riga };
  for (const k of NUMERI) if (r[k] != null) r[k] = Number(r[k]);
  return r;
}

const senzaRete = (e) => !navigator.onLine || /fetch|network|Failed to fetch|Load failed/i.test(e?.message || "");

export function messaggioErrore(e) {
  if (senzaRete(e)) return "Nessuna connessione. Riprova quando sei online.";
  if (e?.code === "42501" || /row-level security|permission denied/i.test(e?.message || "")) {
    return "Il tuo utente non ha accesso ai dati di Cola (vedi cola_membri).";
  }
  if (e?.code === "23514") return "Un valore non va bene: controlla date e numeri.";
  return "Non sono riuscito a salvare. Riprova.";
}

/** Carica tutto quello che serve dopo il login. */
export async function caricaTutto() {
  aggiorna({ caricamento: true, errore: null });
  const io = stato.sessione?.user?.id;
  const [membro, profilo, ...elenchi] = await Promise.all([
    sb.from("cola_membri").select("user_id").eq("user_id", io).maybeSingle(),
    sb.from("cola_profilo").select(CAMPI_PROFILO).eq("id", 1).maybeSingle(),
    ...Object.keys(TABELLE).map((g) => sb.from(TABELLE[g]).select(CAMPI[g]).limit(2000)),
  ]);
  const risposte = [membro, profilo, ...elenchi];
  const primoErrore = risposte.find((r) => r.error)?.error;
  if (primoErrore) console.error("caricamento", primoErrore);

  let errore = null;
  if (primoErrore) {
    errore = senzaRete(primoErrore)
      ? "Nessuna connessione: non riesco a caricare i dati."
      : "Non riesco a leggere i dati. Hai eseguito supabase/schema.sql nel progetto Supabase?";
  }

  const nuovi = {};
  Object.keys(TABELLE).forEach((g, i) => {
    nuovi[g] = elenchi[i].error ? stato[g] : elenchi[i].data.map(pulisci);
  });

  aggiorna({
    caricamento: false,
    caricato: !primoErrore || stato.caricato,
    errore,
    membro: membro.error ? stato.membro : Boolean(membro.data),
    profilo: profilo.error ? stato.profilo : pulisci(profilo.data),
    ...nuovi,
  });
}

/** Inserisce o aggiorna una riga (con l'id è un aggiornamento). Restituisce la riga salvata. */
export async function salva(genere, riga) {
  const tabella = TABELLE[genere];
  const { id, ...campi } = riga;
  const q = id
    ? sb.from(tabella).update(campi).eq("id", id).select(CAMPI[genere]).single()
    : sb.from(tabella).insert(campi).select(CAMPI[genere]).single();
  const { data, error } = await q;
  if (error) throw error;
  const salvata = pulisci(data);
  const elenco = stato[genere].filter((r) => r.id !== salvata.id);
  aggiorna({ [genere]: [...elenco, salvata] });
  return salvata;
}

/** Elimina una riga e la restituisce, per poterla rimettere (Annulla). */
export async function elimina(genere, id) {
  const vecchia = stato[genere].find((r) => r.id === id);
  const { error } = await sb.from(TABELLE[genere]).delete().eq("id", id);
  if (error) throw error;
  aggiorna({ [genere]: stato[genere].filter((r) => r.id !== id) });
  return vecchia;
}

/** Rimette una riga eliminata, con lo stesso id. */
export async function ripristina(genere, riga) {
  const { data, error } = await sb.from(TABELLE[genere]).insert(riga).select(CAMPI[genere]).single();
  if (error) throw error;
  aggiorna({ [genere]: [...stato[genere], pulisci(data)] });
}

/** Segna una cosa come fatta o da fare. Lo stato cambia subito; se il salvataggio fallisce torna com'era. */
export async function segnaCosa(id, fatta) {
  const prima = stato.cose.find((c) => c.id === id);
  if (!prima) return;
  const campi = fatta
    ? { fatta_il: new Date().toISOString(), fatta_da: stato.sessione?.user?.id ?? null }
    : { fatta_il: null, fatta_da: null };
  aggiorna({ cose: stato.cose.map((c) => (c.id === id ? { ...c, ...campi } : c)) });
  const { error } = await sb.from(TABELLE.cose).update(campi).eq("id", id);
  if (error) {
    aggiorna({ cose: stato.cose.map((c) => (c.id === id ? prima : c)) });
    throw error;
  }
}

/** Salva i campi del profilo (crea la riga se manca). */
export async function salvaProfilo(campi) {
  const { data, error } = await sb.from("cola_profilo").upsert({ id: 1, ...campi }).select(CAMPI_PROFILO).single();
  if (error) throw error;
  aggiorna({ profilo: pulisci(data) });
  return data;
}

/** Carica i dati di partenza (src/partenza.js) in un colpo solo. */
export async function caricaPartenza(p) {
  const { error } = await sb.from("cola_profilo").upsert({ id: 1, ...p.profilo });
  if (error) throw error;
  const inserimenti = [
    ["pesi", p.pesi], ["calori", p.calori], ["salute", p.salute], ["cose", p.cose], ["diario", p.diario], ["contatti", p.contatti],
  ].filter(([, righe]) => righe?.length);
  const risposte = await Promise.all(inserimenti.map(([g, righe]) => sb.from(TABELLE[g]).insert(righe)));
  const err = risposte.find((r) => r.error)?.error;
  await caricaTutto();
  if (err) throw err;
}
