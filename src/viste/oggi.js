import { html } from "../ui/html.js";
import { icona } from "../ui/icone.js";
import { barrePeso, ondaCiclo, scintilla } from "../ui/grafici.js";
import { urlInCache } from "../foto.js";
import {
  andamentoPeso, ciclo, scadenzeSalute, coseDivise, inArrivo, cronologia, etaInParole, eta, compleanno, formatoKg,
  trickDivisi, traguardi, livelliRaggiunti, LIVELLI,
} from "../regole.js";
import { data, relativo } from "../tempo.js";
import { vuoto, nomeCane } from "../stato.js";
import { pillola, tessera, testaCarta, rigaInArrivo, rigaCronologia, URGENZA } from "./comuni.js";

export const conTabbar = true;

export function render(s, { avviso }) {
  if (s.membro === false) return html`${avviso}${nonMembro()}`;
  if (!s.caricato) return html`${avviso}<div class="attesa" aria-busy="true"></div>`;
  const oggi = s.oggi;
  const peso = andamentoPeso(s.pesi, s.profilo, oggi);
  const cl = ciclo(s.calori, oggi);
  const scadenze = scadenzeSalute(s.salute, oggi);
  const cose = coseDivise(s.cose, oggi);
  const arrivo = inArrivo(s, oggi, 5);
  const storia = cronologia(s).slice(0, 4);
  const daDatare = s.diario.filter((d) => !d.il).length;

  return html`
    ${avviso}
    <div class="oggi">
      ${eroe(s, { peso, cl, scadenze })}
      ${vuoto() && s.partenza ? partenza(s.partenza) : ""}
      ${comeSta(s, { peso, cl, scadenze, cose })}
      ${cartaCiclo(cl, oggi)}
      ${cartaPeso(peso)}
      ${cartaAddestramento(s)}
      <section class="carta in-arrivo">
        ${testaCarta("In arrivo", { href: "#/cose", testo: "Da fare" })}
        ${arrivo.length
          ? html`<div class="elenco">${arrivo.map((v) => rigaInArrivo(v, oggi))}</div>`
          : html`<p class="vuoto-testo">Niente in scadenza. Le date di richiami e cose da fare compaiono qui.</p>`}
      </section>
      <section class="carta diario-carta">
        ${testaCarta("Diario", { href: "#/diario" })}
        ${storia.length
          ? html`<div class="elenco">${storia.map((v) => rigaCronologia(v, oggi))}</div>`
          : html`<p class="vuoto-testo">Pesate, vaccini, calori e note finiscono qui, dal più recente.</p>`}
        ${daDatare ? html`<a class="da-datare" href="#/diario">${icona("calendar", 16)} ${daDatare === 1 ? "Una tappa da datare" : `${daDatare} tappe da datare`}</a>` : ""}
      </section>
    </div>`;
}

// ───────────────────────────────────────── ritratto
function eroe(s, { peso, cl, scadenze }) {
  const p = s.profilo;
  const nome = nomeCane();
  const e = eta(p?.nata_il, s.oggi);
  const cp = compleanno(p?.nata_il, s.oggi);
  const sotto = [
    p?.razza,
    e ? etaInParole(p.nata_il, s.oggi) : null,
  ].filter(Boolean).join(" · ");
  const stato = statoGenerale(cl, scadenze, s.oggi);
  const src = urlInCache(p?.foto);

  return html`
    <section class="eroe">
      <div class="eroe-testo">
        <h1>Il diario<br><em>di ${nome}</em></h1>
        <p>${sotto || "Il suo diario e il suo passaporto."}${cp && cp.mancano <= 60 ? html`<br>Compie ${cp.anni === 1 ? "un anno" : `${cp.anni} anni`} ${relativo(cp.il, s.oggi)}.` : ""}</p>
      </div>
      <div class="ritratto">
        <div class="anelli" aria-hidden="true"><i></i><i></i><i></i><b></b><b></b><b></b></div>
        <button class="ritratto-foto" type="button" data-azione="foto-profilo" aria-label="${p?.foto ? `Cambia la foto di ${nome}` : `Aggiungi una foto di ${nome}`}">
          ${p?.foto
            ? html`<img data-foto="${p.foto}" ${src ? html`src="${src}"` : ""} alt="${nome}" decoding="async">`
            : html`<span class="ritratto-vuoto">${icona("paw", 54, 1.6)}<small>Aggiungi una foto</small></span>`}
        </button>
        ${peso ? html`
          <a class="chip-vetro chip-peso" href="#/peso">
            ${tessera("weight", "verde", 18)}
            <span><small>Peso</small><b>${formatoKg(peso.ultimo.kg)} kg</b></span>
            ${scintilla(peso.elenco)}
          </a>` : ""}
        ${e ? html`
          <a class="chip-vetro chip-eta" href="#/passaporto">
            ${tessera("cake", "rosa", 18)}
            <span><small>Età</small><b>${e.anni ? `${e.anni} ${e.anni === 1 ? "anno" : "anni"}` : `${e.mesiTotali} mesi`}</b></span>
          </a>` : ""}
        <span class="stato-pill" data-tono="${stato.tono}">${stato.testo}</span>
      </div>
    </section>`;
}

