import { html } from "../ui/html.js";
import { icona } from "../ui/icone.js";
import { ciclo, gruppi, giorniTra, aggiungiGiorni, urgenza, mesiSuggeriti, andamentoPeso, formatoKg, TIPI, PROTEZIONE, VISITE, CALORE } from "../regole.js";
import { data, relativo } from "../tempo.js";
import { pillola, pillolaScadenza, riga, testaCarta, titoloPagina } from "./comuni.js";

export const conTabbar = true;

export function render(s, { avviso }) {
  const oggi = s.oggi;
  const cl = ciclo(s.calori, oggi);
  const peso = andamentoPeso(s.pesi, s.profilo, oggi);
  const vaccini = gruppi(s.salute, ["vaccino"]);
  const trattamenti = gruppi(s.salute, PROTEZIONE.filter((t) => t !== "vaccino"));
  const visite = s.salute.filter((e) => VISITE.includes(e.tipo)).sort((a, b) => b.il.localeCompare(a.il));

  return html`
    ${avviso}
    <div class="pagina">
      ${titoloPagina("Salute", "Calore, vaccini, trattamenti e visite")}
      <nav class="salti" aria-label="Vai a">
        ${[["calore", "Calore"], ["vaccini", "Vaccini"], ["trattamenti", "Trattamenti"], ["visite", "Visite"]].map(([id, t]) =>
          html`<button class="chip" type="button" data-azione="salta" data-a="${id}">${t}</button>`)}
      </nav>

      ${riga({
        icona: "weight", tinta: "verde", titolo: "Peso",
        sotto: peso ? `${formatoKg(peso.ultimo.kg)} kg, ${relativo(peso.ultimo.il, oggi)}` : "Nessuna pesata",
        href: "#/peso",
      })}

      ${sezioneCalore(s.calori, cl, oggi)}

      <section class="carta" id="vaccini">
        ${testaCarta("Vaccini")}
        ${vaccini.length ? html`<div class="elenco">${vaccini.map((g) => rigaGruppo(g, oggi))}</div>`
          : html`<p class="vuoto-testo">Nessun vaccino segnato. Copiali dal libretto sanitario: ogni vaccino col suo richiamo.</p>`}
        <button class="btn secondario largo" type="button" data-azione="nuovo" data-genere="salute" data-tipo="vaccino">${icona("plus", 18)} Vaccino</button>
      </section>

      <section class="carta" id="trattamenti">
        ${testaCarta("Trattamenti")}
        ${trattamenti.length ? html`<div class="elenco">${trattamenti.map((g) => rigaGruppo(g, oggi))}</div>`
          : html`<p class="vuoto-testo">Antiparassitari, vermifughi, prevenzione della filaria e farmaci. Ognuno ricorda la prossima dose.</p>`}
        <div class="bottoni-due">
          <button class="btn secondario" type="button" data-azione="nuovo" data-genere="salute" data-tipo="antiparassitario">${icona("plus", 18)} Antiparassitario</button>
          <button class="btn secondario" type="button" data-azione="nuovo" data-genere="salute" data-tipo="vermifugo">${icona("plus", 18)} Altro</button>
        </div>
      </section>

      <section class="carta" id="visite">
        ${testaCarta("Visite ed esami")}
        ${visite.length ? html`<div class="elenco">${visite.map((e) => riga({
          icona: TIPI[e.tipo].icona, tinta: TIPI[e.tipo].tinta, titolo: e.nome,
          sotto: [e.veterinario, e.note].filter(Boolean).join(" · ").slice(0, 90),
          data: data(e.il, oggi), azione: "modifica", dati: { genere: "salute", id: e.id },
        }))}</div>`
          : html`<p class="vuoto-testo">Visite dal veterinario, esami e radiografie, con le note di cosa è stato detto.</p>`}
        <button class="btn secondario largo" type="button" data-azione="nuovo" data-genere="salute" data-tipo="visita">${icona("plus", 18)} Visita o esame</button>
      </section>
    </div>`;
}

