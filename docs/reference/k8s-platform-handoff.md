# Kubernetes platform handoff

See also: [Deploy to Kubernetes](../how-to/deploy-to-kubernetes.md) · [Environment variables](environment.md)

## Overview

Kursforum deploys onto the digitalgedacht FluxCD / GitOps platform. Ownership is split in two:

- **This repository** owns the application side: the container image (built and pushed to GAR by CI), and the Flux `ResourceSet` manifests under `deployment/` that render the app `Deployment`, its `Service` (name `kursforum`, port `3000`), and the `app-image` image-automation provider.
- **The platform repository (`dg-k8s`)** owns the infrastructure side: the namespace, database, secrets, ingress edge, and the Flux wiring that reconciles this repo's `deployment/overlays/<env>`.

This page is the contract: everything the platform team must create in `dg-k8s` for Kursforum to come up. It mirrors how the `insight` and `sichtung` apps are wired (`apps/insight/`, `apps/sichtung/`). The snippets use the platform's input placeholders (`<<inputs.tenant_config.*>>`, `<<inputs.cluster_config.*>>`); adapt names to the tenant.

!!! note "Naming assumptions"
    The app name is `kursforum`. The database service is `kursforum-cluster-rw`, the database and owning role are both `kursforum`. If the tenant uses different names, keep them consistent with the app `Deployment` env in `deployment/base/resourceset.yaml` (which references `kursforum-cluster-rw`, database `kursforum`, and the secret names below).

## What the platform team must create in `dg-k8s`

### 1. Namespace and tenant wiring

- A namespace for the app (convention: `kursforum-<customer>`, e.g. matching `<<inputs.tenant_config.namespace>>`).
- The `tenant-config` and `cluster-config` `ResourceSetInputProvider`s (platform standard) that supply `app.name`, `tenant.customer`, `namespace`, `env`, `dns_zone` and `fqdn` to the ResourceSets.
- The per-tenant 1Password `SecretStore` and its SA-token `ExternalSecret` (same shape as `apps/insight/infra-resourceset.yaml`).

### 2. Image pull secret

A `dockerconfigjson` secret named `image-pull-secret` in the app namespace, granting pull access to `europe-west3-docker.pkg.dev/digitalgedacht/docker`. Referenced by the `Deployment` (`imagePullSecrets`) and the `app-image` OCIArtifactTag provider (`secretRef`).

### 3. Database credentials secret

`ExternalSecret` → `Secret` **`kursforum-database-secrets`** (`kubernetes.io/basic-auth`, keys `username` / `password`), pulled from the tenant vault. Consumed by both the CNPG managed role (sets the role password) and the app `Deployment` (builds `DATABASE_URL`).

```yaml
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: kursforum-database-credentials
  namespace: <<inputs.tenant_config.namespace>>
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: SecretStore
    name: <<inputs.tenant_config.tenant.customer>>.<<inputs.tenant_config.app.name>>.<<inputs.cluster_config.dns_zone>>
  target:
    name: kursforum-database-secrets
    creationPolicy: Owner
    template:
      type: kubernetes.io/basic-auth
  data:
    - secretKey: username
      remoteRef:
        key: "Kursforum/Database/role"
    - secretKey: password
      remoteRef:
        key: "Kursforum/Database/db-password"
```

!!! warning "The DB password must be URL-safe"
    The app builds its connection string by interpolating the credentials into `postgres://$(DB_USER):$(DB_PASS)@kursforum-cluster-rw:5432/kursforum`. A password containing URL-reserved characters (`@ : / ? # [ ]`) breaks parsing. Provision an alphanumeric password.

### 4. Application secrets

`ExternalSecret` → `Secret` **`kursforum-app-secrets`** (`Opaque`) holding the session and JWT secrets consumed by the `Deployment`:

| Secret key | App env var | Purpose |
| --- | --- | --- |
| `session-secret` | `SESSION_SECRET` | express-session signing key |
| `access-token-secret` | `ACCESS_TOKEN_SECRET` | JWT access-token signing key |
| `refresh-token-secret` | `REFRESH_TOKEN_SECRET` | JWT refresh-token signing key |

```yaml
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: kursforum-app-credentials
  namespace: <<inputs.tenant_config.namespace>>
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: SecretStore
    name: <<inputs.tenant_config.tenant.customer>>.<<inputs.tenant_config.app.name>>.<<inputs.cluster_config.dns_zone>>
  target:
    name: kursforum-app-secrets
    creationPolicy: Owner
    template:
      type: Opaque
  data:
    - secretKey: session-secret
      remoteRef:
        key: "Kursforum/App/session-secret"
    - secretKey: access-token-secret
      remoteRef:
        key: "Kursforum/App/access-token-secret"
    - secretKey: refresh-token-secret
      remoteRef:
        key: "Kursforum/App/refresh-token-secret"
```

