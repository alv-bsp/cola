import { html } from "../ui/html.js";
import { icona } from "../ui/icone.js";
import { lineaPeso } from "../ui/grafici.js";
import { andamentoPeso, etaInParole, formatoKg, formatoNumero } from "../regole.js";
import { data, relativo } from "../tempo.js";
import { pillola, riga, titoloPagina } from "./comuni.js";

export const conTabbar = true;

export function render(s, { avviso }) {
  const oggi = s.oggi;
  const p = s.profilo;
  const a = andamentoPeso(s.pesi, p, oggi);
  const aggiungi = html`<button class="btn-tondo" type="button" data-azione="nuovo" data-genere="pesi" aria-label="Nuova pesata">${icona("plus", 22)}</button>`;

  if (!a) {
    return html`${avviso}<div class="pagina">
      ${titoloPagina("Peso", "", { indietro: "#/oggi", azione: aggiungi })}
      <section class="carta vuoto-carta">${icona("weight", 36, 1.6)}<p>Nessuna pesata. Dal veterinario o a casa, con la bilancia: tu in braccio con lei, meno tu da solo.</p>
        <button class="btn primario" type="button" data-azione="nuovo" data-genere="pesi">Aggiungi la prima</button></section>
    </div>`;
  }

  const posizione = {
    dentro: pillola("Nella fascia", "verde"),
    sopra: pillola("Sopra la fascia", "giallo"),
    sotto: pillola("Sotto la fascia", "giallo"),
  }[a.posizione] || "";

  return html`
    ${avviso}
    <div class="pagina">
      ${titoloPagina("Peso", "", { indietro: "#/oggi", azione: aggiungi })}
      <section class="carta peso-grande">
        <div class="peso-cifra">
          <b>${formatoKg(a.ultimo.kg)}</b><span>kg</span>
          ${a.delta != null ? html`<em class="${a.delta >= 0 ? "su" : "giu"}">${a.delta >= 0 ? "+" : "−"}${formatoKg(Math.abs(a.delta))}</em>` : ""}
        </div>
        <p class="peso-quando">${relativo(a.ultimo.il, oggi) === "oggi" ? "Pesata oggi" : `Pesata ${relativo(a.ultimo.il, oggi)}`}${p?.nata_il ? `, a ${etaInParole(p.nata_il, a.ultimo.il)}` : ""} ${posizione}</p>
        ${lineaPeso(a.elenco, p, oggi)}
        <p class="legenda"><span class="legenda-fascia"></span>Fascia indicativa per un peso adulto di ${p?.peso_adulto_min ? `${formatoNumero(p.peso_adulto_min)}–${formatoNumero(p.peso_adulto_max)} kg` : "— (impostalo nel passaporto)"}</p>
      </section>

      <div class="griglia-dati">
        ${a.kgSettimana != null ? html`<div class="dato carta"><small>Ritmo</small><b>${a.kgSettimana >= 0 ? "+" : "−"}${Math.abs(a.kgSettimana).toLocaleString("it-IT", { maximumFractionDigits: 2 })} kg</b><span>a settimana, sugli ultimi ${a.giorni} giorni</span></div>` : ""}
        ${a.proiezione ? html`<div class="dato carta"><small>Da adulta</small><b>~${Math.round(a.proiezione)} kg</b><span>proiezione dalla curva</span></div>` : ""}
        ${a.fascia ? html`<div class="dato carta"><small>Fascia ora</small><b>${formatoKg(a.fascia.min)}–${formatoKg(a.fascia.max)}</b><span>kg all'ultima pesata</span></div>` : ""}
      </div>

      <section class="carta">
        <h2 class="sezione-titolo">Pesate</h2>
        <div class="elenco">${[...a.elenco].reverse().map((q) => riga({
          icona: "weight", tinta: "verde", titolo: `${formatoKg(q.kg)} kg`,
          sotto: [q.delta != null ? `${q.delta >= 0 ? "+" : "−"}${formatoKg(Math.abs(q.delta))} kg` : "Prima pesata", q.nota].filter(Boolean).join(" · "),
          data: data(q.il, oggi), azione: "modifica", dati: { genere: "pesi", id: q.id },
        }))}</div>
      </section>
    </div>`;
}
