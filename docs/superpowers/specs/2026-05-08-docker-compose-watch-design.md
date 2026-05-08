# Docker Compose Watch — Design

## Goal

Add `docker compose watch` support so that changes to package manifests trigger an automatic image rebuild and container restart, while existing source-file hot-reload (nodemon / `ng serve`) continues to work via the bind mount.

## Approach

Keep the existing `.:/app` bind mount and named `node_modules` volume unchanged. Add a `develop.watch` block to the `app` service in `docker-compose.yml` with `rebuild` actions for all `package.json` and `package-lock.json` files in the monorepo.

## Watch Rules

| Path                           | Action    |
| ------------------------------ | --------- |
| `package.json`                 | `rebuild` |
| `package-lock.json`            | `rebuild` |
| `apps/backend/package.json`    | `rebuild` |
| `apps/portal/package.json`     | `rebuild` |
| `packages/shared/package.json` | `rebuild` |

## What Does Not Change

- Bind mount `.:/app` — source file sync to container is unchanged.
- Named `node_modules` volume — native bindings preserved across restarts.
- Ports, environment variables, `Dockerfile.dev` — all unchanged.
- Nodemon and `ng serve` continue to handle in-process hot-reload for source changes.

## Usage

```sh
docker compose watch
```

instead of `docker compose up`.
