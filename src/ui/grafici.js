import { html, raw } from "./html.js";
import { aggiungiGiorni, giorniTra, fasciaAttesa, formatoKg, maxGiorno } from "../regole.js";
import { data, mese } from "../tempo.js";

// Grafici disegnati a mano: niente librerie. Barre del peso (carta lime di Oggi), linea del peso con la fascia
// attesa (pagina Peso) e l'onda del ciclo (carta scura di Oggi).

// ───────────────────────────────────────── barre del peso
/** Le ultime pesate come barre da zero, con la linea che unisce le cime e il valore dell'ultima nel fumetto. */
export function barrePeso(elenco, { quante = 7 } = {}) {
  const ultime = elenco.slice(-quante);
  if (!ultime.length) return "";
  const massimo = Math.max(...ultime.map((p) => p.kg)) * 1.12;
  const n = ultime.length;
  const punti = ultime.map((p, i) => ({ x: ((i + 0.5) / n) * 100, y: (p.kg / massimo) * 100, p }));
  const ultimo = punti.at(-1);
  return html`
    <div class="barre" style="--n:${n}">
      <svg class="barre-linea" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline points="${punti.map((q) => `${q.x.toFixed(2)},${(100 - q.y).toFixed(2)}`).join(" ")}" />
      </svg>
      ${punti.map((q, i) => html`
        <div class="barra ${i === n - 1 ? "ultima" : ""}" style="--h:${q.y.toFixed(1)}%">
          <span class="barra-corpo"></span>
        </div>`)}
      ${punti.map((q) => html`<span class="barre-punto" style="left:${q.x.toFixed(2)}%;bottom:${q.y.toFixed(2)}%"></span>`)}
      <span class="fumetto" style="left:${ultimo.x.toFixed(2)}%;bottom:${ultimo.y.toFixed(2)}%;--sposta:${ultimo.x > 78 ? -82 : -50}%;--becco:${ultimo.x > 78 ? 82 : 50}%">${formatoKg(ultimo.p.kg)} kg</span>
    </div>
    <div class="barre-etichette" style="--n:${n}" aria-hidden="true">
      ${ultime.map((p) => html`<span>${mese(p.il)}</span>`)}
    </div>`;
}

// ───────────────────────────────────────── linea del peso
/**
 * Il peso nel tempo, con la fascia indicativa calcolata dal peso adulto stimato del profilo.
 * Asse x: dai primi mesi a qualche settimana dopo oggi. Asse y: da zero, a passi di 5 kg.
 */
