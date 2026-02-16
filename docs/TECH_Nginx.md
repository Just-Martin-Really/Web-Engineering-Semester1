# Nginx (Reverse Proxy)

## Was macht Nginx hier?
Nginx sitzt „vor“ der Node/Express‑App und nimmt HTTP‑Traffic auf Port **80** entgegen.
Dann leitet Nginx die Requests intern an den `app` Container weiter (`app:3001`).

**Warum macht man das?**
- saubere Trennung: Nginx für HTTP‑Traffic, Node nur für App‑Logik
- Nginx kann später leichter TLS/HTTPS terminieren, caching, gzip etc.

---

## Konfiguration in diesem Projekt
Datei: `nginx.conf`

Wichtige Punkte:
- `upstream app_server { server app:3001; }`
  - `app` ist der *Docker Compose Service‑Name* → dadurch funktioniert Service‑Discovery im Netzwerk.

- `location / { proxy_pass http://app_server; }`
  - alles wird an die App weitergeleitet

- `location /health { return 200 "OK\n"; }`
  - eigener Health‑Endpoint nur für Docker‑Checks

---

## Wie hängt das mit Docker Compose zusammen?
In `docker-compose.yml`:
- `nginx` hängt von `app` ab (`depends_on` mit health condition)
- Ports: `80:80` → Browser öffnet `http://localhost`

---

## Häufige Fehlerbilder
- **Nginx startet nicht**
  - oft wegen Syntax‑Fehler in `nginx.conf` (dann steht’s im Container log)

- **Nginx startet, aber Seite nicht erreichbar**
  - App nicht healthy / App crashed → Nginx kann upstream nicht erreichen
  - Proxy‑Header/Timeouts falsch (seltener)

- **Healthcheck OK, aber App nicht erreichbar**
  - Beachte: `/health` in Nginx gibt "OK" zurück, checkt aber nicht automatisch die App. (Das ist Absicht für Docker‑Liveness.)

---

## Best Practices (lokal)
- Debug‑Logs sind lokal okay (`error_log ... debug;`).
- In Production Logs eher auf `warn/error` reduzieren.
- Healthchecks so bauen, dass sie echte Erreichbarkeit prüfen (optional später: `proxy_pass` für `/health`).

