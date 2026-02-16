# Docker & Docker Compose (Lokale Laufumgebung)

## Was ist Docker?
Docker packt Anwendungen in Container. Ein Container enthält alles, was die App braucht (Runtime, Dependencies, Konfiguration).

**Warum bei euch sinnvoll:**
- alle Teammitglieder haben dieselbe Umgebung
- MongoDB, App und Nginx laufen reproduzierbar zusammen

---

## Docker Compose in diesem Projekt
`docker-compose.yml` startet drei Services:

1. `mongodb` (Datenbank)
- Image: `mongo:latest`
- Volume: `mongo-data` (persistente Daten)
- Healthcheck: `mongosh ... ping`

2. `app` (Node/Express)
- Build aus `dockerfile`
- Port: `3001:3001`
- Env Vars: `MONGODB_URI`, `NODE_ENV`, Secrets usw.
- Healthcheck: `GET http://localhost:3001/health`

3. `nginx` (Reverse Proxy)
- Image: `nginx:latest`
- Port: `80:80`
- Config: `nginx.conf`
- Depends on `app` (healthy)
- Healthcheck: `curl -f http://localhost/health`

---

## Warum „depends_on + healthcheck“ wichtig ist
Damit Nginx nicht startet, bevor die App wirklich läuft.
Ohne Healthchecks kann Compose nur „Container gestartet“ prüfen, nicht „App ist bereit“.

---

## Tests in Docker (realistisch)
Das Projekt hat ein Script:
- `npm run test:docker`

Das macht:
1) Container bauen/starten
2) Tests im laufenden `app` Container ausführen

**Warum das eure „Source of Truth“ ist:**
Host‑Tests können an Port‑Konflikten, local Mongo etc. vorbeilaufen. Docker spiegelt eher das echte Setup.

---

## Häufige Probleme
- Compose Warnung: `version` Feld ist „obsolete“ → tut nicht weh, kann später bereinigt werden.
- Container „unhealthy“: meist Healthcheck‑URL oder App‑Crash (Logs prüfen).
- Nginx startet, aber `localhost` geht nicht: Proxy‑Pass / Upstream / Ports prüfen.

---

## Best Practices für lokale Docker‑Security
- Für *lokal* nicht unnötig HTTPS erzwingen (`NODE_ENV=development`, `ENFORCE_HTTPS=false`).
- Trotzdem Security‑Header aktiv lassen (schadet lokal nicht, hilft aber saubere Defaults zu behalten).

