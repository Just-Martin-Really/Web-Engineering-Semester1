# Environment variables

See also: [Run without Docker](../how-to/run-without-docker.md) · [Security](../explanation/security.md)

The configuration the app reads at runtime, its defaults, and where it matters. For local runs these live in `.env` (copy from `.env.example`); under Docker they are set inline in `docker-compose.yml`. Some entries in `.env.example` are placeholders that the app does not yet read; those are called out where they appear below.

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
| `ALLOWED_ORIGINS` | — | Comma-separated CORS allowlist, read when `NODE_ENV=production`. |

HTTPS redirection is not controlled by an environment variable. The app redirects HTTP to HTTPS only when `NODE_ENV=production` and the incoming `X-Forwarded-Proto` header is not `https` (see `middleware/securityMiddleware.js`). The `ENFORCE_HTTPS` entry in `.env.example` is a placeholder and is not read by the app.

## Rate limiting

The rate-limit thresholds are fixed constants defined in `utils/securityConfig.js`, not environment variables. The `GENERAL_RATE_LIMIT`, `AUTH_RATE_LIMIT` and `REFRESH_RATE_LIMIT` entries in `.env.example` are placeholders and are not read by the app.

Current values (requests per 15-minute window, per IP):

| Scope | Limit | Applies to |
| ----- | ----- | ---------- |
| General | `100` | General API routes (topics, comments) |
| Auth | `5` | Login and registration (only failed attempts count) |
| Refresh | `10` | Token refresh |

## Account lockout

Like the rate limits, the lockout thresholds are fixed constants in `utils/securityConfig.js`, not environment variables. The entries below appear in `.env.example` but are not read by the app.

Current values:

| Setting | Value | Description |
| ------- | ----- | ----------- |
| Max failed attempts | `5` | Failed logins before the account locks. |
| Lockout duration | `15` minutes | How long an account stays locked. |
| Reset window | `60` minutes | Idle window after which the failure counter resets. |

## Demo data seeding

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `SEED_TOPICS` | `false` | Seed demo topics on startup. |
| `SEED_TOPICS_ON_EMPTY_ONLY` | `true` | Only seed when the topics table is empty. |
| `SEED_TOPICS_FILE` | `seeds/topics.seed.json` | Path to the seed file. |
