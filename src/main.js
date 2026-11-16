import "./stile/tokens.css";
import "./stile/base.css";
import "./stile/componenti.css";

import { configurato } from "./config.js";
import { sb } from "./supabase.js";
import { stato, aggiorna, ascolta, azzeraDati } from "./stato.js";
import { caricaTutto, caricaPartenza, salvaProfilo, messaggioErrore } from "./dati.js";
import { preparaFoto, caricaFoto, rimuoviFoto, idrataFoto, urlInCache } from "./foto.js";
import { PARTENZA } from "./partenza.js";
import { esci } from "./accesso.js";
import { coseDivise } from "./regole.js";
import { rotta, normalizza, SEZIONI } from "./router.js";
import { html } from "./ui/html.js";
import { icona } from "./ui/icone.js";
import { toast, chiudiFoglio, preparaFoglio } from "./ui/avvisi.js";
import { avviso } from "./viste/comuni.js";
import * as moduli from "./viste/moduli.js";
import * as oggi from "./viste/oggi.js";
import * as salute from "./viste/salute.js";
import * as cose from "./viste/cose.js";
import * as passaporto from "./viste/passaporto.js";
import * as peso from "./viste/peso.js";
import * as diario from "./viste/diario.js";
import * as accesso from "./viste/accesso.js";

const VISTE = { oggi, salute, cose, passaporto, peso, diario };
const TAB = {
  oggi: { etichetta: "Oggi", icona: "house" },
  salute: { etichetta: "Salute", icona: "heart-pulse" },
  cose: { etichetta: "Da fare", icona: "list-checks" },
  passaporto: { etichetta: "Passaporto", icona: "id-card" },
};
const app = document.getElementById("app");
const sceltaFoto = document.getElementById("scegli-foto");

// ───────────────────────────────────────── disegno
function guscio() {
  const r = rotta();
  const v = VISTE[r.nome];
  const ritardo = stato.caricato ? coseDivise(stato.cose, stato.oggi).ritardo.length : 0;
  const p = stato.profilo;
  const avatar = urlInCache(p?.miniatura);
  const tab = (nome) => html`
    <a class="tab" href="#/${nome}" ${r.sezione === nome ? html`aria-current="page"` : ""}>
      ${icona(TAB[nome].icona, 22)}<span>${TAB[nome].etichetta}</span>
      ${nome === "cose" && ritardo ? html`<i class="tab-conta" aria-label="${ritardo} in ritardo">${ritardo}</i>` : ""}
    </a>`;
  return html`
    <header class="barra-su">
      <a class="marchio" href="#/oggi" aria-label="Oggi">${icona("paw", 20)}<span>cola</span></a>
      <nav class="nav-alta" aria-label="Sezioni">
        ${SEZIONI.map((nome) => html`<a href="#/${nome}" ${r.sezione === nome ? html`aria-current="page"` : ""}>${TAB[nome].etichetta}</a>`)}
      </nav>
      <div class="barra-su-destra">
        <button class="btn primario piccolo solo-largo" type="button" data-azione="aggiungi">${icona("plus", 18)} Aggiungi</button>
        <a class="avatar" href="#/passaporto" aria-label="Passaporto">
          ${p?.miniatura ? html`<img data-foto="${p.miniatura}" ${avatar ? html`src="${avatar}"` : ""} alt="">` : icona("paw", 20)}
        </a>
      </div>
    </header>
    <main class="vista" id="vista">${v.render(stato, { rotta: r, avviso: stato.errore ? avviso(stato.errore) : "" })}</main>
    <nav class="tabbar" aria-label="Sezioni">
      ${tab("oggi")}${tab("salute")}
      <button class="tab tab-piu" type="button" data-azione="aggiungi" aria-label="Aggiungi">${icona("plus", 26, 2.4)}</button>
      ${tab("cose")}${tab("passaporto")}
    </nav>`;
}

function senzaConfigurazione() {
  return html`
    <main class="accesso">
      <div class="eroe-testo">
        <h1>Il diario<br><em>di Cola</em></h1>
        <p>Manca la configurazione di Supabase. Imposta le Variables <b>SUPABASE_URL</b> e
        <b>SUPABASE_PUBLISHABLE_KEY</b> nel repo GitHub e rilancia il deploy (in locale: <b>.env.local</b>).</p>
      </div>
    </main>`;
}

/**
 * Ridisegna la vista giusta. La pagina di accesso non si ridisegna da sola, per non perdere quello che stai
 * scrivendo; nelle altre i campi con data-input tengono valore, fuoco e cursore.
 */
function disegna() {
  let nome, contenuto;
  if (!configurato) [nome, contenuto] = ["config", senzaConfigurazione()];
  else if (!stato.pronto) [nome, contenuto] = ["attesa", ""];
  else if (!stato.sessione) {
    if (app.dataset.vista === "accesso") return;
    [nome, contenuto] = ["accesso", accesso.render()];
  } else [nome, contenuto] = ["app", guscio()];

  const attivo = document.activeElement;
  const chiave = app.contains(attivo) && attivo?.name ? attivo.name : null;
  let selezione = null;
  try { selezione = chiave ? [attivo.selectionStart, attivo.selectionEnd] : null; } catch { /* date */ }
  const valori = new Map([...app.querySelectorAll("form[data-form] input[type=text]")].map((i) => [i.name, i.value]));

  app.dataset.vista = nome;
  app.innerHTML = String(contenuto);

  for (const [n, v] of valori) {
    const el = app.querySelector(`form[data-form] input[name="${n}"]`);
    if (el && !el.value) el.value = v;
  }
  if (chiave) {
    const el = app.querySelector(`[name="${chiave}"]`);
    if (el) {
      el.focus({ preventScroll: true });
      try { if (selezione) el.setSelectionRange(...selezione); } catch { /* campi senza selezione */ }
    }
  }
  if (nome === "app") idrataFoto(app);
}

