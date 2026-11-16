import { html } from "../ui/html.js";
import { icona } from "../ui/icone.js";
import { coseDivise, giorniTra, giornoRoma } from "../regole.js";
import { data } from "../tempo.js";
import { pillolaScadenza, titoloPagina } from "./comuni.js";

export const conTabbar = true;

let mostraFatte = false;

export function render(s, { avviso }) {
  const oggi = s.oggi;
  const d = coseDivise(s.cose, oggi);
  const gruppi = [
    ["In ritardo", d.ritardo],
    ["Questa settimana", d.presto],
    ["Più avanti", d.avanti],
    ["Senza data", d.senzaData],
  ].filter(([, elenco]) => elenco.length);

  return html`
    ${avviso}
    <div class="pagina">
      ${titoloPagina("Da fare", d.aperte ? (d.aperte === 1 ? "Una cosa aperta" : `${d.aperte} cose aperte`) : "Niente in sospeso")}
      <form class="aggiungi-veloce carta" data-form="cosa-veloce" autocomplete="off">
        <input name="testo" type="text" placeholder="Aggiungi una cosa da fare…" maxlength="160" enterkeyhint="done" aria-label="Nuova cosa da fare">
        <button class="btn-tondo piccolo" type="submit" aria-label="Aggiungi">${icona("plus", 20)}</button>
      </form>
      ${gruppi.length ? gruppi.map(([titolo, elenco]) => html`
        <section class="carta">
          <h2 class="sezione-titolo">${titolo}</h2>
          <div class="elenco">${elenco.map((c) => rigaCosa(c, oggi))}</div>
        </section>`)
        : html`<section class="carta vuoto-carta">${icona("paw", 36, 1.6)}<p>Tutto fatto. Le cose nuove si aggiungono qui sopra o dal +.</p></section>`}
      ${d.fatte.length ? html`
        <button class="chip fatte-interruttore" type="button" data-azione="mostra-fatte" aria-expanded="${mostraFatte}">
          ${mostraFatte ? "Nascondi le fatte" : `Fatte (${d.fatte.length})`} ${icona("chevron-down", 16)}
        </button>
        ${mostraFatte ? html`<section class="carta fatte"><div class="elenco">${d.fatte.slice(0, 30).map((c) => rigaCosa(c, oggi))}</div></section>` : ""}` : ""}
    </div>`;
}

function rigaCosa(c, oggi) {
  const fatta = Boolean(c.fatta_il);
  let destra = "";
  if (fatta) destra = html`<small class="cosa-quando">${data(giornoRoma(c.fatta_il), oggi)}</small>`;
  else if (c.entro) {
    const mancano = giorniTra(oggi, c.entro);
    destra = html`${pillolaScadenza(mancano, mancano < 0 ? "ritardo" : mancano <= 7 ? "presto" : "ok")}<small class="cosa-quando">${data(c.entro, oggi)}</small>`;
  }
  return html`
    <div class="cosa ${fatta ? "fatta" : ""}">
      <button class="spunta" type="button" data-azione="segna-cosa" data-id="${c.id}" aria-pressed="${fatta}" aria-label="${fatta ? "Rimetti da fare" : "Segna come fatta"}">${icona("check", 16, 3)}</button>
      <button class="cosa-testo" type="button" data-azione="modifica" data-genere="cose" data-id="${c.id}">
        <b>${c.testo}</b>${c.nota ? html`<small>${c.nota}</small>` : ""}
      </button>
      <span class="cosa-fine">${destra}</span>
    </div>`;
}

export const azioni = {
  "mostra-fatte": (_el, _e, ridisegna) => { mostraFatte = !mostraFatte; ridisegna(); },
};
