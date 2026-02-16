# Node.js (Runtime)

## Was ist Node.js?
Node.js ist die Laufzeitumgebung, mit der JavaScript außerhalb des Browsers auf dem Server ausgeführt werden kann. In diesem Projekt läuft der komplette Backend‑Server als Node‑Prozess.

**Warum das hier wichtig ist:**
- Node.js stellt die Basis für Express (Webserver), Mongoose (MongoDB‑Zugriff), Tests (Mocha) und viele weitere Bibliotheken.
- Der Server kann viele gleichzeitige Requests effizient verarbeiten (asynchrones I/O).

---

## Wo sieht man Node.js im Projekt?
- Einstiegspunkt: `server.js`
- Abhängigkeiten & Scripts: `package.json`

Wichtige npm‑Scripts:
- `npm start` startet den Server lokal.
- `npm test` führt die Tests aus.
- `npm run test:docker` baut Container und führt Tests im Docker‑Container aus (realistischer).

---

## Umgebungsvariablen (Environment Variables)
Node.js liest Konfiguration sehr oft über Umgebungsvariablen (z. B. in Docker oder in `.env`).
In `server.js` werden sie mit `dotenv` geladen:
- `PORT`: Port des Express‑Servers (Standard: `3001`)
- `NODE_ENV`: Umgebung (z. B. `development`, `production`, `test`)
- `MONGODB_URI`: MongoDB Verbindung

**Warum?**
- Keine Secrets in den Code committen.
- Docker und lokale Entwicklung können sich sauber unterscheiden.

---

## Typische Fehlerbilder (praktisch)
- **„Cannot find module …“**: Abhängigkeit fehlt → `npm install`.
- **Port belegt**: Ein anderer Prozess nutzt `3001`.
- **NODE_ENV = production lokal**: kann zu strengeren Security‑Regeln führen (z. B. HTTPS‑Enforcement).

---

## Best Practices (kurz)
- Secrets nur per Env Vars.
- Keine blockierenden Operationen im Request‑Pfad (z. B. große Sync‑Dateioperationen).
- Sauberes Error Handling (damit Node nicht crashen muss).

