# MongoDB & Mongoose (Datenbank)

## Was ist MongoDB?
MongoDB ist eine NoSQL‑Datenbank. Daten werden als Dokumente (ähnlich wie JSON) in Collections gespeichert.

**Typischer Vorteil für Webprojekte:** flexibel, schnell iterierbar, gute Unterstützung für Dokument‑Modelle.

---

## Was ist Mongoose?
Mongoose ist eine „Brücke“ zwischen Node.js und MongoDB:
- definiert **Schemas** (Strukturregeln)
- erzeugt **Models** (z. B. `User`, `Topic`)
- bietet Validierung, Query‑API und hilfreiche Fehlerklassen

Im Projekt:
- Modelle liegen in `models/` (z. B. `models/User.js`, `models/Topic.js`).

---

## Verbindung zur Datenbank
In `server.js` wird die DB verbunden:
- `MONGODB_URI` kommt aus Env Vars (Docker setzt sie auf `mongodb://mongodb:27017/mongo-app`).
- erst nach erfolgreichem Connect wird Session‑Middleware initialisiert (wichtig, weil Session‑Store MongoDB nutzt).

**Warum genau so?**
Wenn der Session‑Store vor dem DB‑Connect startet, kann die App instabil werden (Sessions können nicht gespeichert werden).

---

## Typische Fehlerbilder
- **Connection refused / falscher Host**: in Docker muss es `mongodb` heißen (Service‑Name), nicht `localhost`.
- **Duplicate key (code 11000)**: z. B. Username schon vergeben.
- **CastError**: ungültige ObjectId (z. B. `/api/topics/abc`).

Diese Fehler werden im Projekt in `middleware/errorMiddleware.js` in verständlichere Antworten übersetzt.

---

## Sicherheit: NoSQL Injection (kurz erklärt)
MongoDB Queries können gefährlich werden, wenn ungeprüfte Eingaben direkt in Query‑Objekte gemischt werden.
Gegenmaßnahmen im Projekt:
- Eingaben werden an der Route‑Boundary mit `express-validator` validiert.
- Der Error Handler klassifiziert DB‑Fehler sauber.

**Wichtig:** Validierung ist die Primär‑Verteidigung. Ungeprüfte „Free‑Form“ JSON‑Objekte sollten nicht direkt in Queries gehen.

---

## Best Practices
- Validierung an der Grenze (Routes), nicht erst „irgendwo später“.
- Keine DB‑Fehlerdetails direkt an Clients schicken.
- In Tests: DB‑State sauber isolieren (z. B. unique Nutzer/Topics pro Testläufe).

