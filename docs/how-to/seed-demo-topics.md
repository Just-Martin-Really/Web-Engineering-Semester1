# Seed demo topics

See also: [Environment variables](../reference/environment.md) · [Database schema](../reference/database-schema.md)

## Overview

The app can insert demo topics into PostgreSQL on startup so the forum isn't empty. Seeding is controlled by three environment variables and reads topics from a JSON file. This runs after the schema is applied, from `seeds/seedTopics.js`.

## Prerequisites

- A configured environment (`.env` for local, or the inline env in `docker-compose.yml` for Docker)
- A seed file in the expected format (a default lives at `seeds/topics.seed.json`)

## Step 1 — Turn seeding on

Set the seeding variables:

| Variable | Value | Effect |
| -------- | ----- | ------ |
| `SEED_TOPICS` | `true` | Enable seeding on startup |
| `SEED_TOPICS_ON_EMPTY_ONLY` | `true` | Seed only when the topics table is empty |
| `SEED_TOPICS_FILE` | path | Seed file to read (default `seeds/topics.seed.json`) |

Set `SEED_TOPICS_ON_EMPTY_ONLY=false` to re-seed on every startup. Topics are keyed by `seed_key` (a unique column), so re-runs update matching rows instead of creating duplicates.

## Step 2 — Provide the seed data

Each entry in the JSON array describes one topic:

```json
[
  {
    "seedKey": "welcome-tia",
    "title": "Willkommen im TIA-Forum",
    "content": "Stellt euch hier kurz vor.",
    "kurs": "TIA",
    "seedAuthorName": "Amica",
    "seedComment": { "content": "Viel Erfolg!", "seedAuthorName": "Tamara" }
  }
]
```

Required per topic: `seedKey`, `title`, `content`, `kurs` (one of `TIA`, `TIS`, `TIK`). Optional: `seedAuthorName` and a single `seedComment`.

## Step 3 — Start the app

Seeding runs automatically on the next startup:

```bash
npm start
```

The Docker setup already ships `SEED_TOPICS=true` with `SEED_TOPICS_ON_EMPTY_ONLY=false`, so demo topics appear on every `docker compose up`.

## Verify

```bash
curl "http://localhost:3001/api/topics"
```

The response lists the seeded topics. Seeded rows have a `seedAuthorName` and no linked user account.
