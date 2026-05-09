# Docker Compose Watch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `develop.watch` to `docker-compose.yml` so `docker compose watch` auto-rebuilds the container when any package manifest changes, while existing bind-mount hot-reload continues to work.

**Architecture:** A single `develop.watch` block is added to the existing `app` service. All five package manifests in the monorepo get a `rebuild` action. No other changes — bind mount, named volume, ports, and env are untouched.

**Tech Stack:** Docker Compose v2 (`develop.watch` requires Compose ≥ 2.22 / Docker Desktop ≥ 4.24)

---

### Task 1: Add `develop.watch` to `docker-compose.yml`

**Files:**

- Modify: `docker-compose.yml`

- [ ] **Step 1: Create a feature branch**

```bash
git checkout -b feat/docker-compose-watch
```

- [ ] **Step 2: Edit `docker-compose.yml`**

Replace the entire file with:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - node_modules:/app/node_modules
      - ./apps/backend/data:/app/apps/backend/data
    ports:
      - '3000:3000'
      - '4200:4200'
    environment:
      - DATABASE_PATH=/app/apps/backend/data/db.sqlite
      - PORT=3000
    develop:
      watch:
        - path: package.json
          action: rebuild
        - path: package-lock.json
          action: rebuild
        - path: apps/backend/package.json
          action: rebuild
        - path: apps/portal/package.json
          action: rebuild
        - path: packages/shared/package.json
          action: rebuild

volumes:
  node_modules:
```

- [ ] **Step 3: Verify the config is valid**

```bash
docker compose config
```

Expected: Full resolved config printed with no errors. Confirm the `develop.watch` block appears under `services.app`.

- [ ] **Step 4: Start the watch session and verify hot-rebuild works**

```bash
docker compose watch
```

Expected output contains lines like:

```
Watch configuration for service "app"
  - Action rebuild for changes to package.json
  ...
```

In a second terminal, touch a package manifest to trigger a rebuild:

```bash
touch package-lock.json
```

Expected: Compose detects the change, rebuilds the image (you will see `npm ci` output), and restarts the container. Both ports 3000 and 4200 become reachable again after restart.

- [ ] **Step 5: Verify source hot-reload still works (bind mount unchanged)**

While `docker compose watch` is running, edit any backend source file (e.g. add a comment to `apps/backend/src/index.ts`). Expected: nodemon inside the container detects the change and restarts the Express server — no container rebuild, just an in-process restart visible in the watch output.

Edit any portal source file (e.g. add a comment to `apps/portal/src/app/app.component.ts`). Expected: `ng serve` detects the change and recompiles — no container rebuild.

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add docker compose watch with rebuild on package manifest changes"
```
