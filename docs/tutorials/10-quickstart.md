# Quickstart

See also: [Run with Docker](../how-to/run-with-docker.md) · [Architecture](../explanation/architecture.md)

Get the full Kursforum stack, PostgreSQL, the Express app and Nginx, running locally and open the forum in your browser. About five minutes.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- Git
- A free port `80` (Nginx) and `3001` (app) and `5432` (PostgreSQL) on your machine

## 1. Get the code

```bash
git clone https://github.com/Just-Martin-Really/Web-Engineering-Semester1.git
cd Web-Engineering-Semester1
```

## 2. Start the stack

The Docker Compose setup already ships development secrets and turns on demo-data seeding, so no `.env` file is needed for a first run.

```bash
docker compose up --build
```

Compose starts three containers in order: `postgres` becomes healthy first, then `app` connects and creates the schema, then `nginx` comes up as the reverse proxy.

## 3. Open the forum

Once the logs show `PostgreSQL connected and schema ready`, open:

- <http://localhost> — the landing page, served through Nginx

From there:

- **/register** — create an account (pick course TIA, TIS or TIK)
- **/forum** — read topics and post comments

The database is seeded with demo topics on startup (`SEED_TOPICS=true` in `docker-compose.yml`), so the forum is not empty on first launch.

## 4. Check the health endpoint

The Express app exposes a JSON health endpoint. Query it directly on port `3001`:

```bash
curl http://localhost:3001/health
```

```json
{ "status": "OK", "timestamp": "2026-01-01T00:00:00.000Z", "uptime": 12.34 }
```

The app's own Docker healthcheck polls this endpoint. Note that `http://localhost/health` (through Nginx on port `80`) is answered by Nginx itself with a plain `OK`, not this JSON, because Nginx short-circuits that path for its own healthcheck.

## What you have now

- A running forum at <http://localhost>
- A PostgreSQL database with the schema applied and demo topics seeded
- A JSON API under `/api` (see the [API reference](../reference/api.md))

## Next steps

- Post and comment through the API: [API reference](../reference/api.md)
- Run the stack without Docker: [Run without Docker](../how-to/run-without-docker.md)
- Understand how requests flow through the system: [Architecture](../explanation/architecture.md)
