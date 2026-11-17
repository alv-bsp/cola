import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PARTENZA } from "../src/partenza.js";
import { TRICK_BASE } from "../src/trick-base.js";

// I dati di partenza devono rispettare i vincoli di lunghezza di supabase/schema.sql: se uno sfora,
// il caricamento al primo accesso fallisce (è successo con "pasti").
const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");

/** Vincoli char_length(colonna) <= N di una tabella, letti dallo schema. */
function limiti(tabella) {
  const corpo = schema.split(`create table public.${tabella} (`)[1].split("\n);")[0];
  const m = {};
  for (const [, colonna, n] of corpo.matchAll(/^\s*(\w+)\s+text[^\n]*?char_length\((?:btrim\()?\w+\)?\)\s*(?:<=|between \d+ and)\s*(\d+)/gm)) {
    m[colonna] = Number(n);
  }
  return m;
}

const casi = [
  ["cola_profilo", [PARTENZA.profilo]],
  ["cola_pesi", PARTENZA.pesi],
  ["cola_calori", PARTENZA.calori],
  ["cola_cose", PARTENZA.cose],
  ["cola_diario", PARTENZA.diario],
  ["cola_contatti", PARTENZA.contatti],
  ["cola_trick", TRICK_BASE],
];

for (const [tabella, righe] of casi) {
  test(`dati di partenza dentro i limiti di ${tabella}`, () => {
    const lim = limiti(tabella);
    assert.ok(Object.keys(lim).length, `nessun limite trovato per ${tabella}`);
    for (const riga of righe) {
      for (const [colonna, valore] of Object.entries(riga)) {
        if (typeof valore === "string" && lim[colonna]) {
          assert.ok(valore.length <= lim[colonna], `${tabella}.${colonna}: ${valore.length} caratteri, massimo ${lim[colonna]}`);
        }
      }
    }
  });
}

test("il limite di pasti è letto dallo schema", () => {
  assert.equal(limiti("cola_profilo").pasti, 300);
  assert.equal(limiti("cola_cose").testo, 160);
});
