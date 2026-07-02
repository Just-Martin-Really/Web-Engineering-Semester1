CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    firstname   VARCHAR(50)  NOT NULL,
    lastname    VARCHAR(50)  NOT NULL,
    username    VARCHAR(20)  UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    course      VARCHAR(3)   NOT NULL CHECK (course IN ('TIA', 'TIS', 'TIK')),
    failed_login_attempts   INTEGER     NOT NULL DEFAULT 0,
    lockout_until           TIMESTAMPTZ,
    last_failed_login_at    TIMESTAMPTZ,
    last_login_at           TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topics (
    id                SERIAL PRIMARY KEY,
    title             TEXT        NOT NULL,
    content           TEXT        NOT NULL,
    kurs              VARCHAR(3)  NOT NULL CHECK (kurs IN ('TIA', 'TIS', 'TIK')),
    seed_key          VARCHAR(100) UNIQUE,
    seed_author_name  VARCHAR(50),
    author_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
    id                SERIAL PRIMARY KEY,
    topic_id          INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    content           TEXT    NOT NULL,
    author_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    seed_author_name  VARCHAR(50),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
    "sid"    varchar     NOT NULL COLLATE "default",
    "sess"   json        NOT NULL,
    "expire" timestamp(6) NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
) WITH (OIDS=FALSE);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
