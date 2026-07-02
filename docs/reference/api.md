# HTTP API

See also: [Auth model](../explanation/auth-model.md) · [Environment variables](environment.md) · [Database schema](database-schema.md)

Every JSON endpoint the app exposes, its inputs, and its responses. Page routes that render HTML (`/`, `/register`, `/forum`) are listed under [Pages](#pages).

## Conventions

- Base path for the API is `/api`. Through Nginx the app is at `http://localhost`; direct, it's `http://localhost:3001`.
- All API requests and responses are JSON. The request body limit is `10kb`.
- Protected endpoints require an access token in the `Authorization` header: `Authorization: Bearer <accessToken>`.
- Rate limits apply per IP and are disabled when `NODE_ENV=test`. See [Rate limiting](environment.md#rate-limiting).

### Success envelope

Every successful response uses this shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Erfolg",
  "data": {},
  "timestamp": "2026-01-01T00:00:00.000Z",
  "requestId": "uuid"
}
```

List endpoints add a `pagination` object alongside `data`.

### Error envelope

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validierungsfehler",
  "errorCode": "VALIDATION_ERROR",
  "errorId": "uuid",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "requestId": "uuid"
}
```

Field-level `details` are included only when `NODE_ENV=development`.

## Health

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| `GET` | `/health` | none | Liveness probe used by Docker healthchecks |

Response `data` (returned at the top level, not wrapped):

```json
{ "status": "OK", "timestamp": "2026-01-01T00:00:00.000Z", "uptime": 12.34 }
```

## Auth

Defined in `routes/authRoutes.js`.

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| `POST` | `/api/registration` | none | Register a new user |
| `POST` | `/api/login` | none | Authenticate and receive tokens |
| `POST` | `/api/refresh` | none | Exchange a refresh token for a new access token |
| `POST` | `/api/logout` | Bearer | Invalidate the current session |

### POST /api/registration

Request body:

| Field | Rules |
| ----- | ----- |
| `firstname` | 1–50 chars, letters/spaces/apostrophes/hyphens |
| `lastname` | 1–50 chars, letters/spaces/apostrophes/hyphens |
| `username` | 3–20 chars, letters/numbers/underscores/hyphens; stored lowercase |
| `password` | min 8 chars, must include an uppercase letter, a lowercase letter and a number |
| `course` | one of `TIA`, `TIS`, `TIK` |

Returns `201` with the created user plus an access token, refresh token, `sessionId`, and `expiresIn`. Returns `409` (`ConflictError`) if the username is taken.

### POST /api/login

Request body: `username`, `password`.

Returns `200` with the user and a fresh token pair. Returns `401` for an unknown user, a wrong password, or a locked account. Repeated failures lock the account, see [Auth model](../explanation/auth-model.md#account-lockout).

### POST /api/refresh

Request body: `refreshToken`.

Returns `200` with a new `accessToken` and `expiresIn: "15m"`. Returns `401` if the refresh token is missing, invalid, or its user no longer exists.

### POST /api/logout

Requires `Authorization: Bearer <accessToken>`. Destroys the server-side session and returns `200`.

## Topics

Defined in `routes/topicRoutes.js`.

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| `GET` | `/api/topics` | none | List topics, filtered and paginated |
| `POST` | `/api/topics` | Bearer | Create a topic |
| `DELETE` | `/api/topics/:id` | Bearer | Delete a topic (author only) |
| `POST` | `/api/topics/:id/comments` | Bearer | Add a comment to a topic |

### GET /api/topics

Query parameters:

| Parameter | Default | Notes |
| --------- | ------- | ----- |
| `kurs` | — | Filter by course; ignored unless it's `TIA`, `TIS` or `TIK` |
| `page` | `1` | Page number, clamped to `>= 1` |
| `limit` | `10` | Items per page, clamped to `1`–`100` |

Returns `200` with a paginated list. Each topic carries a resolved `authorName` (the registered user's username, else the seed author name, else `Unbekannt`). The `pagination` object:

```json
{
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

### POST /api/topics

Request body:

| Field | Rules |
| ----- | ----- |
| `title` | 5–100 chars |
| `content` | 10–10000 chars |
| `kurs` | one of `TIA`, `TIS`, `TIK` |

Returns `201` with the created topic. The author is taken from the access token, not the body.

### DELETE /api/topics/:id

Deletes the topic identified by `:id`. Returns `200` on success. Returns an authorization error if the caller is not the topic's author; deleting another user's topic is rejected.

### POST /api/topics/:id/comments

Request body: `content` (1–1000 chars).

Returns `201` with the topic including the newly added comment and its resolved author.

## Pages

Defined in `routes/pageRoutes.js`. These render Pug templates and return HTML, not JSON.

| Method | Path | Template | Purpose |
| ------ | ---- | -------- | ------- |
| `GET` | `/` | `index.pug` | Landing page |
| `GET` | `/register` | `registration.pug` | Registration form |
| `GET` | `/forum` | `forumpage.pug` | Forum view |

Unknown paths return a JSON `404` for API/non-HTML clients, or the rendered `404.pug` page for browsers.
