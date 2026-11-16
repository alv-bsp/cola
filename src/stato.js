import { giornoRoma } from "./regole.js";

// Stato dell'app in memoria. Chi deve ridisegnare si iscrive con ascolta().
const ascoltatori = new Set();

const VUOTO = () => ({
  caricato: false,        // dati arrivati almeno una volta
  caricamento: false,     // dati in arrivo
  errore: null,           // messaggio da mostrare in alto, se i dati non arrivano
  membro: null,           // false se l'utente non è in cola_membri (vede tutto vuoto)
  partenza: null,         // dati di partenza: null · "in corso" · "fallita"
  profilo: null,          // la riga di cola_profilo, null se non c'è ancora
  pesi: [],
  calori: [],
  salute: [],
  cose: [],
  diario: [],
  contatti: [],
});

export const stato = {
  pronto: false,          // sessione verificata all'avvio
  sessione: null,         // sessione Supabase, null se non c'è login
  oggi: giornoRoma(),
  ...VUOTO(),
};

export function aggiorna(modifiche) {
  Object.assign(stato, modifiche, { oggi: giornoRoma() });
  for (const f of ascoltatori) f(stato);
}

export function ascolta(f) {
  ascoltatori.add(f);
  return () => ascoltatori.delete(f);
}

export const azzeraDati = () => aggiorna(VUOTO());

/**
 * Nessun dato di Cola ancora: si caricano quelli di partenza. Il profilo può già esserci se la foto è stata messa
 * prima (salvarla crea la riga), ma senza data di nascita non è mai stato compilato.
 */
export const vuoto = () =>
  stato.caricato && !stato.profilo?.nata_il &&
  !stato.pesi.length && !stato.calori.length && !stato.salute.length && !stato.cose.length && !stato.diario.length;

export const nomeCane = () => stato.profilo?.nome || "Cola";

export const trova = (genere, id) => stato[genere]?.find((r) => r.id === id) || null;

/** Veterinari e cliniche dei contatti, per i suggerimenti del modulo di salute. */
export const veterinari = () => {
  const dai = stato.contatti.filter((c) => c.ruolo === "veterinario" || c.ruolo === "clinica").map((c) => c.nome);
  const usati = stato.salute.map((s) => s.veterinario).filter(Boolean);
  return [...new Set([...dai, ...usati])].sort((a, b) => a.localeCompare(b, "it"));
};
