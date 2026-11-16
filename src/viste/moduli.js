import { html, raw } from "../ui/html.js";
import { icona } from "../ui/icone.js";
import { apriFoglio, chiudiFoglio, toast } from "../ui/avvisi.js";
import { stato, trova, veterinari } from "../stato.js";
import { salva, elimina, ripristina, salvaProfilo, segnaCosa, messaggioErrore } from "../dati.js";
import {
  TIPI, SUGGERIMENTI, prossimoSuggerito, mesiSuggeriti, aggiungiGiorni, aggiungiMesi, giorniTra, gruppi, ciclo, urgenza,
} from "../regole.js";
import { data, relativo } from "../tempo.js";
import { RUOLI } from "./passaporto.js";
import { pillolaScadenza, riga, tessera } from "./comuni.js";

// Tutti i moduli vivono nel foglio che sale dal basso. Un modulo è un <form data-form="genere">: l'invio passa da
// invia(), la cancellazione da elimina con Annulla nel messaggio.

// ───────────────────────────────────────── pezzi
const testa = (titolo) => html`
  <div class="maniglia" aria-hidden="true"></div>
  <div class="foglio-testa">
    <h2 id="foglio-titolo">${titolo}</h2>
    <button class="btn-icona" type="button" data-azione="chiudi-foglio" aria-label="Chiudi">${icona("x", 20)}</button>
  </div>`;

const campo = (etichetta, controllo, aiuto = "") => html`
  <label class="campo"><span>${etichetta}</span>${controllo}${aiuto ? html`<small class="aiuto">${aiuto}</small>` : ""}</label>`;

// attr sono attributi scritti qui nel codice (mai dati): passano così come sono.
const testo = (nome, valore, attr = "") => html`<input type="text" name="${nome}" value="${valore ?? ""}" ${raw(attr)}>`;
const giorno = (nome, valore, attr = "") => html`<input type="date" name="${nome}" value="${valore ?? ""}" ${raw(attr)}>`;
// max = il limite di caratteri della colonna in supabase/schema.sql
const area = (nome, valore, righe = 3, max = 1000) => html`<textarea name="${nome}" rows="${righe}" maxlength="${max}">${valore ?? ""}</textarea>`;
const numero = (nome, valore, attr = "") =>
  html`<input type="text" inputmode="decimal" name="${nome}" value="${valore != null && valore !== "" ? String(valore).replace(".", ",") : ""}" ${raw(attr)}>`;

/** Scelte a pillola (radio). */
const scelte = (nome, opzioni, scelta, input = "") => html`
  <div class="scelte" role="radiogroup">
    ${opzioni.map(([valore, etichetta]) => html`
      <label class="chip"><input type="radio" name="${nome}" value="${valore}" ${valore === scelta ? "checked" : ""} ${input ? html`data-input="${input}"` : ""}>${etichetta}</label>`)}
  </div>`;

/** Scorciatoie che riempiono un campo data: data-giorni o data-mesi da oggi (o dalla data di riferimento). */
const scorciatoie = (campoData, voci) => html`
  <div class="scorciatoie">
    ${voci.map(([etichetta, attr]) => html`<button class="chip piccolo" type="button" data-azione="scorciatoia" data-campo="${campoData}" ${raw(attr)}>${etichetta}</button>`)}
  </div>`;

const piede = (genere, r) => html`
  <p class="errore" role="alert" hidden></p>
  <div class="foglio-azioni">
    ${r?.id
      ? html`<button class="btn secondario" type="button" data-azione="elimina" data-genere="${genere}" data-id="${r.id}">${icona("trash", 18)} Elimina</button>`
      : html`<button class="btn secondario" type="button" data-azione="chiudi-foglio">Annulla</button>`}
    <button class="btn primario" type="submit">Salva</button>
  </div>`;

