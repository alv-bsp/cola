// Dati di partenza: quello che sappiamo già di Cola (dalla memoria di Alessandro, aggiornata al 13/11/2026).
// Si caricano una volta dal pulsante che compare quando non c'è ancora niente. Poi si modifica tutto dall'app.
// Mancano di proposito i vaccini e gli antiparassitari: le date giuste stanno sul libretto sanitario.

export const PARTENZA = {
  profilo: {
    nome: "Cola",
    nome_registrato: "Coca Cola",
    razza: "Eurasier",
    sesso: "femmina",
    nata_il: "2026-03-18",
    presa_il: "2026-05-27",
    provenienza: "Ravenna",
    crocchette: "Royal Canin Medium Puppy",
    razione_g: 335,
    pasti: "Due pasti, circa 12 ore tra uno e l'altro (9-10 e 21-22). Uno a tempo (15 minuti, poi ciotola via), l'altro libero finché non lo finisce.",
    garrese_cm: 50,
    garrese_il: "2026-09-13",
    peso_adulto_min: 23,
    peso_adulto_max: 26,
    note: "Taglia da cane grande per gli accessori: collare adulto taglia L (42-51 cm), bordo della ciotola a 22-27 cm da terra da adulta.",
  },

  pesi: [
    { il: "2026-07-31", kg: 13, nota: "Circa, fine luglio" },
    { il: "2026-09-13", kg: 17.6 },
    { il: "2026-11-13", kg: 20.5 },
  ],

  // La fine non è segnata: l'app la stima a tre settimane finché non la correggi.
  calori: [
    { inizio: "2026-09-04", note: "Primo calore, a circa 5 mesi e mezzo: precoce per la taglia, da dire al veterinario." },
  ],

  salute: [],

  cose: [
    { testo: "Passaporto europeo con antirabbica", nota: "Prima del primo viaggio all'estero." },
    { testo: "Ricalcolare la razione sui 20,5 kg", entro: "2026-11-30", nota: "Tabella Royal Canin sul peso adulto atteso (23-26 kg), non su quello attuale." },
    { testo: "Dire al veterinario del primo calore precoce", nota: "Incide sui tempi di un'eventuale sterilizzazione e sulla radiografia ENCI." },
    { testo: "Chiedere se il calore di marzo sposta la radiografia ENCI" },
    { testo: "Radiografia anche e gomiti ENCI (Ce.Le.Ma.Sche.)", entro: "2027-03-18", nota: "Si può fare da quando compie 12 mesi." },
    { testo: "Copiare vaccini e antiparassitari dal libretto" },
    { testo: "Aggiungere veterinario e pet sitter ai contatti" },
    { testo: "Misurare la circonferenza del collo" },
    { testo: "Decidere quale pasto resta libero" },
  ],

  diario: [
    { il: "2026-03-18", titolo: "Nata" },
    { il: "2026-05-27", titolo: "Arrivata a casa", testo: "Presa a Ravenna." },
  ],

  contatti: [
    { ruolo: "ats", nome: "ATS Brianza, Fabio Panzeri", email: "veterinaria.lecco@ats-brianza.it", note: "Anagrafe canina e microchip (trasferito dall'Emilia-Romagna alla Lombardia)." },
  ],
};
