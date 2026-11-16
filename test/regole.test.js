import { test } from "node:test";
import assert from "node:assert/strict";
import {
  giornoRoma, giorniTra, aggiungiGiorni, aggiungiMesi, eta, etaInParole, compleanno,
  ciclo, CALORE, quotaAdulta, fasciaAttesa, andamentoPeso, pesateInOrdine,
  mesiSuggeriti, prossimoSuggerito, gruppi, scadenzeSalute, urgenza, coseDivise, inArrivo, cronologia, formatoKg,
} from "../src/regole.js";

const profilo = { nata_il: "2026-03-18", peso_adulto_min: 23, peso_adulto_max: 26 };

test("giorno a Roma, anche a cavallo della mezzanotte e con l'ora legale", () => {
  assert.equal(giornoRoma("2026-11-15T23:30:00Z"), "2026-11-16");   // 00:30 a Roma (CET, +1)
  assert.equal(giornoRoma("2026-07-01T22:30:00Z"), "2026-07-02");   // 00:30 a Roma (CEST, +2)
  assert.equal(giornoRoma("2026-07-01T21:30:00Z"), "2026-07-01");
});

test("aritmetica dei giorni e dei mesi", () => {
  assert.equal(giorniTra("2026-09-04", "2026-11-16"), 73);
  assert.equal(giorniTra("2026-11-16", "2026-09-04"), -73);
  assert.equal(aggiungiGiorni("2026-12-30", 3), "2027-01-02");
  assert.equal(aggiungiMesi("2026-01-31", 1), "2026-02-28");
  assert.equal(aggiungiMesi("2026-11-16", 3), "2027-02-16");
  assert.equal(aggiungiMesi("2026-03-18", 12), "2027-03-18");
  assert.equal(aggiungiMesi("2026-03-18", -1), "2026-02-18");
});

test("età di Cola", () => {
  const e = eta("2026-03-18", "2026-11-16");
  assert.equal(e.mesiTotali, 7);
  assert.equal(e.giorni, 29);
  assert.ok(e.mesiDecimali > 7.9 && e.mesiDecimali < 8);
  assert.equal(etaInParole("2026-03-18", "2026-11-16"), "7 mesi e 29 giorni");
  assert.equal(etaInParole("2026-03-18", "2026-11-18"), "8 mesi");
  assert.equal(etaInParole("2026-03-18", "2027-03-18"), "1 anno");
  assert.equal(etaInParole("2026-03-18", "2027-05-20"), "1 anno e 2 mesi");
  assert.equal(etaInParole("2026-03-18", "2028-04-01"), "2 anni");
  assert.equal(etaInParole("2026-03-18", "2028-04-20"), "2 anni e 1 mese");
  assert.equal(etaInParole("2026-03-18", "2026-04-02"), "2 settimane");
  assert.equal(eta("2026-03-18", "2026-03-01"), null);
});

test("compleanno", () => {
  assert.deepEqual(compleanno("2026-03-18", "2026-11-16"), { il: "2027-03-18", anni: 1, mancano: 122 });
  assert.equal(compleanno("2026-03-18", "2027-03-18").mancano, 0);
});

test("ciclo con un solo calore e la fine non segnata: fine stimata, piometra da sorvegliare", () => {
  const c = ciclo([{ inizio: "2026-09-04", fine: null }], "2026-11-16");
  assert.equal(c.inCorso, false);
  assert.equal(c.fineStimata, true);
  assert.equal(c.fine, "2026-09-24");
  assert.equal(c.durata, CALORE.durata);
  assert.equal(c.sorveglianza.al, "2026-11-19");
  assert.equal(c.sorveglianza.attiva, true);
  assert.equal(c.intervallo, 183);
  assert.equal(c.basatoSu, 1);
  assert.equal(c.prossimo.il, "2027-03-06");
  assert.equal(c.prossimo.dal, "2027-02-04");
  assert.equal(c.prossimo.mancano, 110);
});

test("ciclo in corso e ciclo finito con la fine segnata", () => {
  const inCorso = ciclo([{ inizio: "2026-11-10", fine: null }], "2026-11-16");
  assert.equal(inCorso.inCorso, true);
  assert.equal(inCorso.giorno, 7);
  assert.equal(inCorso.sorveglianza, null);

  const finito = ciclo([{ inizio: "2026-09-04", fine: "2026-09-22" }], "2026-12-01");
  assert.equal(finito.inCorso, false);
  assert.equal(finito.fineStimata, false);
  assert.equal(finito.durata, 19);
  assert.equal(finito.sorveglianza.attiva, false);
});

test("con più calori l'intervallo è la media dei suoi, e i salti strani non contano", () => {
  const c = ciclo([
    { inizio: "2026-09-04", fine: "2026-09-24" },
    { inizio: "2027-03-20", fine: "2027-04-08" },   // 197 giorni
    { inizio: "2027-09-20", fine: null },           // 184 giorni
  ], "2027-12-01");
  assert.equal(c.intervallo, Math.round((197 + 184) / 2));
  assert.equal(c.basatoSu, 3);
  assert.equal(ciclo([{ inizio: "2026-09-04" }, { inizio: "2026-09-20" }], "2026-12-01").intervallo, 183);
  assert.equal(ciclo([], "2026-12-01"), null);
});

test("curva di crescita e fascia attesa", () => {
  assert.equal(quotaAdulta(6), 0.7);
  assert.ok(Math.abs(quotaAdulta(6.5) - 0.735) < 1e-9);
  assert.equal(quotaAdulta(20), 1);
  const f = fasciaAttesa(profilo, "2026-11-13");
  assert.ok(f.min < 20.5 && f.max > 20.5, `20,5 kg dovrebbe stare nella fascia ${f.min}–${f.max}`);
  assert.equal(fasciaAttesa({ nata_il: "2026-03-18" }, "2026-11-13"), null);
});