### 5. PostgreSQL cluster, database and backups (CNPG)

A CNPG `Cluster` **`kursforum-cluster`** that bootstraps the `kursforum` database owned by the `kursforum` role, with the role password taken from `kursforum-database-secrets`. Plus the `Database` resource, the Barman `ObjectStore`, and a `ScheduledBackup`. Model these on `apps/insight/infra-resourceset.yaml` (adjust instance count / storage to the tenant). Key points:

- `bootstrap.initdb`: database `kursforum`, owner `kursforum`, `secret.name: kursforum-database-secrets`.
- `managed.roles`: role `kursforum`, `login: true`, `passwordSecret.name: kursforum-database-secrets`.
- The app connects to the read/write service **`kursforum-cluster-rw`** on `5432`.
- The `plugins` block (`isWALArchiver`) only archives WAL; add a `ScheduledBackup` (`method: plugin`) so base backups actually run, or PITR has no anchor.

The app applies its own schema (`db/schema.sql`) on startup and creates the `session` table via `connect-pg-simple`, so no migration job is needed: the empty `kursforum` database is enough.

!!! note "The app exits if the database is unreachable at boot"
    Schema application runs during startup; if the database cannot be reached the process exits and the pod restarts. During initial bring-up the app will crash-loop until `kursforum-cluster` is Ready. That is expected and self-heals once the database accepts connections; it is not a bad image.

### 6. Ingress edge (HTTPRoute)

An `HTTPRoute` **`kursforum-route`** attaching to the shared Envoy gateway and routing the public hostname to the app `Service` on port `3000`:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: kursforum-route
  namespace: <<inputs.tenant_config.namespace>>
spec:
  parentRefs:
    - name: envoy-shared-gateway
      namespace: envoy-gateway-system
  hostnames:
    - <<inputs.tenant_config.app.name>>.<<inputs.cluster_config.fqdn>>
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: <<inputs.tenant_config.app.name>>
          port: 3000
```

The edge terminates TLS and sets `x-forwarded-proto: https`. The app has `trust proxy` enabled and honors that header. The public hostname must match the `ALLOWED_ORIGINS` the `Deployment` sets (`https://<app>.<fqdn>`).

### 7. Flux reconciliation of this repo's `deployment/`

A `GitRepository` source for this app repo plus a Flux `Kustomization` per environment that reconciles `deployment/overlays/<env>` into the app namespace, mirroring the `apps/insight/<env>` wiring:

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: <<inputs.tenant_config.tenant.customer>>-kursforum-app
  namespace: flux-system
spec:
  interval: 5m0s
  path: deployment/overlays/<<inputs.cluster_config.env>>
  prune: false
  sourceRef:
    kind: GitRepository
    name: kursforum
  targetNamespace: <<inputs.tenant_config.namespace>>
  wait: true
```

`targetNamespace` governs where the app-owned resources land (the `app-image-config` provider in the overlays carries a `kursforum-intern` default that this overrides).

## Image automation (owned by this repo, for reference)

The app image tag/digest is resolved from GAR at runtime by the `app-image` `OCIArtifactTag` provider in `deployment/base/image-provider.yaml`. Each environment floats on its `-<env>` tag suffix, derived from `cluster-config.env`. The platform team does **not** add image-automation entries for Kursforum: the provider lives in this repo. What must exist on the platform is only the `image-pull-secret` (§2) the provider authenticates with.

- Registry: `europe-west3-docker.pkg.dev/digitalgedacht/docker/digitalgedacht/kursforum/app`
- dev floats on `<version>-dev`, test on `<version>-test`, prod on `<version>-prod`.

## Checklist

- [ ] Namespace + `tenant-config` / `cluster-config` providers + tenant `SecretStore`
- [ ] `image-pull-secret` (dockerconfigjson) for GAR
- [ ] `kursforum-database-secrets` ExternalSecret (URL-safe password)
- [ ] `kursforum-app-secrets` ExternalSecret (session + JWT keys)
- [ ] CNPG `Cluster` `kursforum-cluster` + `Database` + `ObjectStore` + `ScheduledBackup`
- [ ] `HTTPRoute` `kursforum-route` → `kursforum:3000`, hostname `kursforum.<fqdn>`
- [ ] `GitRepository` + per-env Flux `Kustomization` for `deployment/overlays/<env>`
