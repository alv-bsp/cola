import { html, raw, esc } from "../ui/html.js";
import { icona } from "../ui/icone.js";
import { TIPI } from "../regole.js";
import { data, corto } from "../tempo.js";

// Pezzi condivisi dalle viste.

/** Pillola colorata: tono verde, giallo, rosso, blu, rosa, grigio. */
export const pillola = (testo, tono = "grigio") => html`<span class="pillola" data-tono="${tono}">${testo}</span>`;

/** Riquadro arrotondato con l'icona, nel colore del suo genere. */
export const tessera = (nome, tinta = "verde", dimensione = 20) =>
  html`<span class="tessera" data-tinta="${tinta}">${icona(nome, dimensione)}</span>`;

/** Icona e tinta per una voce di un elenco (scadenza, cronologia). */
export function aspetto(voce) {
  if (voce.genere === "salute") return { icona: TIPI[voce.tipo]?.icona || "notebook", tinta: TIPI[voce.tipo]?.tinta || "grigio" };
  return {
    cosa: { icona: "list-checks", tinta: "grigio" },
    calore: { icona: "flame", tinta: "rosa" },
    compleanno: { icona: "cake", tinta: "rosa" },
    peso: { icona: "weight", tinta: "verde" },
    nota: { icona: "notebook", tinta: "giallo" },
    trick: { icona: "award", tinta: "giallo" },
    soggiorno: { icona: voce.tipo === "pensione" || voce.rif?.tipo === "pensione" ? "bed" : "house", tinta: "arancio" },
  }[voce.genere] || { icona: "paw", tinta: "verde" };
}

export const URGENZA = {
  ritardo: { testo: "In ritardo", tono: "rosso" },
  presto: { testo: "Presto", tono: "giallo" },
  ok: { testo: "In regola", tono: "verde" },
  stima: { testo: "Stima", tono: "grigio" },
  festa: { testo: "Festa", tono: "rosa" },
};

/** Pillola per quanto manca a una scadenza: "-4 g" in rosso, "6 g" in giallo, "3 mesi" in verde. */
export function pillolaScadenza(mancano, urg) {
  const u = URGENZA[urg] || URGENZA.ok;
  const testo = urg === "ritardo" ? `${-mancano} g fa` : urg === "stima" ? `~${corto(mancano)}` : corto(mancano);
  return pillola(testo, u.tono);
}

/** Intestazione di una carta, con il link "Vedi tutto" facoltativo. */
export const testaCarta = (titolo, link = null) => html`
  <div class="carta-testa">
    <h2>${titolo}</h2>
    ${link ? html`<a class="link-freccia" href="${link.href || "#"}" ${link.azione ? html`data-azione="${link.azione}"` : ""}>${link.testo || "Vedi tutto"} ${icona("arrow-right", 15)}</a>` : ""}
  </div>`;

/** Titolo grande di una pagina, con il ritorno indietro per le pagine interne. */
export const titoloPagina = (titolo, sotto = "", { indietro = null, azione = null } = {}) => html`
  <header class="pagina-testa">
    ${indietro ? html`<a class="btn-icona vetro" href="${indietro}" aria-label="Indietro">${icona("chevron-left", 22)}</a>` : ""}
    <div class="pagina-titoli">
      <h1>${titolo}</h1>
      ${sotto ? html`<p>${sotto}</p>` : ""}
    </div>
    ${azione || ""}
  </header>`;

/** Riga di un elenco: tessera, titolo e sotto, a destra pillola e data. Toccabile se ha un'azione. */
export function riga({ icona: ic, tinta, titolo, sotto = "", pillola: pl = "", data: d = "", azione = null, dati = {}, href = null }) {
  const attributi = Object.entries(dati).map(([k, v]) => ` data-${k}="${esc(v)}"`).join("");
  const interno = html`
    ${tessera(ic, tinta)}
    <span class="riga-testo"><b>${titolo}</b>${sotto ? html`<small>${sotto}</small>` : ""}</span>
    <span class="riga-fine">${pl}${d ? html`<small>${d}</small>` : ""}</span>
    ${azione || href ? html`<span class="riga-chevron">${icona("chevron-right", 18)}</span>` : ""}`;
  if (href) return html`<a class="riga" href="${href}">${interno}</a>`;
  if (azione) return html`<button class="riga" type="button" data-azione="${azione}"${raw(attributi)}>${interno}</button>`;
  return html`<div class="riga">${interno}</div>`;
}

/** Una voce di inArrivo() come riga. */
export function rigaInArrivo(v, oggi) {
  const a = aspetto(v);
  const azione = v.genere === "salute" ? { azione: "gruppo", dati: { chiave: v.rif.chiave } }
    : v.genere === "cosa" ? { azione: "modifica", dati: { genere: "cose", id: v.rif.id } }
    : v.genere === "soggiorno" ? { azione: "modifica", dati: { genere: "soggiorni", id: v.rif.id } }
    : v.genere === "calore" ? { href: "#/salute" }
    : { href: "#/passaporto" };
  return riga({
    icona: a.icona, tinta: a.tinta, titolo: v.titolo, sotto: v.sotto,
    pillola: pillolaScadenza(v.mancano, v.urgenza), data: data(v.il, oggi), ...azione,
  });
}

/** Una voce della cronologia come riga. */
export function rigaCronologia(v, oggi) {
  const a = aspetto(v);
  const genere = { peso: "pesi", salute: "salute", calore: "calori", nota: "diario", cosa: "cose", trick: "trick", soggiorno: "soggiorni" }[v.genere];
  return riga({
    icona: a.icona, tinta: a.tinta, titolo: v.titolo, sotto: v.sotto, data: data(v.il, oggi),
    azione: "modifica", dati: { genere, id: v.rif.id },
  });
}

export const avviso = (testo) => html`
  <div class="avviso" role="alert">${icona("alert", 18)}<span>${testo}</span>
    <button class="btn piccolo" type="button" data-azione="riprova">Riprova</button></div>`;
