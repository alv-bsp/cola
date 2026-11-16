// Dati di partenza: quello che sappiamo già di Cola, dalla memoria di Alessandro e dalla sua storia su Git
// (dal 07/09 al 13/11/2026). Al primo accesso, se il database è vuoto, l'app li carica da sola; poi si modifica
// tutto dall'app. Le date approssimate lo dicono nella nota.
// Mancano di proposito i vaccini e gli antiparassitari: le date giuste stanno sul libretto sanitario.
// Le tappe di cui non sappiamo il giorno (montagna, pet sitter, Sardegna) entrano senza data: la si aggiunge dal Diario.

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
    pasti:
      "Due pasti, circa 12 ore tra uno e l'altro: la mattina verso le 9-10 e la sera verso le 21-22 (la cena è servita alle 20). " +
      "Uno a tempo (15 minuti, poi ciotola via), l'altro lasciato finché non lo finisce. Quale dei due resta libero: da decidere. " +
      "Razione di 330-340 g al giorno, ferma a quando pesava 13 kg: da ricalcolare.",
    garrese_cm: 50,
    garrese_il: "2026-09-13",
    peso_adulto_min: 23,
    peso_adulto_max: 26,
    note: [
      "Per chi la tiene",
      "• Mangia sassi e oggetti da terra: occhio in passeggiata.",
      "• Mastica le cose di casa: lasciarle sempre un gioco da masticare a portata.",
      "• Piante di casa tossiche per lei (Monstera, Philodendron, Alocasia, Ficus, Strelitzia, Begonie): tenute in alto o in stanze chiuse.",
      "• Se ringhia non sgridarla: è un avviso, si allontana quello che la spaventa.",
      "• Per il collare si prende solo in emergenza.",
      "• Se tira al guinzaglio ci si ferma e si aspetta che si allenti, niente strattoni.",
      "",
      "Storia",
      "• Nel registro si chiamava Stella, ora Coca Cola.",
      "• Prima di settembre 2026: trattamento urinario e vulvare con Metacam e Cystocure, concluso.",
      "• Microchip trasferito dall'anagrafe dell'Emilia-Romagna alla Lombardia (ATS Brianza); corretto l'indirizzo che risultava sotto Pordenone.",
      "",
      "Taglia",
      "• 50 cm al garrese a quasi 6 mesi: da adulta 55-57 cm, al limite alto dello standard.",
      "• Accessori da cane grande: collare adulto taglia L (42-51 cm), bordo della ciotola a 22-27 cm da terra da adulta.",
    ].join("\n"),
  },

  pesi: [
    { il: "2026-07-31", kg: 13, nota: "Circa, fine luglio" },
    { il: "2026-09-13", kg: 17.6, nota: "Quasi 6 mesi" },
    { il: "2026-11-13", kg: 20.5, nota: "Quasi 8 mesi" },
  ],

  // La fine non è segnata: l'app la stima a tre settimane finché non la correggi.
  calori: [
    {
      inizio: "2026-09-04",
      note: "Primo calore. Il 14/09 era in calore da 10 giorni: vulva ingrossata e sanguinamento. A circa 5 mesi e mezzo è precoce per la taglia, da dire al veterinario.",
    },
  ],

  salute: [],

  cose: [
    { testo: "Ricalcolare la razione sui 20,5 kg", entro: "2026-11-30", nota: "Tabella Royal Canin sul peso adulto atteso (23-26 kg), non su quello attuale." },
    { testo: "Copiare vaccini e antiparassitari dal libretto" },
    { testo: "Aggiungere veterinario e pet sitter ai contatti" },
    { testo: "Dire al veterinario del primo calore precoce", nota: "Incide sui tempi di un'eventuale sterilizzazione e sulla radiografia ENCI." },
    { testo: "Chiedere se il calore di marzo sposta la radiografia ENCI" },
    { testo: "Passaporto europeo con antirabbica", nota: "Prima del primo viaggio all'estero." },
    { testo: "Misurare la circonferenza del collo", nota: "Per il collare da adulta, orientato sulla taglia L." },
    { testo: "Decidere quale pasto resta libero" },
    { testo: "Radiografia anche ENCI (Ce.Le.Ma.Sche.)", entro: "2027-03-18", nota: "Si può fare da quando compie 12 mesi." },
  ],

  diario: [
    { il: "2026-03-18", titolo: "Nata" },
    { il: "2026-05-27", titolo: "Arrivata a casa", testo: "Presa a Ravenna. Nel registro si chiamava Stella." },
    {
      il: "2026-09-15",
      titolo: "Torna a mangiare regolarmente",
      testo: "L'alimentazione selettiva di luglio e agosto è rientrata con pasti a tempo più rigidi e meno premietti: era un comportamento appreso, non un problema di salute. Data indicativa: metà settembre.",
    },
    // Tappe senza giorno: restano in cima al Diario, "da datare", finché non si aggiunge la data.
    { il: null, titolo: "Prima escursione in montagna", testo: "Prima di settembre 2026." },
    { il: null, titolo: "Prima notte dalla pet sitter", testo: "Il primo pernottamento fuori casa. La pet sitter ha un gatto." },
    {
      il: null,
      titolo: "Vacanza in Sardegna",
      testo: "Settembre 2026. Occhio alla siepe con le bacche nere (probabile Lantana): tossica per lei, da tenerla lontana e raccogliere le bacche cadute.",
    },
  ],

  contatti: [
    { ruolo: "ats", nome: "ATS Brianza, Fabio Panzeri", email: "veterinaria.lecco@ats-brianza.it", note: "Microchip trasferito in Lombardia; per cambi di indirizzo o di proprietario." },
  ],
};
