import { html } from "../ui/html.js";
import { icona } from "../ui/icone.js";
import { trickDivisi, livelliRaggiunti, LIVELLI, giorniTra } from "../regole.js";
import { data, relativo } from "../tempo.js";
import { tessera, titoloPagina } from "./comuni.js";

export const conTabbar = true;

let mostraImparati = true;

export function render(s, { avviso }) {
  const oggi = s.oggi;
  const nuovo = html`<button class="btn-tondo" type="button" data-azione="nuovo" data-genere="trick" aria-label="Nuovo trick">${icona("plus", 22)}</button>`;

  if (!s.trickOk) {
    return html`${avviso}<div class="pagina">
      ${titoloPagina("Addestramento")}
      <section class="carta partenza">
        <div class="carta-testa"><h2>Manca un passo</h2></div>
        <p>Nel database non c'è ancora la tabella dei trick. Nel SQL Editor di Supabase esegui
        <b>supabase/modifiche/2026-11-17-addestramento.sql</b>, poi riapri l'app.</p>
        <button class="btn secondario largo" type="button" data-azione="riprova">Riprova</button>
      </section>
    </div>`;
  }

  const d = trickDivisi(s.trick);
  const sotto = s.trick.length
    ? `${d.imparati.length} ${d.imparati.length === 1 ? "imparato" : "imparati"} · ${d.inCorso.length} in corso · ${d.daIniziare.length} da iniziare`
    : "Trick e comandi, con i progressi";

  return html`
    ${avviso}
    <div class="pagina addestramento">
      ${titoloPagina("Addestramento", sotto, { azione: nuovo })}

      ${!s.trick.length ? html`
        <section class="carta vuoto-carta">
          ${icona("award", 36, 1.6)}
          <p>Parti dalla lista base: seduto, terra, resta, vieni, lascia, al piede e gli altri, tutti da iniziare.
          Poi sposti quelli che sa già o su cui state lavorando.</p>
          <button class="btn primario" type="button" data-azione="trick-base">${icona("paw", 18)} Carica la lista base</button>
          <button class="btn secondario" type="button" data-azione="nuovo" data-genere="trick">Ne aggiungo uno io</button>
        </section>` : ""}

      ${d.inCorso.length ? html`
        <section class="sezione-trick">
          <h2 class="sezione-titolo">In corso</h2>
          ${d.inCorso.map((t) => cartaTrick(t, oggi))}
        </section>` : ""}

      ${d.daIniziare.length ? html`
        <section class="carta">
          <h2 class="sezione-titolo">Da iniziare</h2>
          <div class="elenco">${d.daIniziare.map((t) => html`
            <div class="trick-riga">
              <button class="riga-testo" type="button" data-azione="modifica" data-genere="trick" data-id="${t.id}">
                <b>${t.nome}</b>${t.comando ? html`<small>«${t.comando}»</small>` : ""}
              </button>
              <button class="btn secondario piccolo" type="button" data-azione="inizia-trick" data-id="${t.id}">Inizia</button>
            </div>`)}</div>
        </section>` : ""}

      ${d.imparati.length ? html`
        <section class="carta">
          <button class="carta-testa interruttore" type="button" data-azione="mostra-imparati" aria-expanded="${mostraImparati}">
            <h2>Imparati <span class="conta">${d.imparati.length}</span></h2>${icona("chevron-down", 18)}
          </button>
          ${mostraImparati ? html`<div class="elenco">${d.imparati.map((t) => html`
            <button class="riga" type="button" data-azione="modifica" data-genere="trick" data-id="${t.id}">
              ${tessera("award", "giallo")}
              <span class="riga-testo"><b>${t.nome}</b><small>${durata(t)}</small></span>
              <span class="riga-fine"><small>${data(t.imparato_il, oggi)}</small></span>
            </button>`)}</div>` : ""}
        </section>` : ""}
    </div>`;
}

/** La carta di un trick in corso: nome, comando e i tre livelli come tasti da spuntare. */
function cartaTrick(t, oggi) {
  const fatti = livelliRaggiunti(t);
  return html`
    <article class="carta trick">
      <button class="trick-testa" type="button" data-azione="modifica" data-genere="trick" data-id="${t.id}">
        <span class="trick-nome"><b>${t.nome}</b>${t.comando ? html`<small>«${t.comando}»</small>` : ""}</span>
        <span class="trick-da">${t.iniziato_il ? `da ${relativo(t.iniziato_il, oggi).replace(" fa", "")}` : ""}</span>
      </button>
      <div class="livelli" style="--fatti:${fatti}">
        ${LIVELLI.map((l) => {
          const il = t[l.colonna];
          return html`
            <button class="livello ${il ? "fatto" : ""}" type="button" data-azione="livello" data-id="${t.id}" data-livello="${l.chiave}"
              aria-pressed="${Boolean(il)}" aria-label="${l.nome}${il ? `, dal ${data(il, oggi)}` : ", segna come raggiunto oggi"}">
              <span class="livello-pallino">${il ? icona("check", 14, 3) : ""}</span>
              <span class="livello-nome">${l.nome}</span>
              <small>${il ? data(il, oggi) : "non ancora"}</small>
            </button>`;
        })}
      </div>
    </article>`;
}

function durata(t) {
  if (!t.iniziato_il || !t.imparato_il) return t.comando ? `«${t.comando}»` : "";
  const g = giorniTra(t.iniziato_il, t.imparato_il);
  const tempo = g <= 0 ? "in un giorno" : g < 14 ? `in ${g + 1} giorni` : `in ${Math.round(g / 7)} settimane`;
  return [t.comando ? `«${t.comando}»` : "", tempo].filter(Boolean).join(" · ");
}

export const azioni = {
  "mostra-imparati": (_el, _e, ridisegna) => { mostraImparati = !mostraImparati; ridisegna(); },
};