export function lineaPeso(elenco, profilo, oggi) {
  const L = 340, A = 210, sx = 30, dx = 12, su = 14, giu = 26;   // misure del disegno e margini
  const nata = profilo?.nata_il;
  const primo = elenco[0]?.il || oggi;
  const inizio = nata ? aggiungiGiorni(nata, 45) : aggiungiGiorni(primo, -14);
  const da = primo < inizio ? aggiungiGiorni(primo, -10) : inizio;
  const a = aggiungiGiorni(maxGiorno(oggi, elenco.at(-1)?.il), 75);
  const giorni = Math.max(30, giorniTra(da, a));

  // Fascia campionata ogni 7 giorni
  const fascia = [];
  for (let g = 0; g <= giorni; g += 7) {
    const giorno = aggiungiGiorni(da, g);
    const f = fasciaAttesa(profilo, giorno);
    if (f) fascia.push({ g, ...f });
  }

  const massimo = Math.max(10, ...elenco.map((p) => p.kg), ...fascia.map((f) => f.max));
  const tetto = Math.ceil((massimo * 1.08) / 5) * 5;
  const X = (g) => sx + ((L - sx - dx) * g) / giorni;
  const Y = (kg) => su + (A - su - giu) * (1 - kg / tetto);

  const righe = [];
  for (let kg = 0; kg <= tetto; kg += 5) righe.push(kg);

  // Etichette dei mesi: il primo giorno di ogni mese, saltandone uno se sono troppi
  const mesi = [];
  let m = `${da.slice(0, 7)}-01`;
  if (m < da) m = aggiungiGiorni(`${m.slice(0, 7)}-28`, 4).slice(0, 7) + "-01";
  while (m <= a) {
    mesi.push(m);
    m = aggiungiGiorni(`${m.slice(0, 7)}-28`, 4).slice(0, 7) + "-01";
  }
  const passo = mesi.length > 8 ? 2 : 1;

  const banda = fascia.length > 1
    ? `M${fascia.map((f) => `${X(f.g).toFixed(1)},${Y(f.max).toFixed(1)}`).join("L")}` +
      `L${[...fascia].reverse().map((f) => `${X(f.g).toFixed(1)},${Y(f.min).toFixed(1)}`).join("L")}Z`
    : "";
  const punti = elenco.map((p) => ({ x: X(giorniTra(da, p.il)), y: Y(p.kg), p }));
  const xOggi = X(giorniTra(da, oggi));

  return html`
    <svg class="linea-peso" viewBox="0 0 ${L} ${A}" role="img" aria-label="Andamento del peso">
      ${righe.map((kg) => raw(`<line class="griglia" x1="${sx}" x2="${L - dx}" y1="${Y(kg).toFixed(1)}" y2="${Y(kg).toFixed(1)}"/>` +
        `<text class="asse" x="${sx - 6}" y="${(Y(kg) + 3.5).toFixed(1)}" text-anchor="end">${kg}</text>`))}
      ${mesi.map((g, i) => (i % passo ? "" : raw(`<text class="asse" x="${X(giorniTra(da, g)).toFixed(1)}" y="${A - 8}" text-anchor="middle">${mese(g)}</text>`)))}
      ${banda ? raw(`<path class="fascia" d="${banda}"/>`) : ""}
      ${raw(`<line class="oggi" x1="${xOggi.toFixed(1)}" x2="${xOggi.toFixed(1)}" y1="${su}" y2="${A - giu}"/>`)}
      ${punti.length > 1 ? raw(`<polyline class="tratto" points="${punti.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ")}"/>`) : ""}
      ${punti.map((q, i) => raw(`<circle class="punto ${i === punti.length - 1 ? "ultimo" : ""}" cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="${i === punti.length - 1 ? 5.5 : 4}"/>`))}
      ${punti.length ? raw(`<text class="valore" x="${Math.min(punti.at(-1).x, L - dx - 20).toFixed(1)}" y="${(punti.at(-1).y - 11).toFixed(1)}" text-anchor="middle">${formatoKg(punti.at(-1).p.kg)}</text>`) : ""}
    </svg>`;
}

// ───────────────────────────────────────── onda del ciclo
const TACCHE = 46;

/** Altezza "a onda" di una tacca: deterministica, così non cambia a ogni ridisegno. */
const onda = (i) => 0.28 + 0.5 * Math.abs(Math.sin(i * 1.71) * Math.cos(i * 0.43) + 0.25 * Math.sin(i * 0.9));

/**
 * Una tacca ogni pochi giorni, dall'inizio dell'ultimo calore alla fine della finestra del prossimo.
 * Calore in lime pieno, sorveglianza in giallo, finestra prevista in lime tenue, oggi in bianco con il punto.
 */
export function ondaCiclo(cl, oggi) {
  const da = cl.ultimo.inizio;
  const a = cl.prossimo.al;
  const tot = giorniTra(da, a);
  const fineCalore = cl.fine || (cl.inCorso ? oggi : aggiungiGiorni(da, 20));
  const iOggi = Math.round((giorniTra(da, oggi) / tot) * (TACCHE - 1));
  const tacche = [];
  for (let i = 0; i < TACCHE; i++) {
    const g = aggiungiGiorni(da, Math.round((tot * i) / (TACCHE - 1)));
    let classe = g <= oggi ? "passata" : "futura";
    let h = onda(i);
    if (g >= da && g <= fineCalore) { classe = "calore"; h = 0.62 + 0.38 * Math.abs(Math.sin(i * 2.3)); }
    else if (cl.sorveglianza && g >= cl.sorveglianza.dal && g <= cl.sorveglianza.al) classe += " sorveglia";
    else if (g >= cl.prossimo.dal && g <= cl.prossimo.al) { classe += " prevista"; h = 0.45 + 0.4 * Math.abs(Math.sin(i * 1.3)); }
    if (i === iOggi) { classe = "oggi"; h = 1; }
    tacche.push(html`<span class="tacca ${classe}" style="--h:${(h * 100).toFixed(0)}%"></span>`);
  }
  const xOggi = (iOggi / (TACCHE - 1)) * 100;
  return html`
    <div class="onda" aria-hidden="true">${tacche}</div>
    <div class="onda-date" aria-hidden="true">
      <span>${data(da, oggi)}</span>
      ${xOggi > 20 && xOggi < 80 ? html`<span class="onda-oggi" style="left:${xOggi.toFixed(1)}%">oggi</span>` : ""}
      <span>~${data(cl.prossimo.il, oggi)}</span>
    </div>`;
}

/** Linea minima per il chip del peso sul ritratto. */
export function scintilla(elenco) {
  const ultime = elenco.slice(-6).map((p) => p.kg);
  if (ultime.length < 2) return "";
  const min = Math.min(...ultime), max = Math.max(...ultime);
  const pts = ultime.map((kg, i) => `${((i / (ultime.length - 1)) * 60).toFixed(1)},${(22 - ((kg - min) / (max - min || 1)) * 18).toFixed(1)}`);
  return raw(`<svg class="scintilla" viewBox="0 0 60 26" aria-hidden="true"><polyline points="${pts.join(" ")}"/><circle cx="${pts.at(-1).split(",")[0]}" cy="${pts.at(-1).split(",")[1]}" r="2.6"/></svg>`);
}
