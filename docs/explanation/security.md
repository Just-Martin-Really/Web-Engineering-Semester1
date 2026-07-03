# Security

See also: [Auth model](auth-model.md) · [Environment variables](../reference/environment.md)

Kursforum layers several defenses in front of the application logic. This page explains what each layer does and why it's there. Configuration values live in [Environment variables](../reference/environment.md).

## Transport and headers

- **Helmet** sets a baseline of secure HTTP response headers, plus a few custom headers on top.
- **HTTPS enforcement** redirects HTTP to HTTPS when `NODE_ENV=production` and the request did not arrive over HTTPS (checked via the `X-Forwarded-Proto` header). It stays off in development, where there's no TLS.

## CORS

The allowed origins depend on `NODE_ENV`. In production the app reads `ALLOWED_ORIGINS`, a comma-separated allowlist, so only known front-ends can call the API from a browser. Development uses a looser config for convenience.

## Input handling

- **Body size limit** — JSON bodies are capped at `10kb`, so a request can't exhaust memory.
- **Validation** — `express-validator` chains in `utils/validationRules.js` check every field (lengths, allowed characters, the `TIA`/`TIS`/`TIK` course set) before a controller runs. Failures return a structured validation error.
- **HPP** — HTTP Parameter Pollution protection strips duplicated query parameters that could otherwise bypass validation.

## Rate limiting

Per-IP limits throttle abuse. Auth endpoints are the strictest, because login and registration are the attack surface for credential stuffing.

| Scope | Default | Why |
| ----- | ------- | --- |
| General API | `100` / window | Blunt brute-force against reads and writes |
| Auth | `5` / window | Slow down credential stuffing on login/registration |
| Refresh | `10` / window | Limit token-refresh abuse |

Rate limiting is disabled when `NODE_ENV=test` so the test suite isn't throttled.

## Accounts and secrets

- **Password hashing** — passwords are stored as bcrypt hashes, never in plaintext.
- **Account lockout** — repeated failed logins lock an account temporarily; see [Auth model](auth-model.md#account-lockout).
- **Split JWT secrets** — access and refresh tokens use separate signing secrets.

!!! warning "Development secrets are not production secrets"
    The secrets in `.env.example` and `docker-compose.yml` are placeholders. A real deployment must set strong, unique values and run with `NODE_ENV=production`, which turns on HTTPS redirection, behind a TLS-terminating proxy.
