# Express.js (Webserver & Routing)

## Was ist Express?
Express ist ein Web‑Framework für Node.js. Es nimmt HTTP‑Anfragen entgegen (z. B. `GET /forum` oder `POST /api/login`), führt Middleware aus und ruft danach die passende Route/Controller‑Logik auf.

**In einem Satz:** Express ist „der Server“, der eure API und eure Seiten ausliefert.

---

## Wo ist Express im Projekt?
- `server.js`: erstellt die Express‑App (`const app = express()`), registriert Middleware, Routes und Error Handler.
- `routes/`: hier liegen die Routen (URL‑Endpunkte).
  - `routes/pageRoutes.js`: Browser‑Seiten (Pug)
  - `routes/authRoutes.js`: Auth API
  - `routes/topicRoutes.js`: Thema/Kommentare API
- `controllers/`: Business‑Logik (z. B. Login/Registrierung, Topics)

---

## Middleware – das wichtigste Konzept
Middleware sind Funktionen, die *vor* der eigentlichen Route laufen.
Beispiele aus `server.js`:
- `addRequestId`: erzeugt `req.id` (nützlich für Log‑Tracing)
- `securityHeaders` / `customSecurityHeaders`: Sicherheits‑Header
- `cors(...)`: erlaubt/verbietet Zugriffe von bestimmten Origins
- `express.json({ limit: '10kb' })`: JSON‑Body parser mit Limit als DOS‑Schutz
- `requestTimeout`: schützt gegen „langsame“ Requests
- `hppProtection`: Schutz gegen HTTP Parameter Pollution
- `createSessionMiddleware(...)`: Sessions über Cookies

**Wichtig:** Reihenfolge zählt. Security‑Middleware gehört typischerweise früh in die Kette; Error Handler muss ganz ans Ende.

---

## Route‑Typen: Seiten vs. API
Dieses Projekt hat zwei Arten von Endpunkten:

### 1) Seiten (HTML) über Pug
- Kommen aus `routes/pageRoutes.js`
- Rendern Templates aus `views/` über `res.render(...)`

### 2) API (JSON)
- Prefix `/api` bzw. `/api/topics`
- Gibt JSON zurück (z. B. für Login/Registrierung, Topics)

---

## Fehlerbehandlung in Express
Express kennt spezielle Error‑Middleware mit Signatur `(err, req, res, next)`.
In diesem Projekt zentral: `middleware/errorMiddleware.js`.

Ziele:
- nur *eine* Stelle, die Errors in ein einheitliches JSON‑Format wandelt
- Logs enthalten Request‑Kontext (`requestId`, path, method, userId)
- keine Stacktraces an den Browser/API‑Client herausgeben

---

## Best Practices (Kurzliste)
- Middleware‑Stack dokumentieren und Reihenfolge bewusst halten.
- Validierung in den Routes (Boundary), Business‑Logik in Controller.
- Einheitliche Response‑Formate.
- Error Handler muss „niemals werfen“.