/** Cambio pagina: entrata a cascata, con le View Transitions dove ci sono. */
function cambiaPagina() {
  const fai = () => {
    disegna();
    app.dataset.entra = "1";
    clearTimeout(cambiaPagina.t);
    cambiaPagina.t = setTimeout(() => delete app.dataset.entra, 700);
    window.scrollTo(0, 0);
  };
  const ridotto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (document.startViewTransition && !ridotto) document.startViewTransition(fai);
  else fai();
}

// ───────────────────────────────────────── azioni
let caricandoPartenza = false;

const AZIONI = {
  aggiungi: () => moduli.apriAggiungi(),
  nuovo: (el) => moduli.apri(el.dataset.genere, { preset: el.dataset.tipo ? { tipo: el.dataset.tipo } : {} }),
  modifica: (el) => moduli.apri(el.dataset.genere, { id: el.dataset.id }),
  elimina: (el) => moduli.eliminaRiga(el.dataset.genere, el.dataset.id),
  gruppo: (el) => moduli.apriGruppo(el.dataset.chiave),
  rinnova: (el) => moduli.rinnova(el.dataset.chiave),
  profilo: (el) => moduli.apriProfilo(el.dataset.parte),
  scorciatoia: (el) => moduli.scorciatoia(el),
  "inizio-calore": () => moduli.inizioCalore(),
  "fine-calore": () => moduli.fineCalore(),
  "segna-cosa": (el) => moduli.spunta(el.dataset.id),
  "mostra-fatte": (el, e) => cose.azioni["mostra-fatte"](el, e, disegna),
  "chiudi-foglio": () => chiudiFoglio(),
  "foto-profilo": () => sceltaFoto.click(),
  salta: (el) => document.getElementById(el.dataset.a)?.scrollIntoView({ behavior: "smooth", block: "start" }),
  riprova: () => ricarica(),
  partenza: async (el) => {
    if (caricandoPartenza) return;
    caricandoPartenza = true;
    el.disabled = true;
    try {
      await caricaPartenza(PARTENZA);
      toast("Dati di Cola caricati. Controllali nel passaporto.", { durata: 4500 });
    } catch (e) {
      console.error("partenza", e);
      el.disabled = false;
      toast(messaggioErrore(e));
    } finally {
      caricandoPartenza = false;
    }
  },
  esci: async () => {
    chiudiFoglio();
    await esci();
  },
};

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-azione]");
  if (!el || el.disabled) return;
  const azione = AZIONI[el.dataset.azione];
  if (!azione) return;
  e.preventDefault();
  // Un'azione dal foglio che apre un altro modulo lo sostituisce: niente chiusura in mezzo.
  azione(el, e);
});

document.addEventListener("input", (e) => {
  const f = moduli.input[e.target.dataset?.input];
  if (f) f(e.target);
});

document.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  if (form.id === "form-accesso") accesso.invia(form);
  else if (form.dataset.form === "cosa-veloce") moduli.inviaVeloce(form);
  else if (form.dataset.form) moduli.invia(form);
});

// Foto del profilo: compressa sul telefono, caricata nel bucket, poi la vecchia si cancella.
sceltaFoto.addEventListener("change", async () => {
  const file = sceltaFoto.files?.[0];
  sceltaFoto.value = ""; // così si può scegliere di nuovo lo stesso file
  if (!file) return;
  const vecchie = [stato.profilo?.foto, stato.profilo?.miniatura];
  toast("Carico la foto…", { durata: 8000 });
  try {
    const foto = await preparaFoto(file);
    const percorsi = await caricaFoto("profilo", foto);
    await salvaProfilo(percorsi);
    rimuoviFoto(vecchie);
    toast("Foto aggiornata");
  } catch (e) {
    console.error("foto", e);
    toast(e?.message === "Immagine non leggibile" ? "Non riesco a leggere questa immagine." : messaggioErrore(e));
  }
});

window.addEventListener("hashchange", () => {
  normalizza();
  chiudiFoglio({ subito: true });
  cambiaPagina();
});

// Tornando sull'app dopo un po': giorno aggiornato e dati riletti (l'altro telefono può aver cambiato qualcosa).
let ultimoCaricamento = 0;
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible" || !stato.sessione) return;
  if (Date.now() - ultimoCaricamento > 60_000) ricarica();
  else aggiorna({});
});

function ricarica() {
  ultimoCaricamento = Date.now();
  return caricaTutto();
}

// ───────────────────────────────────────── avvio
async function avvia() {
  normalizza();
  preparaFoglio();
  ascolta(disegna);
  if (!configurato) return disegna();

  const { data } = await sb.auth.getSession();
  aggiorna({ pronto: true, sessione: data.session });
  if (data.session) ricarica();

  sb.auth.onAuthStateChange((_evento, sessione) => {
    const prima = stato.sessione?.user?.id;
    const dopo = sessione?.user?.id;
    // Fuori dal callback: supabase-js sconsiglia di chiamare altre API mentre notifica l'evento.
    setTimeout(() => {
      aggiorna({ sessione });
      if (!dopo) azzeraDati();
      else if (dopo !== prima) ricarica();
    }, 0);
  });
}

avvia();
