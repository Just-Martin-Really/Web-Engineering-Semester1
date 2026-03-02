# Web-Engineering-Semester1

Web-Engineering Projekt von **Amica, Tamara, Stefan und Martin**.

## Überblick

Dieses Repository enthält eine kleine Kursforum-Webanwendung mit:

- **Node.js/Express** Backend (API + Page-Rendering)
- **Pug** als Template Engine (Views unter `views/`)
- **MongoDB** als Datenbank (via **Mongoose**)
- **Nginx** als Reverse Proxy (Docker)
- **Mocha/Chai/Supertest** Integrationstests

---

## Architektur (Docker / 3-Tier)

Der Standard-Setup läuft über Docker Compose:

- `mongodb` (MongoDB)
- `app` (Express App auf Port `3001`)
- `nginx` (Reverse Proxy auf Port `80`)

**Request-Flow (vereinfacht):**

```text
Browser -> http://localhost (Nginx:80) -> app:3001 (Express) -> MongoDB
```

### Wichtige Dateien

- `server.js` – Express Setup, Middleware, MongoDB-Connect, Routing, 404-Fallback
- `docker-compose.yml` – Container-Orchestrierung inkl. Healthchecks
- `nginx.conf` – Reverse Proxy Konfiguration
- `views/` – Pug Templates (`index.pug`, `registration.pug`, `forumpage.pug`, `404.pug`, `layout.pug`)
- `public/` – Statische Assets (CSS/JS/Images) via `express.static("public")`

---

## Features

### Pages (Pug)

Diese Routen rendern HTML über Pug:

- `GET /` → `views/index.pug`
- `GET /register` → `views/registration.pug`
- `GET /forum` → `views/forumpage.pug`

Nicht gefundene Seiten werden über einen HTML-404-Fallback gerendert (Pug `views/404.pug`), sofern der Client HTML
akzeptiert.

### API

- Authentifizierung (JWT) + Session (MongoDB Store)
- Topics (CRUD-light: read/create/delete) + embedded Comments
- Rate Limiting auf API-Routen (siehe `middleware/rateLimitMiddleware.js`)

---

## API Referenz (aus `routes/`)

### Health

- `GET /health`
    - Antwort: JSON (`{ status, timestamp, uptime }`)
    - Wird für Docker Healthchecks verwendet.

### Auth

Definiert in `routes/authRoutes.js`:

- `POST /api/registration`
- `POST /api/login`
- `POST /api/refresh`
- `POST /api/logout` (protected)

### Topics

Definiert in `routes/topicRoutes.js`:

- `GET /api/topics`
    - Optional: `?kurs=TIA|TIS|TIK` und Pagination via `?page=...&limit=...`
- `POST /api/topics` (protected)
- `DELETE /api/topics/:id` (protected, nur Author)
- `POST /api/topics/:id/comments` (protected)

Hinweis: **Topic-Update (PUT)** ist im aktuellen Code **nicht** vorhanden.

---

## Demo-Daten (Seed Topics)

Beim Start kann die App Demo-Topics in MongoDB einspielen.

Implementierung: `seeds/seedTopics.js` (wird in `server.js` nach erfolgreichem MongoDB-Connect ausgeführt).

Relevante Umgebungsvariablen (siehe z.B. `docker-compose.yml`):

- `SEED_TOPICS` (Boolean)
- `SEED_TOPICS_ON_EMPTY_ONLY` (Boolean)
- `SEED_TOPICS_FILE` (Pfad zur JSON-Datei; Default: `seeds/topics.seed.json`)

Seed-Format: JSON-Array mit pro Topic u.a. `seedKey`, `title`, `content`, `kurs`. Optional:

- `seedAuthorName`
- `seedComment` (`{ content, seedAuthorName }`)

---

## Docker Setup

Prerequisites: Docker & Docker Compose.

Start:

```bash
docker compose up --build
```

Danach ist die Anwendung über Nginx erreichbar:

- http://localhost

---

## Tests

### Lokal (Host)

```bash
npm test
```

### Docker-backed (Source of Truth)

```bash
npm run test:docker
```

Dieser Befehl baut Container neu, startet sie, und führt Tests **im `app` Container** aus.

---

## Tech Stack (aus `package.json`)

**Dependencies**:

- `bcryptjs`
- `connect-mongo`
- `cors`
- `dotenv`
- `express`
- `express-rate-limit`
- `express-session`
- `express-validator`
- `helmet`
- `hpp`
- `jsonwebtoken`
- `mongoose`
- `pug`
- `uuid`
- `winston`

**Dev Dependencies**:

- `mocha`
- `chai`
- `supertest`
