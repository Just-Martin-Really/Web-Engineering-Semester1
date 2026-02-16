# Backend‑Security (Zusammenfassung)

## Was ist in diesem Projekt „Backend‑Security“?
Backend‑Security bedeutet: Der Server soll typische Web‑Angriffe abwehren und Fehler so behandeln, dass keine sensiblen Infos geleakt werden.

In diesem Projekt passiert Security vor allem über:
- Security‑Middleware (`middleware/securityMiddleware.js`)
- Validierung (`express-validator`, siehe `utils/validationRules.js`)
- Rate Limiting (Middleware im `middleware/` Ordner)
- saubere Error Responses (`middleware/errorMiddleware.js`)

---

## 1) HTTP Security Headers (Helmet)
Helmet setzt Standard‑Header wie:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options`
- (optional) CSP, HSTS

Ziel: Browser‑seitige Angriffe erschweren (Clickjacking, MIME sniffing, usw.).

---

## 2) CORS
CORS steuert, welche Webseiten/Origins die API aus dem Browser heraus aufrufen dürfen.
In Docker/Lokal ist das oft lockerer.

Wichtig:
- CORS ist kein Auth‑Ersatz.
- CORS schützt vor „fremde Webseite ruft deine API im Browser auf“. Server‑to‑Server Calls sind davon nicht betroffen.

---

## 3) Input‑Validierung statt „Sanitizing überall“
Das Projekt validiert Requests an der Route‑Boundary (z. B. Registrierungsfelder, Topic‑Daten).

Warum das besser ist:
- klare Fehlermeldungen für Nutzer
- weniger Überraschungen als aggressive Sanitizer
- geringeres Risiko, dass Sanitizer kaputt geht oder Sonderfälle erzeugt

---

## 4) HPP (HTTP Parameter Pollution)
`hpp` verhindert, dass Query‑Parameter mehrfach auftauchen und dadurch Logik umgangen wird.
Beispiel: `?kurs=TIA&kurs=TIS`

---

## 5) Request Timeout
`requestTimeout` begrenzt, wie lange ein Request „hängen“ darf.
Schützt u. a. vor Slowloris‑artigen Angriffen.

---

## 6) HTTPS Enforcement (konfigurierbar)
In Production kann HTTPS erzwungen werden.
Lokal ist das oft deaktiviert, weil ihr über `http://localhost` arbeitet.

---

## Sicherheits‑Best‑Practices (kurz)
- Validiere Eingaben strikt.
- Leak keine internen Stacktraces an Clients.
- Logge keine Tokens/Passwörter.
- Halte Secrets in Env Vars.

