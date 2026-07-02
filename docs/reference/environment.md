# Environment variables

See also: [Run without Docker](../how-to/run-without-docker.md) · [Security](../explanation/security.md)

Every variable the app reads at runtime, its default, and where it matters. For local runs these live in `.env` (copy from `.env.example`); under Docker they are set inline in `docker-compose.yml`.

## Server

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `NODE_ENV` | `development` | `development`, `production`, or `test`. Controls CORS config, error detail, and rate limiting. |
| `PORT` | `3001` | HTTP listen port for the Express app. |

## Database

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `DATABASE_URL` | — | PostgreSQL connection string, `postgresql://USER:PASSWORD@HOST:PORT/DBNAME`. Required. |
| `DATABASE_SSL` | `false` | Set to `true` if the server requires SSL. When true, the client connects with `rejectUnauthorized: false`. |

## Tokens and sessions

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `ACCESS_TOKEN_SECRET` | — | Signing secret for JWT access tokens. |
| `REFRESH_TOKEN_SECRET` | — | Signing secret for JWT refresh tokens. |
| `SESSION_SECRET` | — | Secret for the Express session cookie. |
| `ACCESS_TOKEN_EXPIRY` | `15m` | Access token lifetime. |
| `REFRESH_TOKEN_EXPIRY` | `7d` | Refresh token lifetime. |

!!! warning "Change the secrets outside local development"
    The example and Docker values are throwaway development secrets. Any real deployment must set strong, unique values for all three secrets.

## Logging

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `LOG_LEVEL` | `info` | Winston log level. |

## Security

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `ALLOWED_ORIGINS` | — | Comma-separated CORS allowlist, used when `NODE_ENV=production`. |
| `ENFORCE_HTTPS` | `false` | Redirect HTTP to HTTPS. Must be `false` for local development. |

## Rate limiting

Requests per window, per IP. Bypassed entirely when `NODE_ENV=test`.

| Variable | Default | Applies to |
| -------- | ------- | ---------- |
| `GENERAL_RATE_LIMIT` | `100` | General API routes (topics, comments) |
| `AUTH_RATE_LIMIT` | `5` | Login and registration |
| `REFRESH_RATE_LIMIT` | `10` | Token refresh |

## Account lockout

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `MAX_FAILED_LOGIN_ATTEMPTS` | `5` | Failed logins before the account locks. |
| `LOCKOUT_DURATION_MINUTES` | `15` | How long an account stays locked. |
| `RESET_FAILURES_AFTER_MINUTES` | `60` | Idle window after which the failure counter resets. |

## Demo data seeding

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `SEED_TOPICS` | `false` | Seed demo topics on startup. |
| `SEED_TOPICS_ON_EMPTY_ONLY` | `true` | Only seed when the topics table is empty. |
| `SEED_TOPICS_FILE` | `seeds/topics.seed.json` | Path to the seed file. |