/** Il messaggio sotto il ritratto: la cosa più importante adesso. */
function statoGenerale(cl, scadenze, oggi) {
  if (cl?.inCorso) return { testo: `In calore · giorno ${cl.giorno}`, tono: "rosa" };
  if (cl?.sorveglianza?.attiva) return { testo: `Occhio fino al ${data(cl.sorveglianza.al, oggi)}`, tono: "giallo" };
  const ritardo = scadenze.filter((x) => x.urgenza === "ritardo").length;
  if (ritardo) return { testo: ritardo === 1 ? "Una scadenza passata" : `${ritardo} scadenze passate`, tono: "rosso" };
  return { testo: "Tutto in ordine", tono: "verde" };
}

// ───────────────────────────────────────── come sta
function comeSta(s, { peso, cl, scadenze, cose }) {
  const oggi = s.oggi;
  const protezione = scadenze.find((x) => x.tipo === "antiparassitario");
  const posizione = { dentro: ["In linea", "verde"], sopra: ["Sopra", "giallo"], sotto: ["Sotto", "giallo"] }[peso?.posizione];

  const calore = !cl ? { valore: "Da segnare", pl: "" }
    : cl.inCorso ? { valore: `Giorno ${cl.giorno}`, pl: pillola("In corso", "rosa") }
    : cl.sorveglianza?.attiva ? { valore: `~${relativo(cl.prossimo.il, oggi).replace("tra ", "")}`, pl: pillola("Sorveglia", "giallo") }
    : { valore: `~${relativo(cl.prossimo.il, oggi).replace("tra ", "")}`, pl: pillola("Stima", "grigio") };

  const daFare = cose.ritardo.length ? pillola(`${cose.ritardo.length} in ritardo`, "rosso")
    : cose.presto.length ? pillola(`${cose.presto.length} a breve`, "giallo")
    : pillola("In pari", "verde");

  return html`
    <section class="carta come-sta">
      ${testaCarta("Come sta", { href: "#/salute", testo: "Salute" })}
      <div class="griglia-tessere">
        <a class="tessera-grande" href="#/peso">
          ${tessera("weight", "verde")}
          <span class="tg-testo"><small>Peso</small><b>${peso ? `${formatoKg(peso.ultimo.kg)} kg` : "Da pesare"}</b></span>
          ${posizione ? pillola(...posizione) : peso?.delta != null ? pillola(`${peso.delta >= 0 ? "+" : "−"}${formatoKg(Math.abs(peso.delta))}`, "verde") : ""}
        </a>
        <a class="tessera-grande" href="#/salute">
          ${tessera("flame", "rosa")}
          <span class="tg-testo"><small>Calore</small><b>${calore.valore}</b></span>
          ${calore.pl}
        </a>
        <button class="tessera-grande" type="button" ${protezione ? html`data-azione="gruppo" data-chiave="${protezione.chiave}"` : html`data-azione="nuovo" data-genere="salute" data-tipo="antiparassitario"`}>
          ${tessera("shield", "blu")}
          <span class="tg-testo"><small>Antiparassitario</small><b>${protezione ? relativo(protezione.il, oggi, { scaduto: true }) : "Da segnare"}</b></span>
          ${protezione ? pillola(URGENZA[protezione.urgenza].testo, URGENZA[protezione.urgenza].tono) : ""}
        </button>
        <a class="tessera-grande" href="#/cose">
          ${tessera("list-checks", "giallo")}
          <span class="tg-testo"><small>Da fare</small><b>${cose.aperte === 1 ? "1 aperta" : `${cose.aperte} aperte`}</b></span>
          ${daFare}
        </a>
      </div>
    </section>`;
}