// ───────────────────────────────────────── moduli
const MODULI = {
  pesi: (r) => html`
    ${testa(r.id ? "Pesata" : "Nuova pesata")}
    ${campo("Peso in kg", numero("kg", r.kg, 'placeholder="20,5" required'))}
    ${campo("Giorno", giorno("il", r.il, "required"))}
    ${campo("Nota", testo("nota", r.nota, 'placeholder="dal veterinario, a casa…" maxlength="300"'))}`,

  calori: (r) => html`
    ${testa(r.id ? "Calore" : "Inizio del calore")}
    ${campo("Inizio", giorno("inizio", r.inizio, "required"), "Il primo giorno di sanguinamento.")}
    ${campo("Fine", giorno("fine", r.fine), "Vuota finché è in corso. Di solito dura due o tre settimane.")}
    ${campo("Note", area("note", r.note))}`,

  salute: (r) => {
    const suggerito = prossimoSuggerito(r.tipo, r.nome, r.il);
    return html`
      ${testa(r.id ? TIPI[r.tipo]?.nome || "Salute" : `Nuovo: ${(TIPI[r.tipo]?.nome || "evento").toLowerCase()}`)}
      <div class="campo"><span>Tipo</span>
        ${scelte("tipo", Object.entries(TIPI).map(([k, t]) => [k, t.nome]), r.tipo, "salute")}</div>
      ${campo("Nome", html`<input type="text" name="nome" value="${r.nome ?? ""}" list="sugg-nome" required maxlength="80" autocomplete="off" data-input="salute">
        <datalist id="sugg-nome">${(SUGGERIMENTI[r.tipo] || []).map((n) => html`<option value="${n}"></option>`)}</datalist>`)}
      ${campo("Fatto il", giorno("il", r.il, 'required data-input="salute"'))}
      <label class="campo"><span>Prossima dose o richiamo</span>
        <input type="date" name="prossimo_il" value="${r.prossimo_il ?? ""}" data-input="prossimo" ${r.id ? html`data-toccato="1"` : ""}>
        <small class="aiuto" data-suggerimento>${testoSuggerito(r.tipo, r.nome, suggerito)}</small>
      </label>
      ${scorciatoie("prossimo_il", [["1 mese", 'data-mesi="1" data-da="il"'], ["3 mesi", 'data-mesi="3" data-da="il"'], ["6 mesi", 'data-mesi="6" data-da="il"'], ["1 anno", 'data-mesi="12" data-da="il"'], ["Nessuna", 'data-vuota="1"']])}
      ${campo("Veterinario", html`<input type="text" name="veterinario" value="${r.veterinario ?? ""}" list="sugg-vet" maxlength="80" autocomplete="off">
        <datalist id="sugg-vet">${veterinari().map((n) => html`<option value="${n}"></option>`)}</datalist>`)}
      ${campo("Note", area("note", r.note, 3, 2000), r.tipo === "visita" ? "Cosa ha detto, cosa ha prescritto, quanto è costata." : "")}`;
  },

  cose: (r) => html`
    ${testa(r.id ? "Cosa da fare" : "Nuova cosa da fare")}
    ${campo("Cosa", testo("testo", r.testo, 'required maxlength="160"'))}
    ${campo("Entro", giorno("entro", r.entro))}
    ${scorciatoie("entro", [["Oggi", 'data-giorni="0"'], ["Domani", 'data-giorni="1"'], ["Tra una settimana", 'data-giorni="7"'], ["Tra un mese", 'data-mesi="1"'], ["Nessuna data", 'data-vuota="1"']])}
    ${campo("Nota", area("nota", r.nota))}
    ${r.fatta_il ? html`<p class="aiuto">Fatta il ${data(r.fatta_il.slice(0, 10))}.</p>` : ""}`,

  diario: (r) => html`
    ${testa(r.id ? "Nota" : "Nuova nota")}
    ${campo("Titolo", testo("titolo", r.titolo, 'required maxlength="120" placeholder="Prima volta al lago"'))}
    ${campo("Giorno", giorno("il", r.il), "Se non lo ricordi lasciala vuota: la tappa resta in cima al Diario, da datare.")}
    ${campo("Racconto", area("testo", r.testo, 5, 4000))}`,

  contatti: (r) => html`
    ${testa(r.id ? "Contatto" : "Nuovo contatto")}
    ${campo("Ruolo", html`<select name="ruolo">${Object.entries(RUOLI).map(([k, v]) => html`<option value="${k}" ${k === r.ruolo ? "selected" : ""}>${v.nome}</option>`)}</select>`)}
    ${campo("Nome", testo("nome", r.nome, 'required maxlength="80"'))}
    ${campo("Telefono", html`<input type="tel" name="telefono" value="${r.telefono ?? ""}" maxlength="40" autocomplete="off">`)}
    ${campo("Email", html`<input type="email" name="email" value="${r.email ?? ""}" maxlength="120" autocapitalize="off" spellcheck="false" autocomplete="off">`)}
    ${campo("Indirizzo", testo("indirizzo", r.indirizzo, 'maxlength="200"'))}
    ${campo("Note", area("note", r.note))}`,
};

