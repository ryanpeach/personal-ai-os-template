# Personal AI OS — Monorepo Portal Design

**Date:** 2026-05-07
**Status:** Approved

---

## Overview

A locally hosted personal operating system served from a home machine and accessed on a phone over Tailscale. The frontend is an Ionic/Angular app (the "portal") that acts as a launchpad into feature sub-apps, each exposed as a lazy-loaded route. The backend is a separate Express app with a SQLite database that lives on the host. No authentication — Tailscale is the network perimeter.

---

## Monorepo Structure

```
personal-ai-os/
├── apps/
│   ├── portal/              # Angular + Ionic + Tailwind (single app)
│   │   └── src/app/
│   │       ├── home/        # Portal dashboard — card grid of sub-apps
│   │       └── apps/
│   │           └── todo/    # Todo sub-app (lazy-loaded route)
│   └── backend/             # Express + SQLite
├── packages/
│   └── shared/              # Shared TypeScript interfaces (no runtime code)
├── package.json             # npm workspaces: ["apps/*", "packages/*"]
├── .prettierrc
├── .eslintrc.js
└── .gitignore
```

**Monorepo tooling:** npm workspaces only. Directory structure is compatible with Nx (`npx nx init`) or Turborepo (`turbo.json`) if added later — no reorganization required.

---

## Tech Stack

| Layer              | Technology                                    |
| ------------------ | --------------------------------------------- |
| Frontend framework | Angular 17+ (standalone components)           |
| UI components      | Ionic 7                                       |
| Styling            | Tailwind CSS                                  |
| Backend            | Express (Node.js)                             |
| Database           | SQLite via `better-sqlite3`                   |
| Shared types       | TypeScript package (`@personal-ai-os/shared`) |
| Monorepo           | npm workspaces                                |

---

## Routing

```
/              → Portal home (sub-app card grid)
/apps/todo     → Todo sub-app (lazy-loaded Angular feature module)
/apps/<next>   → Future sub-apps follow the same pattern
```

The portal home page is a full-screen card grid using Ionic card components styled with Tailwind. Each card displays the sub-app name and icon; tapping navigates to its route. Adding a new sub-app means adding a folder under `apps/apps/` and registering a lazy route — no changes to the portal shell required.

---

## Backend

Express serves two things from one process on one port:

1. REST API under `/api/`
2. Built Angular app as static files (production)

### Todo API (initial)

```
GET    /api/todos          List all todos
POST   /api/todos          Create a todo
PATCH  /api/todos/:id      Update a todo (title, done)
DELETE /api/todos/:id      Delete a todo
```

SQLite database file path is configurable via environment variable (`DATABASE_PATH`), defaulting to `./data/db.sqlite` relative to the backend workspace. The file persists on the host machine.

---

## Shared Package

`packages/shared` exports TypeScript interfaces only — no runtime code, no build step required. Consumed via TypeScript path mapping in both `portal` and `backend`.

```ts
// packages/shared/src/index.ts

export interface Todo {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
}
```

Package name: `@personal-ai-os/shared`

---

## TypeScript Configuration

All three workspaces (`portal`, `backend`, `shared`) use strict TypeScript:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

A root `tsconfig.base.json` defines these settings; each workspace `tsconfig.json` extends it.

---

## Code Quality Tooling

### Prettier

Single `.prettierrc` at the repo root. Enforced on `.ts`, `.html`, `.json`, `.css` files. Checked in CI and enforced as a pre-commit step.

### ESLint

Root `.eslintrc.js` with TypeScript rules, extended per workspace:

- `portal/` — adds Angular ESLint rules
- `backend/` — standard TypeScript rules

### Pre-commit (Husky + lint-staged)

Installed at the repo root. On every commit:

1. Prettier format check on staged files
2. ESLint on staged `.ts` files
3. TypeScript typecheck (`tsc --noEmit`) on affected workspaces

Fast by default — lint-staged only processes staged files.

---

## CI (GitHub Actions)

Single workflow: `.github/workflows/ci.yml`

Triggers: push and pull request on `main`.

Steps (in order):

1. Install dependencies (`npm ci`)
2. Prettier check (`npx prettier --check .`)
3. ESLint (`npm run lint --workspaces`)
4. TypeScript typecheck (`npm run typecheck --workspaces`)
5. Build all workspaces (`npm run build --workspaces`)

No deployment step — the app runs locally, CI gates correctness only.

---

## Development Workflow

```bash
npm install                  # install all workspaces
npm run dev                  # start portal (ng serve) + backend (nodemon) in parallel
```

A root-level `dev` script uses `concurrently` to start both apps. Portal proxies `/api/*` to the backend during development via Angular's `proxy.conf.json`.
