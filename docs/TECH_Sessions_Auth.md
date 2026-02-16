# Sessions & Auth (Cookies, JWT, Login)

## Zielbild (was wir im Projekt haben)
In Web‑Apps gibt es meistens zwei verwandte Themen:
1) **Authentifizierung (Auth)**: Wer bist du?
2) **Session/State**: „Du bist eingeloggt“ über mehrere Requests hinweg.

In diesem Projekt existieren beide Konzepte:
- **JWT** (JSON Web Token) für API‑Auth (z. B. bei geschützten Endpunkten)
- **Sessions** über `express-session` + `connect-mongo` (serverseitiger State, Cookie im Browser)

---

## Sessions: Wie funktioniert das?
- Der Browser bekommt ein **Session‑Cookie**.
- Im Cookie steht nicht „alle Daten“, sondern nur eine **Session‑ID**.
- Die Session‑Daten liegen serverseitig in MongoDB (Collection `sessions`).

In Code:
- `middleware/sessionMiddleware.js` baut die Session‑Middleware.
- In `server.js` wird sie **nach** erfolgreichem MongoDB‑Connect aktiviert.

**Warum Mongo‑Store?**
- Sessions überleben Server‑Restart.
- bei mehr als einem App‑Container (Skalierung) sehen alle denselben Session‑State.

---

## JWT: Wie funktioniert das grob?
- Der Server signiert ein Token (mit Secret).
- Der Client sendet es bei Requests mit (`Authorization: Bearer ...`).
- Der Server validiert Signatur und Ablaufzeit.

JWT ist praktisch für APIs, weil es „stateless“ sein kann.

---

## Welche Variante sollte man wofür nutzen?
- **API‑Endpunkte** (z. B. `POST /api/topics`) → JWT ist üblich.
- **Seiten‑Sessions / serverseitige Logik** → Sessions sind komfortabel.

In einem kleinen lokalen Projekt kann man beides parallel haben.
Wichtig ist nur: konsistent bleiben, und Secrets/Expiry sauber konfigurieren.

---

## Sicherheit (kurz & wichtig)
- Session‑Cookies sollten in Production `secure: true` haben (nur über HTTPS).
- Lokal darf das konfigurierbar sein (sonst bricht Dev).
- Secrets dürfen nie im Repo landen.

---

## Troubleshooting
- „Ich bin ständig ausgeloggt“: Cookie‑Settings (SameSite/Secure), Domain/Port mismatch.
- „Session store error“: MongoDB nicht erreichbar oder falsche URI.
- „Token invalid/expired“: Secret passt nicht oder Expiry zu kurz.