test("andamento del peso con le pesate di Cola", () => {
  const pesi = [
    { il: "2026-11-13", kg: "20.5" },
    { il: "2026-07-31", kg: 13 },
    { il: "2026-09-13", kg: 17.6 },
  ];
  assert.deepEqual(pesateInOrdine(pesi).map((p) => p.delta), [null, 4.6, 2.9]);
  const a = andamentoPeso(pesi, profilo, "2026-11-16");
  assert.equal(a.ultimo.kg, 20.5);
  assert.equal(a.delta, 2.9);
  assert.equal(a.giorni, 61);
  assert.equal(a.kgSettimana, 0.33);
  assert.equal(a.posizione, "dentro");
  assert.ok(a.proiezione > 23 && a.proiezione < 27);
  assert.equal(a.giorniDallUltima, 3);
  assert.equal(andamentoPeso([], profilo, "2026-11-16"), null);
});

test("prossima dose suggerita", () => {
  assert.equal(mesiSuggeriti("vaccino", "Antirabbica"), 12);
  assert.equal(mesiSuggeriti("antiparassitario", "NexGard Spectra"), 1);
  assert.equal(mesiSuggeriti("antiparassitario", "Bravecto"), 3);
  assert.equal(mesiSuggeriti("antiparassitario", "Seresto (collare)"), 7);
  assert.equal(mesiSuggeriti("visita", "Controllo"), null);
  assert.equal(prossimoSuggerito("vermifugo", "Milbemax", "2026-11-16"), "2027-02-16");
  assert.equal(prossimoSuggerito("visita", "Controllo", "2026-11-16"), null);
});

test("gruppi e scadenze: conta l'evento più recente di ogni gruppo", () => {
  const salute = [
    { id: "a", tipo: "antiparassitario", nome: "NexGard", il: "2026-09-10", prossimo_il: "2026-10-10" },
    { id: "b", tipo: "antiparassitario", nome: "nexgard ", il: "2026-10-12", prossimo_il: "2026-11-12" },
    { id: "c", tipo: "vaccino", nome: "Polivalente", il: "2026-06-01", prossimo_il: "2027-06-01" },
    { id: "d", tipo: "visita", nome: "Controllo", il: "2026-10-01", prossimo_il: null },
  ];
  const g = gruppi(salute);
  assert.equal(g.length, 3);
  assert.equal(g[0].ultimo.id, "b");
  assert.equal(g[0].eventi.length, 2);
  assert.equal(gruppi(salute, ["visita"]).length, 1);

  const s = scadenzeSalute(salute, "2026-11-16");
  assert.deepEqual(s.map((x) => [x.ultimo.id, x.mancano, x.urgenza]), [["b", -4, "ritardo"], ["c", 197, "ok"]]);
  assert.equal(urgenza(0), "presto");
  assert.equal(urgenza(15), "ok");
});

test("cose da fare divise per quando", () => {
  const cose = [
    { id: 1, testo: "Razione", entro: "2026-11-30", fatta_il: null },
    { id: 2, testo: "Passaporto", entro: null, fatta_il: null, creato_il: "2026-11-01" },
    { id: 3, testo: "Vecchia", entro: "2026-11-10", fatta_il: null },
    { id: 4, testo: "Domani", entro: "2026-11-17", fatta_il: null },
    { id: 5, testo: "Fatta", entro: "2026-11-01", fatta_il: "2026-11-02T10:00:00Z" },
  ];
  const d = coseDivise(cose, "2026-11-16");
  assert.deepEqual(d.ritardo.map((c) => c.id), [3]);
  assert.deepEqual(d.presto.map((c) => c.id), [4]);
  assert.deepEqual(d.avanti.map((c) => c.id), [1]);
  assert.deepEqual(d.senzaData.map((c) => c.id), [2]);
  assert.deepEqual(d.fatte.map((c) => c.id), [5]);
  assert.equal(d.aperte, 4);
});

test("in arrivo: scadenze, cose, prossimo calore e compleanno in ordine di data", () => {
  const voci = inArrivo({
    salute: [{ tipo: "vaccino", nome: "Antirabbica", il: "2026-06-01", prossimo_il: "2027-06-01" }],
    cose: [{ testo: "Razione", entro: "2026-11-30", fatta_il: null }, { testo: "Senza data", entro: null, fatta_il: null }],
    calori: [{ inizio: "2026-09-04", fine: null }],
    profilo,
  }, "2026-11-16", 10);
  assert.deepEqual(voci.map((v) => v.genere), ["cosa", "calore", "salute"]);
  const vicino = inArrivo({ profilo }, "2027-02-01");
  assert.equal(vicino[0].genere, "compleanno");
});

test("cronologia dal più recente", () => {
  const voci = cronologia({
    pesi: [{ il: "2026-09-13", kg: 17.6 }, { il: "2026-11-13", kg: 20.5 }],
    calori: [{ inizio: "2026-09-04", fine: "2026-09-24" }],
    diario: [{ il: "2026-05-27", titolo: "Arrivata a casa" }],
    cose: [{ testo: "Fatta", fatta_il: "2026-11-02T23:30:00Z" }],
  });
  assert.deepEqual(voci.map((v) => v.il), ["2026-11-13", "2026-11-03", "2026-09-24", "2026-09-13", "2026-09-04", "2026-05-27"]);
  assert.equal(voci[0].sotto, "+2,9 kg");
  assert.equal(formatoKg(20), "20,0");
});
