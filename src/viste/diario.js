import { html } from "../ui/html.js";
import { icona } from "../ui/icone.js";
import { cronologia } from "../regole.js";
import { meseAnno } from "../tempo.js";
import { rigaCronologia, titoloPagina } from "./comuni.js";

export const conTabbar = true;

/** Tutto quello che è successo, diviso per mese. */
export function render(s, { avviso }) {
  const voci = cronologia(s);
  const mesi = [];
  for (const v of voci) {
    const m = v.il.slice(0, 7);
    if (mesi.at(-1)?.m !== m) mesi.push({ m, voci: [] });
    mesi.at(-1).voci.push(v);
  }
  const nota = html`<button class="btn-tondo" type="button" data-azione="nuovo" data-genere="diario" aria-label="Nuova nota">${icona("plus", 22)}</button>`;
  return html`
    ${avviso}
    <div class="pagina">
      ${titoloPagina("Diario", "Pesate, salute, calori, note e cose fatte", { indietro: "#/oggi", azione: nota })}
      ${mesi.length ? mesi.map(({ m, voci: elenco }) => html`
        <section class="carta">
          <h2 class="sezione-titolo">${meseAnno(`${m}-01`)}</h2>
          <div class="elenco">${elenco.map((v) => rigaCronologia(v, s.oggi))}</div>
        </section>`)
        : html`<section class="carta vuoto-carta">${icona("notebook", 36, 1.6)}<p>Ancora niente. Le tappe importanti (la prima neve, il primo bagno al lago) si segnano con +.</p></section>`}
    </div>`;
}