function testoSuggerito(tipo, nome, suggerito) {
  if (!suggerito) return "Facoltativa. Le scorciatoie qui sotto contano dal giorno in cui l'hai fatto.";
  const mesi = mesiSuggeriti(tipo, nome);
  return `Di solito dopo ${mesi === 1 ? "un mese" : mesi === 12 ? "un anno" : `${mesi} mesi`}: ${data(suggerito)}. Controlla sul foglietto o col veterinario.`;
}

const PROFILO = {
  anagrafica: (p) => html`
    ${testa("Anagrafica")}
    ${campo("Nome", testo("nome", p.nome || "Cola", 'required maxlength="40"'))}
    ${campo("Nome registrato", testo("nome_registrato", p.nome_registrato, 'maxlength="80"'))}
    ${campo("Razza", testo("razza", p.razza, 'maxlength="60"'))}
    <div class="campo"><span>Sesso</span>${scelte("sesso", [["femmina", "Femmina"], ["maschio", "Maschio"]], p.sesso)}</div>
    <div class="due">
      ${campo("Nata il", giorno("nata_il", p.nata_il))}
      ${campo("A casa dal", giorno("presa_il", p.presa_il))}
    </div>
    ${campo("Da dove", testo("provenienza", p.provenienza, 'maxlength="120" placeholder="allevamento, città"'))}
    ${campo("Microchip", html`<input type="text" name="microchip" value="${p.microchip ?? ""}" inputmode="numeric" maxlength="40" autocomplete="off">`, "15 cifre, sul certificato di iscrizione all'anagrafe.")}
    ${campo("Passaporto europeo", testo("passaporto", p.passaporto, 'maxlength="40" placeholder="IT…"'))}
    ${campo("Pedigree ENCI", testo("pedigree", p.pedigree, 'maxlength="60"'))}
    ${campo("Sterilizzata il", giorno("sterilizzata_il", p.sterilizzata_il), "Vuoto se non è sterilizzata.")}`,

  misure: (p) => html`
    ${testa("Misure")}
    <div class="due">
      ${campo("Garrese (cm)", numero("garrese_cm", p.garrese_cm))}
      ${campo("Misurata il", giorno("garrese_il", p.garrese_il))}
    </div>
    ${campo("Collo (cm)", numero("collo_cm", p.collo_cm))}
    <div class="due">
      ${campo("Peso adulto min (kg)", numero("peso_adulto_min", p.peso_adulto_min))}
      ${campo("max (kg)", numero("peso_adulto_max", p.peso_adulto_max))}
    </div>
    <p class="aiuto">Il peso adulto stimato disegna la fascia nel grafico del peso e serve per le tabelle delle crocchette.</p>`,

  alimentazione: (p) => html`
    ${testa("Alimentazione")}
    ${campo("Crocchette", testo("crocchette", p.crocchette, 'maxlength="120"'))}
    ${campo("Razione (g al giorno)", html`<input type="text" inputmode="numeric" name="razione_g" value="${p.razione_g ?? ""}">`)}
    ${campo("Pasti e regole", area("pasti", p.pasti, 4, 300))}`,

  note: (p) => html`
    ${testa("Note")}
    ${campo("Note", area("note", p.note, 8, 4000), "Allergie, abitudini, istruzioni per chi la tiene.")}`,
};

