# Error Handling & Logging

## Ziel
Wenn etwas schiefgeht, sollen zwei Dinge passieren:
1) Der Client bekommt eine **verständliche, sichere** Fehlermeldung.
2) Im Backend gibt’s **genug Logs**, um das Problem zu debuggen (ohne Secrets zu leaken).

---

## Error Handling (Backend)
Zentraler Baustein:
- `middleware/errorMiddleware.js` (`errorHandler`)

Was der Error Handler macht:
- erkennt typische Fehlerarten (z. B. Mongoose CastError, Duplicate Key, Mongoose Validation)
- wandelt sie in ein einheitliches JSON‑Format um
- loggt den Fehler mit Kontext (Request‑ID usw.)

Warum das wichtig ist:
- Code bleibt DRY (keine 20 verschiedene `res.status(500)...`)
- Clients können Fehler besser anzeigen
- Logs sind nachvollziehbar

---

## Logging (Console + Files)
Zentral:
- `utils/errorLogger.js` basiert auf Winston

Outputs:
- **Console** (für Dev)
- `logs/combined.log` (alle Logs)
- `logs/error.log` (nur Errors)

Zusätzliche Helper:
- `logAuthEvent(...)`: Auth‑Events
- `logSecurityEvent(...)`: Security‑Events
- `logDatabaseEvent(...)`: DB‑Debug (nur bei Debug‑Level relevant)

---

## Request‑ID (Traceability)
Middleware:
- `addRequestId` setzt `req.id` und Header `X-Request-ID`.

Vorteil:
- Wenn ein User sagt „bei mir ging’s nicht“, kann man in Logs nach dieser ID suchen.

---

## Was wir NICHT loggen sollten
- Passwörter
- JWT Tokens
- Session Secrets

Grund: Logs landen oft in Dateien, Backups, ggf. später in zentralen Systemen.

---

## Best Practices
- Error Handler muss **als letztes** `app.use(...)` registriert sein.
- Error Handler darf selbst nicht crashen.
- Nutzt `LOG_LEVEL` gezielt (z. B. `info` in normalem Betrieb, `debug` nur bei Bedarf).

