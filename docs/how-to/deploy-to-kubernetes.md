# Deploy to Kubernetes

See also: [Platform handoff](../reference/k8s-platform-handoff.md) · [Run with Docker](run-with-docker.md) · [Environment variables](../reference/environment.md)

## Overview

Kursforum ships to the digitalgedacht FluxCD / GitOps platform as a container image plus Flux `ResourceSet` manifests. You do not `kubectl apply` anything by hand: CI builds and pushes the image to Google Artifact Registry (GAR), and Flux rolls the cluster forward when the image or manifests change. This guide covers the build/push/promote loop and the manifests under `deployment/`.

The platform-side prerequisites (namespace, database, secrets, ingress) are listed in the [platform handoff](../reference/k8s-platform-handoff.md) and owned by the `dg-k8s` repository.

## Prerequisites

- The platform team has completed the [handoff checklist](../reference/k8s-platform-handoff.md#checklist).
- The repository secret `GCP_ARTIFACTORY_SERVICE_ACCOUNT_KEY` is set (a GCP service-account key JSON with push access to `europe-west3-docker.pkg.dev/digitalgedacht/docker`).
- For manual pushes only: `gcloud`, `docker` with `buildx`, and `gcloud auth configure-docker europe-west3-docker.pkg.dev`.

## The image

The production image is built from `dockerfile` (multi-stage: full `npm ci` in the builder, `npm ci --omit=dev` in a `node:20-alpine` runtime that runs as a non-root user). It listens on port `3000` by default (override with `PORT`) and exposes `/healthz` (liveness) and `/readyz` (readiness). Registry path:

```
europe-west3-docker.pkg.dev/digitalgedacht/docker/digitalgedacht/kursforum/app
```

## Tag strategy

One SemVer scheme (no `v` prefix, e.g. `1.0.0`, taken from `package.json`), with per-environment suffixes. Each environment's `app-image` provider floats on the highest tag carrying its suffix:

| Tag | Produced by | Consumed by |
| --- | --- | --- |
| `<version>-dev` | push to `develop` (`develop-build.yml`) | dev cluster |
| `<version>` + `latest` | published GitHub release (`release.yml`) | promotion source |
| `<version>-test` | Promote Image → `test` (`promote-image.yaml`) | test cluster |
| `<version>-prod` | Promote Image → `prod` (`promote-image.yaml`) | prod cluster |

Promotion between environments is a **registry retag**, not a git change: the retag points the env-suffix tag at an already-built, digest-pinned image, and the Flux provider floats onto it within about a minute.

## Ship to dev

Merge to `develop`. The **Develop Build** workflow builds the multi-arch image and pushes `europe-west3-docker.pkg.dev/.../kursforum/app:<version>-dev`. The dev cluster's `app-image` provider resolves the new tag on its next poll and rolls the `Deployment` forward. No release required.

## Cut a release

Publish a GitHub release whose tag is the version (e.g. `1.0.0`). The **Release** workflow builds and pushes `:1.0.0` and `:latest`. A released image is not live in test/prod until it is promoted.

## Promote to test, then prod

1. Run the **Promote Image** workflow (Actions → Promote Image → Run workflow).
2. Enter the released `version` (e.g. `1.0.0`) and choose `test`.
3. The workflow resolves `:1.0.0` to its digest and adds the `:1.0.0-test` tag to that digest. The test cluster floats onto it within ~1m.
4. After validating on test, run it again with `prod` to add `:1.0.0-prod`.

Promotion is idempotent: re-running for a version already pointing at the same digest is a no-op.

## The manifests

```
deployment/
  base/
    image-provider.yaml   # app-image OCIArtifactTag provider (GAR automation)
    resourceset.yaml      # Deployment + Service (kursforum:3000)
    kustomization.yaml
  overlays/
    dev/   test/   prod/  # per-env app-image-config (float on -dev/-test/-prod)
```

Render an overlay locally to inspect what Flux applies:

```bash
kubectl kustomize deployment/overlays/dev
```

The `Deployment` runs `restricted`-PodSecurity compliant (non-root uid 65532, read-only root filesystem, all capabilities dropped) with `emptyDir` mounts for `/app/logs` and `/tmp`. It reads its config from the secrets in the [handoff](../reference/k8s-platform-handoff.md) and connects to `kursforum-cluster-rw:5432`.

## Health checks

- `GET /healthz` — liveness. Returns `200` while the process is up; runs no dependency checks, so a transient database outage never restarts a healthy pod.
- `GET /readyz` — readiness. Runs `SELECT 1` against the pool; returns `503` when the database is unreachable so the Service stops routing to the pod until it recovers.

Both bypass the HTTPS redirect, session store and rate limiters, so kubelet probes hit them directly.

## Verify a rollout

```bash
kubectl -n <kursforum-namespace> rollout status deployment/kursforum
kubectl -n <kursforum-namespace> get resourcesetinputprovider app-image -o jsonpath='{.status}'
```

Then browse the public hostname (`https://kursforum.<fqdn>`) provisioned by the platform `HTTPRoute`.
