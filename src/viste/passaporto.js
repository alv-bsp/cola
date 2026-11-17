import { html } from "../ui/html.js";
import { icona } from "../ui/icone.js";
import { urlInCache } from "../foto.js";
import { VERSIONE } from "../config.js";
import { compleanno, etaInParole, formatoNumero, posti, GIUDIZI, TIPI_SOGGIORNO } from "../regole.js";
import { data, relativo } from "../tempo.js";
import { nomeCane } from "../stato.js";
import { pillola, tessera, titoloPagina } from "./comuni.js";

export const conTabbar = true;

export const RUOLI = {
  veterinario: { nome: "Veterinario", icona: "stethoscope", tinta: "verde" },
  clinica: { nome: "Clinica", icona: "heart-pulse", tinta: "rosa" },
  ats: { nome: "ATS, anagrafe canina", icona: "id-card", tinta: "blu" },
  "pet-sitter": { nome: "Pet sitter", icona: "house", tinta: "giallo" },
  toelettatura: { nome: "Toelettatura", icona: "paw", tinta: "arancio" },
  addestratore: { nome: "Addestratore", icona: "paw", tinta: "verde" },
  allevatore: { nome: "Allevatore", icona: "paw", tinta: "giallo" },
  altro: { nome: "Altro", icona: "users", tinta: "grigio" },
};

const vuoto = html`<span class="manca">—</span>`;
const valore = (v) => (v == null || v === "" ? vuoto : v);

export function render(s, { avviso }) {
  const p = s.profilo || {};
  const oggi = s.oggi;
  const cp = compleanno(p.nata_il, oggi);
  const src = urlInCache(p.miniatura || p.foto);
  const contatti = [...s.contatti].sort((a, b) =>
    Object.keys(RUOLI).indexOf(a.ruolo) - Object.keys(RUOLI).indexOf(b.ruolo) || a.nome.localeCompare(b.nome, "it"));

  return html`
    ${avviso}
    <div class="pagina">
      ${titoloPagina("Passaporto", p.nata_il ? `${etaInParole(p.nata_il, oggi)}${cp ? `, compleanno ${relativo(cp.il, oggi)}` : ""}` : "")}

      <section class="documento">
        <div class="documento-testa">
          <span>${icona("paw", 16)} Passaporto di casa</span>
          <button class="btn-icona" type="button" data-azione="profilo" data-parte="anagrafica" aria-label="Modifica l'anagrafica">${icona("pencil", 18)}</button>
        </div>
        <div class="documento-corpo">
          <button class="documento-foto" type="button" data-azione="foto-profilo" aria-label="Cambia la foto">
            ${p.foto ? html`<img data-foto="${p.miniatura || p.foto}" ${src ? html`src="${src}"` : ""} alt="" decoding="async">` : icona("camera", 26, 1.8)}
          </button>
          <dl class="documento-dati">
            <div class="largo"><dt>Nome</dt><dd class="nome">${nomeCane()}</dd></div>
            <div class="largo"><dt>Registrata come</dt><dd>${valore(p.nome_registrato)}</dd></div>
            <div><dt>Razza</dt><dd>${valore(p.razza)}</dd></div>
            <div><dt>Sesso</dt><dd>${p.sesso ? (p.sesso === "femmina" ? "Femmina" : "Maschio") : vuoto}</dd></div>
            <div><dt>Nata il</dt><dd>${p.nata_il ? data(p.nata_il) : vuoto}</dd></div>
            <div><dt>A casa dal</dt><dd>${p.presa_il ? data(p.presa_il) : vuoto}</dd></div>
          </dl>
        </div>
        <dl class="documento-dati sotto">
          <div><dt>Microchip</dt><dd class="mono">${valore(p.microchip)}</dd></div>
          <div><dt>Passaporto UE</dt><dd class="mono">${p.passaporto || pillola("da fare", "giallo")}</dd></div>
          <div><dt>Pedigree</dt><dd class="mono">${valore(p.pedigree)}</dd></div>
          <div><dt>Sterilizzata</dt><dd>${p.sterilizzata_il ? data(p.sterilizzata_il) : "No"}</dd></div>
        </dl>
        <div class="mrz" aria-hidden="true">${mrz(p)}</div>
      </section>

      <section class="carta">
        <div class="carta-testa"><h2>Misure</h2>
          <button class="btn-icona" type="button" data-azione="profilo" data-parte="misure" aria-label="Modifica le misure">${icona("pencil", 18)}</button></div>
        <dl class="dati">
          <div><dt>Al garrese</dt><dd>${p.garrese_cm ? `${formatoNumero(p.garrese_cm)} cm` : vuoto}${p.garrese_il ? html` <small>al ${data(p.garrese_il, oggi)}</small>` : ""}</dd></div>
          <div><dt>Collo</dt><dd>${p.collo_cm ? `${formatoNumero(p.collo_cm)} cm` : vuoto}</dd></div>
          <div><dt>Peso da adulta</dt><dd>${p.peso_adulto_min ? `${formatoNumero(p.peso_adulto_min)}–${formatoNumero(p.peso_adulto_max)} kg` : vuoto} <small>stima</small></dd></div>
        </dl>
      </section>

      <section class="carta">
        <div class="carta-testa"><h2>Alimentazione</h2>
          <button class="btn-icona" type="button" data-azione="profilo" data-parte="alimentazione" aria-label="Modifica l'alimentazione">${icona("pencil", 18)}</button></div>
        <dl class="dati">
          <div><dt>Crocchette</dt><dd>${valore(p.crocchette)}</dd></div>
          <div><dt>Razione</dt><dd>${p.razione_g ? `${p.razione_g} g al giorno` : vuoto}</dd></div>
        </dl>
        ${p.pasti ? html`<p class="testo-libero">${p.pasti}</p>` : ""}
      </section>

      <section class="carta">
        <div class="carta-testa"><h2>Contatti</h2>
          <button class="btn-icona" type="button" data-azione="nuovo" data-genere="contatti" aria-label="Nuovo contatto">${icona("plus", 18)}</button></div>
        ${contatti.length ? html`<div class="elenco">${contatti.map(rigaContatto)}</div>`
          : html`<p class="vuoto-testo">Veterinario, pet sitter, toelettatura: un tocco per chiamare.</p>`}
      </section>

      ${sezioneSoggiorni(s)}

      <section class="carta">
        <div class="carta-testa"><h2>Note</h2>
          <button class="btn-icona" type="button" data-azione="profilo" data-parte="note" aria-label="Modifica le note">${icona("pencil", 18)}</button></div>
        ${p.note ? html`<p class="testo-libero">${p.note}</p>` : html`<p class="vuoto-testo">Allergie, abitudini, istruzioni per chi la tiene.</p>`}
      </section>

      <section class="carta account">
        <div class="carta-testa"><h2>Account</h2></div>
        <p class="vuoto-testo">Accesso come <b>${s.sessione?.user?.email || ""}</b>. I dati di ${nomeCane()} li vedete in due.</p>
        <button class="btn secondario largo" type="button" data-azione="esci">${icona("logout", 18)} Esci</button>
        <p class="versione">Versione ${VERSIONE}</p>
      </section>
    </div>`;
}

