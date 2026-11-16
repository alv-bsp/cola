import { giorniTra } from "./regole.js";

// Date in parole, per gli elenchi e le carte.

const fmt = (o) => new Intl.DateTimeFormat("it-IT", { timeZone: "UTC", ...o });
const fmtBreve = fmt({ day: "numeric", month: "short" });
const fmtConAnno = fmt({ day: "numeric", month: "short", year: "numeric" });
const fmtLungo = fmt({ day: "numeric", month: "long", year: "numeric" });
const fmtMese = fmt({ month: "short" });
const fmtMeseAnno = fmt({ month: "long", year: "numeric" });

const comeData = (g) => new Date(`${g}T12:00:00Z`);
const senzaPunto = (s) => s.replace(/\./g, "");

/** "4 set", con l'anno solo se non è quello di oggi: "6 mar 2027". */
export function data(g, oggi) {
  if (!g) return "";
  const stessoAnno = oggi && g.slice(0, 4) === oggi.slice(0, 4);
  return senzaPunto((stessoAnno ? fmtBreve : fmtConAnno).format(comeData(g)));
}

/** "4 settembre 2026" */
export const dataLunga = (g) => (g ? fmtLungo.format(comeData(g)) : "");

/** "set" */
export const mese = (g) => senzaPunto(fmtMese.format(comeData(g)));

/** "marzo 2027" */
export const meseAnno = (g) => fmtMeseAnno.format(comeData(g));

/** "oggi", "domani", "tra 12 giorni", "tra 3 mesi"; nel passato "ieri", "3 giorni fa", "da 4 giorni" (scaduto). */
export function relativo(g, oggi, { scaduto = false } = {}) {
  const n = giorniTra(oggi, g);
  if (n === 0) return "oggi";
  if (n === 1) return "domani";
  if (n === -1) return scaduto ? "da ieri" : "ieri";
  if (n < 0) return scaduto ? `da ${-n} giorni` : -n < 60 ? `${-n} giorni fa` : `${Math.round(-n / 30)} mesi fa`;
  if (n < 45) return `tra ${n} giorni`;
  return `tra ${Math.round(n / 30.4)} mesi`;
}

/** Breve per le pillole: "oggi", "domani", "12 g", "3 mesi", "-4 g". */
export function corto(n) {
  if (n === 0) return "oggi";
  if (n === 1) return "domani";
  if (n < 0) return `${n} g`;
  if (n < 45) return `${n} g`;
  return `${Math.round(n / 30.4)} mesi`;
}
