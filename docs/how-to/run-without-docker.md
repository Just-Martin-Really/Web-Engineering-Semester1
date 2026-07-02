# Run without Docker

See also: [Run with Docker](run-with-docker.md) · [Environment variables](../reference/environment.md)

## Overview

Run the Express app directly against a local PostgreSQL instance. Use this when you want fast restarts and a debugger attached, without rebuilding containers.

## Prerequisites

- Node.js and npm
- A running PostgreSQL server with a database named `kursforum`
- Node dependencies installed:

  ```bash
  npm install
  ```

## Step 1 — Create the environment file

Copy the example and adjust the values for your local PostgreSQL:

```bash
cp .env.example .env
```

At minimum, set `DATABASE_URL` to point at your database:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/kursforum
```

The token and session secrets can keep their example values for local development. See [Environment variables](../reference/environment.md) for every option.

## Step 2 — Start the app

```bash
npm start
```

On startup the app reads `db/schema.sql` and applies it, so the `users`, `topics`, `comments` and `session` tables are created automatically if they don't exist. It listens on `PORT` (default `3001`).

## Step 3 — Verify

```bash
curl http://localhost:3001/health
```

A `200` response with `"status": "OK"` confirms the app started and reached PostgreSQL.

!!! note "No Nginx in this mode"
    Running without Docker skips the Nginx reverse proxy. Reach the app directly on `http://localhost:3001` instead of `http://localhost`.

## Next steps

- Load demo topics: [Seed demo topics](seed-demo-topics.md)
- Exercise the endpoints: [API reference](../reference/api.md)