// ───────────────────────────────────────── apertura
const NUOVO = {
  pesi: () => ({ il: stato.oggi }),
  calori: () => ({ inizio: stato.oggi }),
  salute: () => ({ tipo: "vaccino", il: stato.oggi }),
  cose: () => ({}),
  diario: () => ({ il: stato.oggi }),
  contatti: () => ({ ruolo: "veterinario" }),
};

/** Apre il modulo di un genere: nuovo (con valori di partenza) o in modifica (con l'id). */
export function apri(genere, { id = null, preset = {} } = {}) {
  const r = id ? trova(genere, id) : null;
  if (id && !r) return;
  const v = { ...NUOVO[genere](), ...(r || {}), ...preset };
  if (genere === "salute" && !r && !("prossimo_il" in preset)) v.prossimo_il = prossimoSuggerito(v.tipo, v.nome || "", v.il);
  apriFoglio(html`<form class="modulo" data-form="${genere}" novalidate>
    <input type="hidden" name="id" value="${r?.id || ""}">
    ${MODULI[genere](v)}
    ${piede(genere, r)}
  </form>`, `modulo-${genere}`);
}

export function apriProfilo(parte) {
  const p = stato.profilo || {};
  apriFoglio(html`<form class="modulo" data-form="profilo" data-parte="${parte}" novalidate>
    ${PROFILO[parte](p)}
    <p class="errore" role="alert" hidden></p>
    <div class="foglio-azioni">
      <button class="btn secondario" type="button" data-azione="chiudi-foglio">Annulla</button>
      <button class="btn primario" type="submit">Salva</button>
    </div>
  </form>`, "profilo");
}

/** Il foglio del +: cosa vuoi aggiungere. */
export function apriAggiungi() {
  const voci = [
    ["Peso", "weight", "verde", 'data-azione="nuovo" data-genere="pesi"'],
    ["Vaccino", "syringe", "blu", 'data-azione="nuovo" data-genere="salute" data-tipo="vaccino"'],
    ["Antiparassitario", "shield", "verde", 'data-azione="nuovo" data-genere="salute" data-tipo="antiparassitario"'],
    ["Visita", "stethoscope", "verde", 'data-azione="nuovo" data-genere="salute" data-tipo="visita"'],
    ["Calore", "flame", "rosa", 'data-azione="inizio-calore"'],
    ["Da fare", "list-checks", "giallo", 'data-azione="nuovo" data-genere="cose"'],
    ["Nota", "notebook", "giallo", 'data-azione="nuovo" data-genere="diario"'],
    ["Contatto", "users", "grigio", 'data-azione="nuovo" data-genere="contatti"'],
  ];
  apriFoglio(html`
    ${testa("Aggiungi")}
    <div class="griglia-aggiungi">
      ${voci.map(([nome, ic, tinta, attr]) => html`<button class="voce-aggiungi" type="button" ${raw(attr)}>${tessera(ic, tinta, 22)}<span>${nome}</span></button>`)}
    </div>`, "aggiungi");
}

