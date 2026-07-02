# Run with Docker

See also: [Quickstart](../tutorials/10-quickstart.md) · [Environment variables](../reference/environment.md)

## Overview

The Docker Compose setup runs the full stack: PostgreSQL, the Express app, and an Nginx reverse proxy. It bakes in development secrets and seeds demo topics, so it runs without a local `.env` file. Use it for local development and demos.

## Prerequisites

- Docker and Docker Compose
- Ports `80`, `3001`, and `5432` free

## Start the stack

```bash
docker compose up --build
```

Startup order is enforced by healthchecks: `postgres` (checked with `pg_isready`) must be healthy before `app` starts, and `app` must pass its `/health` check before `nginx` starts.

The app is reachable at:

- <http://localhost> — through Nginx (port `80`)
- <http://localhost:3001> — the Express app directly

## Stop the stack

```bash
docker compose down
```

To also drop the database volume and start fresh next time:

```bash
docker compose down -v
```

!!! warning "`down -v` deletes all data"
    The `-v` flag removes the `postgres-data` volume, wiping every registered user, topic and comment. Leave it off to keep your data between runs.

## Change configuration

The container environment is defined inline in `docker-compose.yml` under the `app` service. To change ports, secrets, seeding, or rate limits, edit those values there. For the meaning of each variable, see [Environment variables](../reference/environment.md).

## Verify

```bash
curl http://localhost/health
```

A `200` response with `"status": "OK"` means the app is up and connected to PostgreSQL.
