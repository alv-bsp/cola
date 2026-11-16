# Cola

Webapp di casa per Cola, la nostra Eurasier: diario e passaporto. Calore, peso, vaccini, trattamenti, visite,
cose da fare, contatti. La usiamo in due (Alessandro e Giulia) con gli stessi dati, pensata per l'iPhone e
installabile sulla schermata Home; funziona anche da computer.

- **Frontend**: Vite + JavaScript senza framework, pubblicato su GitHub Pages da GitHub Actions a ogni push su `main`.
  Stesso impianto di Armadio e Piante.
- **Backend**: il progetto Supabase di **Cosa mangiamo** (piano gratuito), dove ci sono già i nostri due utenti.
  Tabelle con il prefisso `cola_`, nessun contatto con la tabella `kv` di Cosa mangiamo.
- **Stile**: chiaro e arioso. Cielo, monti e prato sfocati sul fondo, carte in vetro bianco, titoli neri con la
  seconda riga verde erba, lime per i dati (barre del peso, onda del ciclo), verde bosco per le azioni. Font Inter.
  Token in `src/stile/tokens.css`.

## Come funziona

- **Oggi**: il ritratto di Cola (tocca per mettere la foto) con peso ed età, e sotto la cosa più importante adesso
  (in calore, piometra da sorvegliare, scadenze passate o "Tutto in ordine"). Poi **Come sta** (peso, calore,
  antiparassitario, cose da fare), la carta scura del **Ciclo**, la carta lime del **Peso**, **In arrivo** (richiami,
  cose con una data, prossimo calore, compleanno) e le ultime voci del **Diario**.
- **Ciclo**: un'onda di tacche dall'inizio dell'ultimo calore alla fine della finestra del prossimo. Lime il calore,
  giallo la sorveglianza della piometra, bianco oggi, lime tenue la finestra prevista. Con il + segni l'inizio, con ✓
  la fine.
- **Salute**: calore (ultimo, durata, intervallo, prossimo, sorveglianza), vaccini e trattamenti raggruppati per nome
  con la prossima dose, visite ed esami. Toccando un vaccino o un antiparassitario si apre la sua storia con
  **Fatto oggi**, che ripete lo stesso intervallo dell'ultima volta.
- **Peso**: il grafico con la fascia indicativa (calcolata dal peso adulto stimato nel passaporto), il ritmo in kg a
  settimana, la proiezione da adulta e l'elenco delle pesate.
- **Da fare**: si scrive in cima e si aggiunge; divise in In ritardo, Questa settimana, Più avanti, Senza data. La
  spunta si annulla dal messaggio in basso. Il numero rosso sulla barra conta quelle in ritardo.
- **Passaporto**: il documento con foto, anagrafica, microchip, passaporto UE, pedigree; misure, alimentazione,
  contatti (un tocco per chiamare o scrivere), note e account.
- **+** al centro della barra: peso, vaccino, antiparassitario, visita, calore, cosa da fare, nota, contatto.
- Ogni eliminazione si annulla dal messaggio in basso. Tornando sull'app dopo un minuto i dati si rileggono, così
  quello che ha segnato l'altro telefono compare.

Regole (in `src/regole.js`, provate in `test/regole.test.js`):

- **Calore**: senza fine segnata, entro 35 giorni dall'inizio è "in corso"; dopo, la fine si stima a 21 giorni.
  Il prossimo è l'inizio più l'intervallo: sei mesi finché c'è un calore solo, poi la media dei suoi (scartando i
  salti sotto i 4 mesi o sopra i 13). La finestra è ± un mese.