// ───────────────────────────────────────── ciclo
function cartaCiclo(cl, oggi) {
  if (!cl) {
    return html`
      <section class="carta ciclo">
        <div class="ciclo-testa">
          <div><h2>Ciclo</h2><p>Segna l'inizio del calore: l'app stima il prossimo e la finestra da sorvegliare.</p></div>
          <button class="btn-tondo" type="button" data-azione="inizio-calore" aria-label="Segna l'inizio del calore">${icona("plus", 22)}</button>
        </div>
      </section>`;
  }
  const sotto = cl.inCorso
    ? `In calore da ${cl.giorno === 1 ? "oggi" : `${cl.giorno} giorni`}, dal ${data(cl.ultimo.inizio, oggi)}`
    : `Ultimo dal ${data(cl.ultimo.inizio, oggi)} al ${data(cl.fine, oggi)}${cl.fineStimata ? " (fine stimata)" : ""}`;
  const bottone = cl.inCorso
    ? html`<button class="btn-tondo" type="button" data-azione="fine-calore" aria-label="Segna la fine del calore">${icona("check", 22)}</button>`
    : html`<button class="btn-tondo" type="button" data-azione="inizio-calore" aria-label="Segna l'inizio di un nuovo calore">${icona("plus", 22)}</button>`;
  return html`
    <section class="carta ciclo">
      <div class="ciclo-testa">
        <div><h2>Ciclo</h2><p>${sotto}</p></div>
        ${bottone}
      </div>
      ${ondaCiclo(cl, oggi)}
      ${cl.sorveglianza?.attiva ? html`
        <p class="ciclo-nota">${icona("alert", 16)}<span>Fino al ${data(cl.sorveglianza.al, oggi)} occhio alla piometra:
          perdite vaginali, sete molto aumentata, abbattimento. Se compaiono, veterinario subito.</span></p>` : ""}
      ${cl.fineStimata ? html`<button class="ciclo-link" type="button" data-azione="modifica" data-genere="calori" data-id="${cl.ultimo.id}">Segna la fine vera</button>` : ""}
      <div class="ciclo-piede">
        <span>${icona("flame", 16)} Prossimo calore</span>
        <b>${cl.inCorso ? "—" : `~${data(cl.prossimo.il, oggi)}`}</b>
      </div>
    </section>`;
}

// ───────────────────────────────────────── peso
function cartaPeso(peso) {
  if (!peso) {
    return html`
      <button class="carta peso-carta vuota" type="button" data-azione="nuovo" data-genere="pesi">
        <div class="carta-testa"><h2>Peso</h2></div>
        <p>Nessuna pesata. Tocca per aggiungere la prima.</p>
      </button>`;
  }
  return html`
    <a class="carta peso-carta" href="#/peso">
      <div class="carta-testa"><h2>Peso</h2><span class="pillola-chiara">${peso.elenco.length > 7 ? "Ultime 7" : "Tutte"} ${icona("chevron-right", 14)}</span></div>
      ${barrePeso(peso.elenco)}
    </a>`;
}

// ───────────────────────────────────────── addestramento
function cartaAddestramento(s) {
  if (!s.trickOk) return "";
  const d = trickDivisi(s.trick);
  const ultimo = traguardi(s.trick)[0];
  return html`
    <section class="carta addestramento-carta">
      ${testaCarta("Addestramento", { href: "#/addestramento", testo: "Trick" })}
      ${d.inCorso.length ? html`<div class="elenco">${d.inCorso.slice(0, 3).map((t) => html`
        <a class="trick-mini" href="#/addestramento">
          <b>${t.nome}</b>
          <span class="passi" aria-label="${livelliRaggiunti(t)} livelli su ${LIVELLI.length}">
            ${LIVELLI.map((l) => html`<i class="${t[l.colonna] ? "fatto" : ""}" title="${l.nome}"></i>`)}
          </span>
        </a>`)}</div>`
        : html`<p class="vuoto-testo">${s.trick.length ? "Nessun trick in corso: scegline uno da iniziare." : "Segna i trick che state insegnando e i progressi, in casa, fuori e con le distrazioni."}</p>`}
      ${ultimo ? html`<p class="traguardo">${icona("award", 16)} <span>${ultimo.titolo}, ${relativo(ultimo.il, s.oggi)}</span></p>` : ""}
      <p class="conta-trick">${d.imparati.length} ${d.imparati.length === 1 ? "imparato" : "imparati"} · ${d.inCorso.length} in corso · ${d.daIniziare.length} da iniziare</p>
    </section>`;
}

// ───────────────────────────────────────── stati vuoti
function partenza(fase) {
  if (fase === "in corso") {
    return html`<section class="carta partenza"><p>${icona("paw", 18)} Carico i dati di Cola…</p></section>`;
  }
  return html`
    <section class="carta partenza">
      ${testaCarta("Dati di partenza")}
      <p>Non sono riuscito a caricare i dati di Cola (anagrafica, pesate, primo calore, contatti, cose da fare). Riprova
      quando sei online.</p>
      <button class="btn primario largo" type="button" data-azione="partenza">${icona("paw", 18)} Riprova</button>
    </section>`;
}

function nonMembro() {
  return html`
    <section class="carta partenza">
      ${testaCarta("Manca un passo")}
      <p>Il tuo utente non è tra i membri di Cola. Nel SQL Editor di Supabase esegui l'ultima parte di
      <b>supabase/schema.sql</b> (Membri), poi riapri l'app.</p>
      <button class="btn secondario largo" type="button" data-azione="riprova">Riprova</button>
    </section>`;
}
