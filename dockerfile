# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Builder stage: install the full dependency set from the lockfile.
#
# This stage proves package-lock.json resolves cleanly and is where any future
# build/compile step (asset bundling, transpilation) would run. Nothing from
# here reaches the runtime image except what the runtime stage installs itself,
# so build tooling and devDependencies never ship.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# ---------------------------------------------------------------------------
# Dev stage: the full dependency set (including devDependencies) plus source,
# used by docker-compose for local development and `npm run test:docker`. The
# hardened, dev-free image CI ships is the `runtime` stage below. Because
# `runtime` is the last stage, a plain `docker build` (and the CI build) still
# targets it; compose selects this stage explicitly with `target: dev`.
# ---------------------------------------------------------------------------
FROM builder AS dev
CMD ["node", "server.js"]

# ---------------------------------------------------------------------------
# Runtime stage: a slim image carrying only production dependencies.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runtime

# dumb-init reaps zombies and forwards SIGTERM to the node process so the
# graceful-shutdown handler in server.js runs on pod termination.
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Production dependencies only. Kept as its own layer so it is cached across
# source-only changes.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Application source (respects .dockerignore).
COPY . .

# Winston writes to /app/logs. Create it and hand ownership to the unprivileged
# `node` user so the container works both as that user (docker/compose) and when
# Kubernetes overrides the uid with an emptyDir mounted here.
RUN mkdir -p /app/logs && chown -R node:node /app/logs

USER node

# The platform Service/HTTPRoute target port 3000; honor $PORT for local runs.
EXPOSE 3000

# Liveness from inside the container. Reads $PORT at runtime so it tracks the
# port the app actually binds to.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "const p=process.env.PORT||3000;require('http').get('http://127.0.0.1:'+p+'/healthz',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