- **Piometra**: da sorvegliare dalla fine del calore a 8 settimane dopo (il rischio più alto è tra la 4ª e l'8ª).
  In quel periodo la carta del Ciclo dice cosa guardare: perdite vaginali, sete molto aumentata, abbattimento.
- **Prossima dose suggerita**: vaccini un anno, antiparassitari un mese (Bravecto 3, Seresto 7), vermifugo 3 mesi,
  filaria un mese. È solo un punto di partenza: si cambia a mano, e una volta toccata non si muove più.
- **Urgenza**: in ritardo dopo la data; "presto" entro 14 giorni (7 per quelli mensili e per le cose da fare).
- **Fascia del peso**: quota del peso adulto per età (curva indicativa per razze medie: 52% a 4 mesi, 70% a 6,
  83% a 8, 97% a 12) moltiplicata per il peso adulto minimo e massimo del profilo. Non è una tabella veterinaria.

## Passi manuali, una volta sola

0. **Repo GitHub**: `alv-bsp/cola`, pubblico, vuoto (senza README né .gitignore).
   Dalla cartella del progetto: `git push -u origin main` (il remote `origin` è già impostato).
1. **Supabase** (progetto di Cosa mangiamo) → **SQL Editor** → incolla ed esegui `supabase/schema.sql`.
   L'ultima istruzione aggiunge ai membri gli utenti del progetto e li mostra: controlla che ci siate solo voi due.
   Le impostazioni di Authentication restano quelle di Cosa mangiamo (email e password, registrazioni chiuse):
   non servono redirect perché non ci sono magic link.
2. **GitHub → repo → Settings → Secrets and variables → Actions → Variables** (tab Variables, non Secrets):
   - `SUPABASE_URL` = lo stesso di `food-app/js/config.js`
   - `SUPABASE_PUBLISHABLE_KEY` = la publishable key, sempre da lì
3. **GitHub → Settings → Pages** → Source: **GitHub Actions**. Poi `git push` (o rilancia "Deploy su Pages").
   Quando è verde l'app è su `https://alv-bsp.github.io/cola/`. Lancia anche una volta a mano "Keep-alive Supabase"
   per controllare che risponda `"pong"`.
4. **Sull'iPhone** (tu e Giulia): apri l'indirizzo in Safari → Condividi → **Aggiungi alla schermata Home**, apri
   l'app da lì e accedi con l'account di Cosa mangiamo. Al primo accesso, con il database vuoto, l'app carica da sola
   i dati di partenza (`src/partenza.js`); poi tocca il ritratto per mettere la foto di Cola.

## Sviluppo in locale

```bash
cd ~/Developer/personal/cola
npm install
# .env.local c'è già con URL e publishable key di Cosa mangiamo (non va nel repo); il modello è .env.example
npm run dev                  # http://localhost:5173
npm run demo                 # http://localhost:5174, con un Supabase finto e dati inventati: per provare la UI
npm test                     # regole di età, calore, peso, scadenze e cose da fare
```

La demo (`scripts/demo/`) non legge `.env.local` e non fa richieste di rete: quello che salvi sparisce ricaricando.

Per provarla sull'iPhone nella stessa rete: `npm run dev -- --host` e apri l'indirizzo che stampa.
Le icone si rifanno con `python3 scripts/icona/disegna.py` (serve Pillow).

## Sicurezza

L'indirizzo di Pages è pubblico e la chiave publishable finisce nel bundle: la protezione dei dati sta tutta in Supabase.

- Login solo con email e password, registrazioni chiuse (impostazioni del progetto di Cosa mangiamo).
- I dati di Cola sono di casa, non di una persona: tutte le tabelle `cola_` sono visibili e modificabili da chi sta in
  `cola_membri`, e da nessun altro. Ognuno vede solo la propria riga di `cola_membri`, che dall'app non si modifica.
- Chi non ha fatto login non ha nessun permesso sulle tabelle: può solo chiamare `ping()`, che non legge dati.
- Bucket `cola` privato, massimo 1 MB a file, solo WebP e JPEG, leggibile solo dai membri con signed URL.
- `vite.config.js` ferma la build se al posto della publishable arriva una chiave secret o service_role.

## Limiti e manutenzione

- **Pausa dopo 7 giorni di inattività** del progetto Supabase: lo tiene sveglio il keep-alive di Cosa mangiamo (una
  lettura al giorno); qui c'è `keepalive.yml` come riserva. GitHub disattiva i workflow schedulati dopo 60 giorni
  senza commit nel repo: si riattivano da Actions, oppure con un commit qualsiasi.
- **Due progetti Supabase gratuiti al massimo**: sono già Armadio+Piante e Cosa mangiamo, per questo Cola sta in
  quest'ultimo.
- **Aggiungere un membro**: SQL Editor →
  `insert into public.cola_membri (user_id, nome) select id, email from auth.users where email = '<email>';`

## Come è fatta

```
index.html                 shell della pagina
vite.config.js             base relativa './', controllo della chiave
public/                    manifest e icone (la zampa)
src/main.js                avvio, sessione, guscio con barre, azioni, foto del profilo
src/regole.js              età, calore, peso, scadenze, cose da fare, cronologia (funzioni pure)
src/stato.js               stato in memoria
src/dati.js                letture e scritture su Supabase
src/partenza.js            i dati di partenza di Cola
src/foto.js                foto: ridimensiona, carica, URL firmati (stesso codice di Armadio e Piante)
src/tempo.js               date in parole
src/router.js              routing a hash: #/oggi, #/salute, #/cose, #/passaporto, #/peso, #/diario
src/viste/                 una vista per pagina, più moduli.js (tutti i fogli di inserimento) e comuni.js
src/ui/                    template HTML con escape, icone, grafici (barre, linea, onda), toast e foglio
src/stile/                 token, base e componenti
supabase/schema.sql        tabelle, grant, RLS, bucket, ping(), membri
scripts/icona/disegna.py   l'icona dell'app in SVG e PNG
test/                      node --test
```

## Decisioni

- **Progetto Supabase di Cosa mangiamo, dati condivisi**: Cola è di tutti e due, quindi niente `user_id` sulle righe
  ma una tabella di membri. Ogni riga tiene `creato_da` per sapere chi l'ha segnata.
- **Salute in una tabella sola** (`cola_salute`): vaccini, antiparassitari, vermifughi, filaria, farmaci, visite ed
  esami sono tutti "una cosa fatta un giorno, forse da rifare". La scadenza è il `prossimo_il` dell'evento più recente
  con lo stesso tipo e nome, così lo storico resta intero e "Fatto oggi" è solo un evento in più.
- **Stime dichiarate**: prossimo calore, fine non segnata, fascia del peso e proiezione da adulta sono sempre
  etichettati come stime, con il ± o la parola.
- **Dati di partenza dalla memoria**: anagrafica, pesate, primo calore, misure, alimentazione, regole per chi la tiene,
  contatti e cose aperte vengono dalla memoria e dalla sua storia su Git. Si caricano da soli al primo accesso, una volta
  sola (quando non c'è ancora il profilo). Niente vaccini né tappe senza data: meglio vuoto che inventato.
- **Notifiche push rimandate** alla seconda tappa: per ora le scadenze stanno in Oggi e nella barra.
- **Niente service worker**: l'offline non è richiesto, e così non c'è una cache da invalidare a ogni rilascio.
- **Dati in memoria**: poche centinaia di righe in tutto, si carica tutto dopo il login.

## Tappe

- [x] 1. Scaffold, login, Oggi, Salute, Peso, Da fare, Passaporto, Diario, foto del profilo
- [ ] 2. Notifiche push per richiami, antiparassitario e cose in scadenza (riusando la funzione di Piante)
- [ ] 3. Foto nel diario
- [ ] 4. Rifinitura dopo qualche settimana d'uso

## Licenze

Inter: SIL Open Font License 1.1 (`src/assets/OFL-Inter.txt`). Icone: Lucide, licenza ISC; la zampa è disegnata qui.