function rigaGruppo(g, oggi) {
  const t = TIPI[g.tipo];
  let pl = "";
  if (g.prossimo) {
    const mancano = giorniTra(oggi, g.prossimo);
    pl = pillolaScadenza(mancano, urgenza(mancano, (mesiSuggeriti(g.tipo, g.nome) ?? 12) <= 1 ? 7 : 14));
  }
  return riga({
    icona: t.icona, tinta: t.tinta, titolo: g.nome,
    sotto: `${g.tipo === "vaccino" ? "" : `${t.nome} · `}ultimo ${data(g.ultimo.il, oggi)}${g.eventi.length > 1 ? ` · ${g.eventi.length} volte` : ""}`,
    pillola: pl, data: g.prossimo ? data(g.prossimo, oggi) : "",
    azione: "gruppo", dati: { chiave: g.chiave },
  });
}

function sezioneCalore(calori, cl, oggi) {
  const elenco = [...calori].sort((a, b) => b.inizio.localeCompare(a.inizio));
  return html`
    <section class="carta" id="calore">
      ${testaCarta("Calore")}
      ${cl ? html`
        <dl class="dati">
          <div><dt>Ultimo</dt><dd>${cl.inCorso ? `in corso, giorno ${cl.giorno}` : `${data(cl.ultimo.inizio, oggi)} – ${data(cl.fine, oggi)}`}
            ${cl.fineStimata ? pillola("fine stimata", "grigio") : ""}</dd></div>
          ${cl.durata ? html`<div><dt>Durata</dt><dd>${cl.durata} giorni</dd></div>` : ""}
          <div><dt>Intervallo</dt><dd>${cl.basatoSu > 1 ? `${cl.intervallo} giorni (media)` : "circa 6 mesi (tipico)"}</dd></div>
          <div><dt>Prossimo</dt><dd>~${data(cl.prossimo.il, oggi)} <small>tra ${data(cl.prossimo.dal, oggi)} e ${data(cl.prossimo.al, oggi)}</small></dd></div>
          ${cl.sorveglianza && giorniTra(oggi, cl.sorveglianza.al) >= 0 ? html`
            <div><dt>Piometra</dt><dd>da sorvegliare fino al ${data(cl.sorveglianza.al, oggi)}
              ${cl.sorveglianza.attiva ? pillola("adesso", "giallo") : ""}</dd></div>` : ""}
        </dl>
        <p class="aiuto">La stima del prossimo usa ${cl.basatoSu > 1 ? `la media dei suoi ${cl.basatoSu} calori` : "l'intervallo tipico di sei mesi"}.
          Se la fine non è segnata la conto a ${CALORE.durata} giorni.</p>` : ""}
      ${elenco.length ? html`<div class="elenco">${elenco.map((c) => {
        const stimata = !c.fine && giorniTra(c.inizio, oggi) + 1 > CALORE.inCorsoMax;
        const fine = c.fine ? data(c.fine, oggi) : stimata ? `${data(aggiungiGiorni(c.inizio, CALORE.durata - 1), oggi)} (stimata)` : "in corso";
        return riga({
          icona: "flame", tinta: "rosa",
          titolo: `${data(c.inizio, oggi)} – ${fine}`,
          sotto: [c.fine ? `${giorniTra(c.inizio, c.fine) + 1} giorni` : "", c.note].filter(Boolean).join(" · ").slice(0, 90),
          azione: "modifica", dati: { genere: "calori", id: c.id },
        });
      })}</div>` : html`<p class="vuoto-testo">Nessun calore segnato.</p>`}
      <div class="bottoni-due">
        <button class="btn secondario" type="button" data-azione="inizio-calore">${icona("plus", 18)} Inizio</button>
        <button class="btn secondario" type="button" data-azione="fine-calore" ${cl && !cl.ultimo.fine ? "" : "disabled"}>${icona("check", 18)} Fine</button>
      </div>
    </section>`;
}