function rigaContatto(c) {
  const r = RUOLI[c.ruolo] || RUOLI.altro;
  const tel = (c.telefono || "").replace(/[^\d+]/g, "");
  return html`
    <div class="contatto">
      ${tessera(r.icona, r.tinta)}
      <button class="contatto-testo" type="button" data-azione="modifica" data-genere="contatti" data-id="${c.id}">
        <b>${c.nome}</b><small>${[r.nome, c.telefono, c.note].filter(Boolean).join(" · ").slice(0, 110)}</small>
      </button>
      ${tel ? html`<a class="btn-icona vetro" href="tel:${tel}" aria-label="Chiama ${c.nome}">${icona("phone", 18)}</a>` : ""}
      ${c.email ? html`<a class="btn-icona vetro" href="mailto:${c.email}" aria-label="Scrivi a ${c.nome}">${icona("mail", 18)}</a>` : ""}
    </div>`;
}

/** Dog sitter e pensioni: un posto per riga, con il giudizio dell'ultima volta e quante volte ci è stata. */
function sezioneSoggiorni(s) {
  const nuovo = html`<button class="btn-icona" type="button" data-azione="nuovo" data-genere="soggiorni" aria-label="Nuova permanenza">${icona("plus", 18)}</button>`;
  if (!s.soggiorniOk) {
    return html`
      <section class="carta" id="soggiorni">
        <div class="carta-testa"><h2>Dog sitter e pensioni</h2></div>
        <p class="vuoto-testo">Manca la tabella nel database: nel SQL Editor di Supabase esegui
        <b>supabase/modifiche/2026-11-17-soggiorni.sql</b>.</p>
      </section>`;
  }
  const elenco = posti(s.soggiorni);
  return html`
    <section class="carta" id="soggiorni">
      <div class="carta-testa"><h2>Dog sitter e pensioni</h2>${nuovo}</div>
      ${elenco.length ? html`<div class="elenco">${elenco.map((p) => rigaPosto(p, s.oggi))}</div>`
        : html`<p class="vuoto-testo">Ogni volta che sta da qualcuno: chi, in che città, per quanto e com'è andata. Così vi ricordate da chi riportarla.</p>`}
    </section>`;
}

function rigaPosto(p, oggi) {
  const g = p.giudizio ? GIUDIZI[p.giudizio] : null;
  const volte = p.soggiorni.length === 1 ? "una volta" : `${p.soggiorni.length} volte`;
  return html`
    <button class="riga posto" type="button" data-azione="posto" data-chiave="${p.chiave}">
      <span class="tessera giudizio" data-tono="${p.giudizio || "nessuno"}" aria-label="${g ? g.nome : "Senza giudizio"}">${g ? g.emoji : icona(p.tipo === "pensione" ? "bed" : "house", 20)}</span>
      <span class="riga-testo"><b>${p.nome}</b><small>${[TIPI_SOGGIORNO[p.tipo], p.citta, volte].filter(Boolean).join(" · ")}</small></span>
      <span class="riga-fine"><small>${data(p.ultimo.dal, oggi)}</small></span>
      <span class="riga-chevron">${icona("chevron-right", 18)}</span>
    </button>`;
}

/** Le due righe "a lettura ottica" in fondo al documento: solo decorazione, costruite dai dati veri. */
function mrz(p) {
  const pulito = (t) => (t || "").toUpperCase().normalize("NFD").replace(/[^A-Z0-9]+/g, "<");
  const r1 = `P<ITA${pulito(p.nome || "Cola")}<<${pulito(p.nome_registrato)}`.padEnd(40, "<").slice(0, 40);
  const nascita = p.nata_il ? p.nata_il.slice(2).replace(/-/g, "") : "<<<<<<";
  const r2 = `${pulito(p.microchip).padEnd(15, "<").slice(0, 15)}<${nascita}${p.sesso === "maschio" ? "M" : "F"}<${pulito(p.razza)}`.padEnd(40, "<").slice(0, 40);
  return html`<span>${r1}</span><span>${r2}</span>`;
}