/** Storia di un vaccino o di un trattamento, con "Fatto oggi" che ripete lo stesso ritmo. */
export function apriGruppo(chiave) {
  const g = gruppi(stato.salute).find((x) => x.chiave === chiave);
  if (!g) return;
  const oggi = stato.oggi;
  const t = TIPI[g.tipo];
  const mancano = g.prossimo ? giorniTra(oggi, g.prossimo) : null;
  apriFoglio(html`
    ${testa(g.nome)}
    <div class="gruppo-testa">
      ${tessera(t.icona, t.tinta, 22)}
      <div><b>${t.nome}</b><small>Ultima volta ${data(g.ultimo.il, oggi)}${g.ultimo.veterinario ? `, ${g.ultimo.veterinario}` : ""}</small></div>
    </div>
    ${g.prossimo ? html`<p class="gruppo-prossimo"><span>Prossima: <b>${data(g.prossimo, oggi)}</b>, ${relativo(g.prossimo, oggi, { scaduto: true })}</span>
      ${pillolaScadenza(mancano, urgenza(mancano, (mesiSuggeriti(g.tipo, g.nome) ?? 12) <= 1 ? 7 : 14))}</p>` : ""}
    <button class="btn primario largo" type="button" data-azione="rinnova" data-chiave="${g.chiave}">${icona("check", 18)} Fatto oggi</button>
    <h3 class="sezione-titolo">Storia</h3>
    <div class="elenco">${g.eventi.map((e) => riga({
      icona: t.icona, tinta: t.tinta, titolo: data(e.il, oggi),
      sotto: [e.prossimo_il ? `prossima ${data(e.prossimo_il, oggi)}` : "", e.veterinario, e.note].filter(Boolean).join(" · ").slice(0, 100),
      azione: "modifica", dati: { genere: "salute", id: e.id },
    }))}</div>`, "gruppo");
}

/** Nuovo evento dello stesso gruppo, oggi, con lo stesso intervallo dell'ultima volta. */
export function rinnova(chiave) {
  const g = gruppi(stato.salute).find((x) => x.chiave === chiave);
  if (!g) return;
  const oggi = stato.oggi;
  let prossimo = prossimoSuggerito(g.tipo, g.nome, oggi);
  if (g.ultimo.prossimo_il) {
    const giorni = giorniTra(g.ultimo.il, g.ultimo.prossimo_il);
    const mesi = Math.round(giorni / 30.44);
    prossimo = mesi >= 1 && Math.abs(giorni - mesi * 30.44) <= 3 ? aggiungiMesi(oggi, mesi) : aggiungiGiorni(oggi, giorni);
  }
  apri("salute", { preset: { tipo: g.tipo, nome: g.nome, il: oggi, prossimo_il: prossimo, veterinario: g.ultimo.veterinario } });
}

export function inizioCalore() {
  apri("calori", { preset: { inizio: stato.oggi } });
}

export function fineCalore() {
  const cl = ciclo(stato.calori, stato.oggi);
  if (!cl || cl.ultimo.fine) return inizioCalore();
  apri("calori", { id: cl.ultimo.id, preset: { fine: cl.inCorso ? stato.oggi : cl.fine } });
}

// ───────────────────────────────────────── modifiche dal vivo
/** Tipo, nome o giorno cambiati nel modulo di salute: suggerimenti e prossima dose seguono, se non l'hai toccata. */
function aggiornaSalute(form) {
  const campi = form.elements;
  const tipo = form.querySelector("input[name=tipo]:checked")?.value || "altro";
  const nome = campi.nome.value;
  const il = campi.il.value;
  const lista = form.querySelector("#sugg-nome");
  if (lista.dataset.tipo !== tipo) {
    lista.dataset.tipo = tipo;
    lista.innerHTML = String(html`${(SUGGERIMENTI[tipo] || []).map((n) => html`<option value="${n}"></option>`)}`);
    const titolo = document.getElementById("foglio-titolo");
    if (titolo && !campi.id.value) titolo.textContent = `Nuovo: ${TIPI[tipo].nome.toLowerCase()}`;
  }
  const suggerito = prossimoSuggerito(tipo, nome, il);
  form.querySelector("[data-suggerimento]").textContent = testoSuggerito(tipo, nome, suggerito);
  if (!campi.prossimo_il.dataset.toccato) campi.prossimo_il.value = suggerito || "";
}

