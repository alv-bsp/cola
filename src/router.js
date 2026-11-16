// Routing a hash: su GitHub Pages non serve nessun ripiego lato server.
//   #/oggi · #/salute · #/cose · #/passaporto     le sezioni della barra
//   #/peso · #/diario                              pagine raggiunte dalle carte di Oggi
export const SEZIONI = ["oggi", "salute", "cose", "passaporto"];
const PAGINE = [...SEZIONI, "peso", "diario"];
const GENITORE = { peso: "oggi", diario: "oggi" };

export function rotta() {
  const [nome = "", ...param] = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  const valida = PAGINE.includes(nome);
  const n = valida ? nome : "oggi";
  return { nome: n, param, valida, sezione: GENITORE[n] || n, profonda: Boolean(GENITORE[n]) };
}

/** Corregge un hash sconosciuto senza aggiungere una voce alla cronologia. */
export function normalizza() {
  if (!rotta().valida) history.replaceState(null, "", "#/oggi");
}

export const vai = (percorso) => { location.hash = `#/${percorso}`; };
