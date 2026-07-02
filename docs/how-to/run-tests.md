# Run the tests

See also: [Run with Docker](run-with-docker.md) · [API reference](../reference/api.md)

## Overview

The test suite uses Mocha, Chai and Supertest to drive the Express app through its HTTP layer. Tests run with `NODE_ENV=test`, which disables rate limiting so requests aren't throttled during a run.

## Run against a local database

Requires a reachable PostgreSQL instance configured through your `.env` (see [Run without Docker](run-without-docker.md)).

```bash
npm test
```

This runs `mocha --recursive "tests" --extension test.js` over every `*.test.js` file under `tests/`.

## Run in Docker

Builds the containers, starts them, and runs the suite inside the `app` container against the Compose PostgreSQL service:

```bash
npm run test:docker
```

Use this when you don't have a local PostgreSQL, or to match the CI-style environment exactly.

## Verify

A passing run ends with Mocha's summary and a `0` exit code. A non-zero exit code means at least one test failed; the failing assertions are printed above the summary.
