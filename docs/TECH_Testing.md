# Tests (Mocha, Chai, Supertest) – Zusammenfassung

## Was wird getestet?
Der Fokus liegt auf API‑/Integrations‑Tests.
Das bedeutet: Die Tests rufen echte Endpunkte auf (z. B. Registrierung/Login/Topics) und überprüfen Statuscodes und Response‑Bodies.

Warum das gut ist:
- es testet „wie ein echter Client“
- es findet viele Fehler, die Unit‑Tests nicht finden (Routing, Middleware, DB‑Zugriff, Response‑Formate)

---

## Tech‑Stack
- **Mocha**: Test Runner
- **Chai**: Assertions („expect … to equal …“)
- **Supertest**: HTTP Requests an Express‑App

Die Tests liegen in `tests/`.

---

## Tests lokal vs. in Docker
Es gibt ein wichtiges Projekt‑Prinzip:
- Host‑Tests können täuschen.
- „Realistisch“ = Docker.

Dafür gibt es:
- `npm run test:docker` → baut/starts Container und führt Tests im `app` Container aus.

---

## Typische Stolpersteine
- Rate Limiting kann Tests beeinflussen (wenn viele Requests schnell hintereinander kommen).
- Tests müssen deterministisch sein (keine echten externen Services).
- Testdaten müssen valide sein (z. B. Username‑Länge, Kurs‑Werte).

---

## Best Practices
- Pro Bugfix: ein Test, der vorher fehlschlägt und danach grün ist.
- Happy Path + Edge Case.
- Keine Abhängigkeit von realer Zeit oder Request‑Reihenfolge.