export const input = {
  salute: (el) => aggiornaSalute(el.form),
  prossimo: (el) => { el.dataset.toccato = "1"; },
};

/** Le scorciatoie delle date: da oggi, o dal giorno indicato da data-da. */
export function scorciatoia(el) {
  const form = el.closest("form");
  const campoData = form.elements[el.dataset.campo];
  if (el.dataset.vuota) campoData.value = "";
  else {
    const base = (el.dataset.da && form.elements[el.dataset.da]?.value) || stato.oggi;
    campoData.value = el.dataset.mesi ? aggiungiMesi(base, +el.dataset.mesi) : aggiungiGiorni(base, +el.dataset.giorni || 0);
  }
  campoData.dataset.toccato = "1";
}

// ───────────────────────────────────────── invio
const pulito = (v) => (typeof v === "string" ? v.trim() || null : v ?? null);
const daNumero = (v) => {
  const t = pulito(v);
  if (t == null) return null;
  const n = Number(String(t).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

/** Valida e converte i campi di un modulo. Lancia un Error con il messaggio da mostrare. */
function riga_(genere, f) {
  const id = pulito(f.id);
  const r = { ...(id ? { id } : {}) };
  const richiedi = (cond, msg) => { if (!cond) throw new Error(msg); };
  switch (genere) {
    case "pesi": {
      const kg = daNumero(f.kg);
      richiedi(kg > 0 && kg < 100, "Scrivi il peso in kg, per esempio 20,5.");
      richiedi(f.il, "Manca il giorno.");
      return { ...r, kg: Math.round(kg * 10) / 10, il: f.il, nota: pulito(f.nota) };
    }
    case "calori":
      richiedi(f.inizio, "Manca l'inizio.");
      richiedi(!f.fine || f.fine >= f.inizio, "La fine viene prima dell'inizio.");
      return { ...r, inizio: f.inizio, fine: pulito(f.fine), note: pulito(f.note) };
    case "salute":
      richiedi(TIPI[f.tipo], "Scegli il tipo.");
      richiedi(pulito(f.nome), "Manca il nome.");
      richiedi(f.il, "Manca il giorno.");
      richiedi(!f.prossimo_il || f.prossimo_il > f.il, "La prossima dose deve venire dopo.");
      return { ...r, tipo: f.tipo, nome: pulito(f.nome), il: f.il, prossimo_il: pulito(f.prossimo_il), veterinario: pulito(f.veterinario), note: pulito(f.note) };
    case "cose":
      richiedi(pulito(f.testo), "Scrivi cosa c'è da fare.");
      return { ...r, testo: pulito(f.testo), entro: pulito(f.entro), nota: pulito(f.nota) };
    case "diario":
      richiedi(pulito(f.titolo), "Manca il titolo.");
      return { ...r, titolo: pulito(f.titolo), il: pulito(f.il), testo: pulito(f.testo) };
    case "contatti":
      richiedi(pulito(f.nome), "Manca il nome.");
      return { ...r, ruolo: f.ruolo || "altro", nome: pulito(f.nome), telefono: pulito(f.telefono), email: pulito(f.email), indirizzo: pulito(f.indirizzo), note: pulito(f.note) };
    default:
      throw new Error("Modulo sconosciuto.");
  }
}

function campiProfilo(parte, f) {
  const n = (k) => {
    const v = daNumero(f[k]);
    if (Number.isNaN(v)) throw new Error("Controlla i numeri: usa solo cifre e la virgola.");
    return v;
  };
  switch (parte) {
    case "anagrafica":
      if (!pulito(f.nome)) throw new Error("Manca il nome.");
      return {
        nome: pulito(f.nome), nome_registrato: pulito(f.nome_registrato), razza: pulito(f.razza), sesso: pulito(f.sesso),
        nata_il: pulito(f.nata_il), presa_il: pulito(f.presa_il), provenienza: pulito(f.provenienza),
        microchip: pulito(f.microchip), passaporto: pulito(f.passaporto), pedigree: pulito(f.pedigree), sterilizzata_il: pulito(f.sterilizzata_il),
      };
    case "misure": {
      const c = { garrese_cm: n("garrese_cm"), garrese_il: pulito(f.garrese_il), collo_cm: n("collo_cm"), peso_adulto_min: n("peso_adulto_min"), peso_adulto_max: n("peso_adulto_max") };
      if (c.peso_adulto_min && c.peso_adulto_max && c.peso_adulto_min > c.peso_adulto_max) throw new Error("Il peso minimo è più alto del massimo.");
      return c;
    }
    case "alimentazione": {
      const g = n("razione_g");
      return { crocchette: pulito(f.crocchette), razione_g: g == null ? null : Math.round(g), pasti: pulito(f.pasti) };
    }
    case "note":
      return { note: pulito(f.note) };
    default:
      throw new Error("Modulo sconosciuto.");
  }
}

let inviando = false;

export async function invia(form) {
  if (inviando) return;
  const genere = form.dataset.form;
  const errore = form.querySelector(".errore");
  const bottone = form.querySelector("button[type=submit]");
  const f = Object.fromEntries(new FormData(form));
  let r;
  try {
    r = genere === "profilo" ? campiProfilo(form.dataset.parte, f) : riga_(genere, f);
  } catch (e) {
    errore.innerHTML = String(html`${icona("alert", 18)}<span>${e.message}</span>`);
    errore.hidden = false;
    return;
  }
  inviando = true;
  bottone.disabled = true;
  bottone.textContent = "Salvo…";
  try {
    if (genere === "profilo") await salvaProfilo(r);
    else await salva(genere, r);
    chiudiFoglio();
    toast(r.id ? "Modifiche salvate" : genere === "profilo" ? "Salvato" : CONFERME[genere]);
  } catch (e) {
    console.error("salvataggio", e);
    errore.innerHTML = String(html`${icona("alert", 18)}<span>${messaggioErrore(e)}</span>`);
    errore.hidden = false;
    bottone.disabled = false;
    bottone.textContent = "Salva";
  } finally {
    inviando = false;
  }
}

const CONFERME = {
  pesi: "Pesata aggiunta",
  calori: "Calore segnato",
  salute: "Segnato",
  cose: "Aggiunta alle cose da fare",
  diario: "Nota aggiunta",
  contatti: "Contatto aggiunto",
};

/** Cosa da fare scritta al volo in cima a Da fare. */
export async function inviaVeloce(form) {
  const campoTesto = form.elements.testo;
  const t = campoTesto.value.trim();
  if (!t) return campoTesto.focus();
  campoTesto.value = "";
  try {
    await salva("cose", { testo: t.slice(0, 160) });
  } catch (e) {
    console.error("cosa veloce", e);
    campoTesto.value = t;
    toast(messaggioErrore(e));
  }
}

export async function eliminaRiga(genere, id) {
  try {
    const vecchia = await elimina(genere, id);
    chiudiFoglio();
    toast("Eliminato", { azione: () => ripristina(genere, vecchia).catch((e) => toast(messaggioErrore(e))) });
  } catch (e) {
    console.error("eliminazione", e);
    toast(messaggioErrore(e));
  }
}

export async function spunta(id) {
  const c = stato.cose.find((x) => x.id === id);
  if (!c) return;
  const fatta = !c.fatta_il;
  try {
    await segnaCosa(id, fatta);
    if (fatta) toast("Fatta", { azione: () => segnaCosa(id, false).catch((e) => toast(messaggioErrore(e))) });
  } catch (e) {
    console.error("spunta", e);
    toast(messaggioErrore(e));
  }
}

