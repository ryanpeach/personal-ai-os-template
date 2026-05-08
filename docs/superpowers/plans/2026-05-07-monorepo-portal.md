# Personal AI OS — Monorepo Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a locally hosted personal OS monorepo with an Angular/Ionic/Tailwind portal app, an Express/SQLite backend, and a working Todo sub-app, wired up with strict TypeScript, ESLint, Prettier, Husky pre-commit hooks, and GitHub Actions CI.

**Architecture:** npm workspaces with `apps/portal` (Angular 17+ standalone + Ionic 7 + Tailwind), `apps/backend` (Express + better-sqlite3), and `packages/shared` (TypeScript interfaces only). The portal home page is a card grid that lazy-loads sub-apps as Angular routes (`/apps/todo`, etc.). Express serves the Angular build as static files in production and exposes `/api/*` REST routes.

**Tech Stack:** Angular 17+, Ionic 7, Tailwind CSS 3, Express 4, better-sqlite3, TypeScript 5 (strict), Jest + supertest (backend tests), Angular TestBed + HttpClientTestingModule (portal tests), Husky 9, lint-staged, Prettier 3, ESLint 8, GitHub Actions.

---

## File Map

```
personal-ai-os/
├── package.json                          # workspaces, root scripts, root devDeps
├── tsconfig.base.json                    # strict TS flags shared by all workspaces
├── .prettierrc                           # single Prettier config
├── .eslintrc.js                          # root ESLint (TS rules); workspaces extend this
├── .lintstagedrc.json                    # staged-file hooks
├── .husky/pre-commit                     # runs lint-staged + typecheck
├── .github/workflows/ci.yml             # prettier, lint, typecheck, build
├── .gitignore                            # updated
│
├── packages/
│   └── shared/
│       ├── package.json                  # name: @personal-ai-os/shared
│       ├── tsconfig.json                 # extends ../../tsconfig.base.json
│       └── src/index.ts                  # Todo interface (types only, no runtime code)
│
├── apps/
│   ├── backend/
│   │   ├── package.json                  # scripts: dev, build, test, lint, typecheck
│   │   ├── tsconfig.json                 # extends ../../tsconfig.base.json
│   │   ├── .eslintrc.js                  # extends root
│   │   ├── jest.config.js
│   │   └── src/
│   │       ├── db.ts                     # openDatabase(path?) → Database
│   │       ├── app.ts                    # createApp(db) → express.Express
│   │       ├── routes/todos.ts           # createTodosRouter(db) → Router
│   │       ├── index.ts                  # entry: open db, create app, listen, serve static
│   │       └── __tests__/
│   │           └── todos.test.ts         # supertest integration tests
│   │
│   └── portal/                           # created by ng new
│       ├── package.json                  # Angular CLI app; adds @ionic/angular, tailwindcss
│       ├── tsconfig.json                 # overridden: extends ../../tsconfig.base.json
│       ├── tsconfig.app.json             # extends ./tsconfig.json (Angular build)
│       ├── tsconfig.spec.json            # extends ./tsconfig.json (tests)
│       ├── angular.json                  # adds Ionic CSS, ionicons assets, proxy config
│       ├── tailwind.config.js
│       ├── proxy.conf.json               # /api/* → http://localhost:3000
│       ├── .eslintrc.json                # created by ng add @angular-eslint/schematics
│       └── src/
│           ├── styles.css                # @tailwind directives
│           ├── main.ts                   # bootstrapApplication
│           └── app/
│               ├── app.config.ts         # provideRouter, provideIonicAngular, provideHttpClient
│               ├── app.component.ts      # <ion-app><ion-router-outlet>
│               ├── app.routes.ts         # lazy routes: home, /apps/todo
│               ├── home/
│               │   └── home.component.ts # card grid of sub-apps
│               └── apps/
│                   └── todo/
│                       ├── todo.service.ts       # HTTP calls → signals
│                       ├── todo.service.spec.ts  # HttpClientTestingModule tests
│                       └── todo.component.ts     # list + add + swipe-delete
```

---

## Task 1: Root Monorepo Scaffold

**Files:**

- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.prettierrc`
- Modify: `.gitignore`

- [ ] **Step 1: Write root `package.json`**

```json
{
  "name": "personal-ai-os",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "concurrently -n portal,backend -c cyan,yellow \"npm run dev --workspace=apps/portal\" \"npm run dev --workspace=apps/backend\"",
    "build": "npm run build --workspace=packages/shared && npm run build --workspace=apps/backend && npm run build --workspace=apps/portal",
    "lint": "npm run lint --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "prepare": "husky"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "husky": "^9.0.11",
    "lint-staged": "^15.2.2",
    "prettier": "^3.2.5"
  }
}
```

- [ ] **Step 2: Write `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 3: Write `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 4: Update `.gitignore`**

Append to the existing `.gitignore`:

```
# compiled output
dist/
out-tsc/

# dependencies
node_modules/

# SQLite data
apps/backend/data/

# Angular cache
.angular/

# env
.env
.env.local
```

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.base.json .prettierrc .gitignore
git commit -m "chore: root monorepo scaffold"
```

---

## Task 2: Shared Package

**Files:**

- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p packages/shared/src
```

- [ ] **Step 2: Write `packages/shared/package.json`**

```json
{
  "name": "@personal-ai-os/shared",
  "version": "0.0.1",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 3: Write `packages/shared/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "target": "ES2022",
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Write `packages/shared/src/index.ts`**

```typescript
export interface Todo {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface CreateTodoBody {
  title: string;
}

export interface PatchTodoBody {
  title?: string;
  done?: boolean;
}
```

- [ ] **Step 5: Install and verify typecheck**

```bash
npm install
npm run typecheck --workspace=packages/shared
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/
git commit -m "feat: add shared TypeScript interfaces package"
```

---

## Task 3: Backend Scaffold

**Files:**

- Create: `apps/backend/package.json`
- Create: `apps/backend/tsconfig.json`
- Create: `apps/backend/jest.config.js`
- Create: `apps/backend/.eslintrc.js`

- [ ] **Step 1: Create directory**

```bash
mkdir -p apps/backend/src/__tests__
```

- [ ] **Step 2: Write `apps/backend/package.json`**

```json
{
  "name": "@personal-ai-os/backend",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "nodemon --watch src --ext ts --exec \"ts-node src/index.ts\"",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "@personal-ai-os/shared": "*",
    "better-sqlite3": "^9.6.0",
    "express": "^4.19.2"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.10",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/node": "^20.14.0",
    "@types/supertest": "^6.0.2",
    "@typescript-eslint/eslint-plugin": "^7.13.0",
    "@typescript-eslint/parser": "^7.13.0",
    "eslint": "^8.57.0",
    "jest": "^29.7.0",
    "nodemon": "^3.1.4",
    "supertest": "^7.0.0",
    "ts-jest": "^29.1.5",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 3: Write `apps/backend/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "target": "ES2022",
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "paths": {
      "@personal-ai-os/shared": ["../../packages/shared/src/index.ts"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Write `apps/backend/jest.config.js`**

```js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@personal-ai-os/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
};
```

- [ ] **Step 5: Write `apps/backend/.eslintrc.js`**

```js
module.exports = {
  extends: ['../../.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
```

- [ ] **Step 6: Install dependencies**

```bash
npm install
```

- [ ] **Step 7: Commit**

```bash
git add apps/backend/
git commit -m "chore: backend scaffold"
```

---

## Task 4: Backend Database Layer (TDD)

**Files:**

- Create: `apps/backend/src/db.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/backend/src/__tests__/db.test.ts`:

```typescript
import { openDatabase } from '../db';

describe('openDatabase', () => {
  it('creates todos table in a fresh in-memory database', () => {
    const db = openDatabase(':memory:');
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='todos'")
      .all() as { name: string }[];
    expect(tables).toHaveLength(1);
    db.close();
  });

  it('is idempotent — calling twice does not throw', () => {
    const db = openDatabase(':memory:');
    expect(() => openDatabase(':memory:')).not.toThrow();
    db.close();
  });

  it('inserts and retrieves a row', () => {
    const db = openDatabase(':memory:');
    db.prepare("INSERT INTO todos (title) VALUES ('hello')").run();
    const rows = db.prepare('SELECT title FROM todos').all() as { title: string }[];
    expect(rows[0]?.title).toBe('hello');
    db.close();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test --workspace=apps/backend -- --testPathPattern=db.test
```

Expected: FAIL — `Cannot find module '../db'`

- [ ] **Step 3: Implement `apps/backend/src/db.ts`**

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export function openDatabase(dbPath?: string): Database.Database {
  const resolved =
    dbPath ?? process.env['DATABASE_PATH'] ?? path.join(process.cwd(), 'data', 'db.sqlite');

  if (resolved !== ':memory:') {
    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(resolved);

  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT    NOT NULL,
      done       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  return db;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test --workspace=apps/backend -- --testPathPattern=db.test
```

Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/db.ts apps/backend/src/__tests__/db.test.ts
git commit -m "feat(backend): SQLite database layer"
```

---

## Task 5: Backend App Factory + Todo Routes (TDD)

**Files:**

- Create: `apps/backend/src/routes/todos.ts`
- Create: `apps/backend/src/app.ts`
- Create: `apps/backend/src/__tests__/todos.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/backend/src/__tests__/todos.test.ts`:

```typescript
import request from 'supertest';
import { openDatabase } from '../db';
import { createApp } from '../app';
import type Database from 'better-sqlite3';
import type { Todo } from '@personal-ai-os/shared';

describe('Todos API', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    db = openDatabase(':memory:');
    app = createApp(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('GET /api/todos', () => {
    it('returns empty array when no todos exist', async () => {
      const res = await request(app).get('/api/todos');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns all todos in insertion order', async () => {
      db.prepare("INSERT INTO todos (title) VALUES ('Buy milk')").run();
      db.prepare("INSERT INTO todos (title) VALUES ('Walk dog')").run();
      const res = await request(app).get('/api/todos');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect((res.body as Todo[])[0]?.title).toBe('Buy milk');
      expect((res.body as Todo[])[1]?.title).toBe('Walk dog');
    });
  });

  describe('POST /api/todos', () => {
    it('creates a todo and returns 201 with the new todo', async () => {
      const res = await request(app).post('/api/todos').send({ title: 'Walk dog' });
      expect(res.status).toBe(201);
      const todo = res.body as Todo;
      expect(todo.title).toBe('Walk dog');
      expect(todo.done).toBe(false);
      expect(typeof todo.id).toBe('number');
      expect(typeof todo.createdAt).toBe('string');
    });

    it('trims whitespace from title', async () => {
      const res = await request(app).post('/api/todos').send({ title: '  hello  ' });
      expect(res.status).toBe(201);
      expect((res.body as Todo).title).toBe('hello');
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app).post('/api/todos').send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when title is blank', async () => {
      const res = await request(app).post('/api/todos').send({ title: '   ' });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/todos/:id', () => {
    it('updates the title of an existing todo', async () => {
      const created = await request(app).post('/api/todos').send({ title: 'Old title' });
      const id = (created.body as Todo).id;
      const res = await request(app).patch(`/api/todos/${id}`).send({ title: 'New title' });
      expect(res.status).toBe(200);
      expect((res.body as Todo).title).toBe('New title');
    });

    it('marks a todo as done', async () => {
      const created = await request(app).post('/api/todos').send({ title: 'Task' });
      const id = (created.body as Todo).id;
      const res = await request(app).patch(`/api/todos/${id}`).send({ done: true });
      expect(res.status).toBe(200);
      expect((res.body as Todo).done).toBe(true);
    });

    it('marks a todo as not done', async () => {
      db.prepare("INSERT INTO todos (title, done) VALUES ('Done task', 1)").run();
      const list = await request(app).get('/api/todos');
      const id = (list.body as Todo[])[0]!.id;
      const res = await request(app).patch(`/api/todos/${id}`).send({ done: false });
      expect(res.status).toBe(200);
      expect((res.body as Todo).done).toBe(false);
    });

    it('returns 404 for a non-existent todo', async () => {
      const res = await request(app).patch('/api/todos/99999').send({ done: true });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('deletes a todo and returns 204', async () => {
      const created = await request(app).post('/api/todos').send({ title: 'Gone' });
      const id = (created.body as Todo).id;
      const res = await request(app).delete(`/api/todos/${id}`);
      expect(res.status).toBe(204);
    });

    it('confirms the todo is gone after deletion', async () => {
      const created = await request(app).post('/api/todos').send({ title: 'Gone' });
      const id = (created.body as Todo).id;
      await request(app).delete(`/api/todos/${id}`);
      const list = await request(app).get('/api/todos');
      expect((list.body as Todo[]).find((t) => t.id === id)).toBeUndefined();
    });

    it('returns 404 for a non-existent todo', async () => {
      const res = await request(app).delete('/api/todos/99999');
      expect(res.status).toBe(404);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test --workspace=apps/backend -- --testPathPattern=todos.test
```

Expected: FAIL — `Cannot find module '../app'`

- [ ] **Step 3: Create `apps/backend/src/routes/todos.ts`**

```typescript
import { Router } from 'express';
import type Database from 'better-sqlite3';
import type { Todo } from '@personal-ai-os/shared';

interface DbRow {
  id: number;
  title: string;
  done: number;
  created_at: string;
}

function toTodo(row: DbRow): Todo {
  return {
    id: row.id,
    title: row.title,
    done: row.done === 1,
    createdAt: row.created_at,
  };
}

export function createTodosRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const rows = db.prepare('SELECT * FROM todos ORDER BY id ASC').all() as DbRow[];
    res.json(rows.map(toTodo));
  });

  router.post('/', (req, res) => {
    const body = req.body as { title?: unknown };
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      res.status(400).json({ error: 'title is required and must be a non-empty string' });
      return;
    }
    const title = body.title.trim();
    const result = db.prepare('INSERT INTO todos (title) VALUES (?)').run(title);
    const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid) as DbRow;
    res.status(201).json(toTodo(row));
  });

  router.patch('/:id', (req, res) => {
    const id = Number(req.params['id']);
    const existing = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as DbRow | undefined;
    if (!existing) {
      res.status(404).json({ error: 'todo not found' });
      return;
    }
    const body = req.body as { title?: unknown; done?: unknown };
    const newTitle =
      typeof body.title === 'string' && body.title.trim() !== ''
        ? body.title.trim()
        : existing.title;
    const newDone = typeof body.done === 'boolean' ? (body.done ? 1 : 0) : existing.done;
    db.prepare('UPDATE todos SET title = ?, done = ? WHERE id = ?').run(newTitle, newDone, id);
    const updated = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as DbRow;
    res.json(toTodo(updated));
  });

  router.delete('/:id', (req, res) => {
    const id = Number(req.params['id']);
    const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'todo not found' });
      return;
    }
    res.status(204).send();
  });

  return router;
}
```

- [ ] **Step 4: Create `apps/backend/src/app.ts`**

```typescript
import express from 'express';
import type Database from 'better-sqlite3';
import { createTodosRouter } from './routes/todos';

export function createApp(db: Database.Database): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/todos', createTodosRouter(db));
  return app;
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test --workspace=apps/backend
```

Expected: PASS — all tests green.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/
git commit -m "feat(backend): Express app + Todo CRUD routes with tests"
```

---

## Task 6: Backend Entry Point

**Files:**

- Create: `apps/backend/src/index.ts`

- [ ] **Step 1: Write `apps/backend/src/index.ts`**

```typescript
import path from 'path';
import fs from 'fs';
import express from 'express';
import { openDatabase } from './db';
import { createApp } from './app';

const PORT = process.env['PORT'] !== undefined ? Number(process.env['PORT']) : 3000;
const db = openDatabase();
const app = createApp(db);

// Serve the Angular portal build in production
const distPath = path.resolve(__dirname, '..', '..', 'portal', 'dist', 'portal', 'browser');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
```

- [ ] **Step 2: Verify typecheck passes**

```bash
npm run typecheck --workspace=apps/backend
```

Expected: no errors.

- [ ] **Step 3: Smoke-test the dev server**

```bash
npm run dev --workspace=apps/backend
```

In a second terminal:

```bash
curl http://localhost:3000/api/todos
```

Expected: `[]`

Stop the server (`Ctrl+C`).

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/index.ts
git commit -m "feat(backend): entry point with static file serving"
```

---

## Task 7: Portal Scaffold

**Files:**

- Create: `apps/portal/` (via ng new)
- Modify: `apps/portal/tsconfig.json`
- Create: `apps/portal/proxy.conf.json`
- Create: `apps/portal/tailwind.config.js`

- [ ] **Step 1: Scaffold Angular app**

```bash
cd apps
npx @angular/cli@latest new portal --routing --style=css --skip-git --skip-install
cd ..
```

- [ ] **Step 2: Install Ionic and Tailwind into portal**

Edit `apps/portal/package.json` to add these to `dependencies`:

```json
"@ionic/angular": "^7.8.6",
"ionicons": "^7.4.0"
```

And to `devDependencies`:

```json
"autoprefixer": "^10.4.19",
"postcss": "^8.4.38",
"tailwindcss": "^3.4.4"
```

- [ ] **Step 3: Add shared package dependency**

In `apps/portal/package.json`, add to `dependencies`:

```json
"@personal-ai-os/shared": "*"
```

- [ ] **Step 4: Install all dependencies from root**

```bash
npm install
```

- [ ] **Step 5: Override `apps/portal/tsconfig.json`**

Replace the generated `apps/portal/tsconfig.json` entirely:

```json
{
  "extends": "../../tsconfig.base.json",
  "compileOnSave": false,
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "isolatedModules": true,
    "esModuleInterop": true,
    "useDefineForClassFields": false,
    "experimentalDecorators": true,
    "moduleResolution": "bundler",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022", "dom", "dom.iterable"],
    "paths": {
      "@personal-ai-os/shared": ["../../packages/shared/src/index.ts"]
    }
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

- [ ] **Step 6: Update `apps/portal/tsconfig.app.json`**

Replace with:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": ["src/main.ts"],
  "include": ["src/**/*.d.ts"]
}
```

- [ ] **Step 7: Update `apps/portal/tsconfig.spec.json`**

Replace with:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": ["jasmine"]
  },
  "include": ["src/**/*.spec.ts", "src/**/*.d.ts"]
}
```

- [ ] **Step 8: Create `apps/portal/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

- [ ] **Step 9: Add Tailwind directives to `apps/portal/src/styles.css`**

Replace the contents of `src/styles.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 10: Create `apps/portal/proxy.conf.json`**

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

- [ ] **Step 11: Update `apps/portal/angular.json`**

In `angular.json`, make these three changes:

**a) Add Ionic CSS to `styles` array** (under `projects.portal.architect.build.options.styles`):

```json
"styles": [
  "node_modules/@ionic/angular/css/core.css",
  "node_modules/@ionic/angular/css/normalize.css",
  "node_modules/@ionic/angular/css/structure.css",
  "node_modules/@ionic/angular/css/typography.css",
  "node_modules/@ionic/angular/css/display.css",
  "src/styles.css"
]
```

**b) Add ionicons SVG assets** (under `projects.portal.architect.build.options.assets`):

```json
"assets": [
  "src/favicon.ico",
  "src/assets",
  {
    "glob": "**/*.svg",
    "input": "node_modules/ionicons/dist/ionicons/svg",
    "output": "./svg"
  }
]
```

**c) Add proxy config to serve options** (under `projects.portal.architect.serve.options`):

```json
"proxyConfig": "proxy.conf.json"
```

- [ ] **Step 12: Add portal scripts**

In `apps/portal/package.json`, ensure scripts include:

```json
"scripts": {
  "dev": "ng serve",
  "build": "ng build",
  "test": "ng test --watch=false --browsers=ChromeHeadless",
  "typecheck": "tsc --noEmit",
  "lint": "ng lint"
}
```

- [ ] **Step 13: Commit**

```bash
git add apps/portal/
git commit -m "chore(portal): Angular + Ionic + Tailwind scaffold"
```

---

## Task 8: Portal App Shell

**Files:**

- Modify: `apps/portal/src/app/app.config.ts`
- Modify: `apps/portal/src/app/app.component.ts`
- Create: `apps/portal/src/app/app.routes.ts`

- [ ] **Step 1: Write `apps/portal/src/app/app.routes.ts`**

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'apps/todo',
    loadComponent: () => import('./apps/todo/todo.component').then((m) => m.TodoComponent),
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
```

- [ ] **Step 2: Write `apps/portal/src/app/app.config.ts`**

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideIonicAngular({}), provideHttpClient()],
};
```

- [ ] **Step 3: Write `apps/portal/src/app/app.component.ts`**

```typescript
import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
})
export class AppComponent {}
```

- [ ] **Step 4: Verify typecheck**

```bash
npm run typecheck --workspace=apps/portal
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/portal/src/app/app.routes.ts apps/portal/src/app/app.config.ts apps/portal/src/app/app.component.ts
git commit -m "feat(portal): app shell with Ionic + router config"
```

---

## Task 9: Portal Home Component

**Files:**

- Create: `apps/portal/src/app/home/home.component.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p apps/portal/src/app/home
```

- [ ] **Step 2: Write `apps/portal/src/app/home/home.component.ts`**

```typescript
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline } from 'ionicons/icons';

interface SubApp {
  name: string;
  description: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon],
  template: `
    <ion-content class="ion-padding">
      <h1 class="text-2xl font-bold text-center mb-6">Personal AI OS</h1>
      <div class="grid grid-cols-2 gap-4">
        @for (app of apps; track app.route) {
          <ion-card
            [routerLink]="app.route"
            class="cursor-pointer m-0 hover:opacity-80 transition-opacity"
          >
            <ion-card-header class="flex flex-col items-center pt-4">
              <ion-icon [name]="app.icon" class="text-5xl text-blue-500 mb-1"></ion-icon>
              <ion-card-title class="text-base text-center">{{ app.name }}</ion-card-title>
            </ion-card-header>
            <ion-card-content class="text-center">
              <p class="text-sm text-gray-500">{{ app.description }}</p>
            </ion-card-content>
          </ion-card>
        }
      </div>
    </ion-content>
  `,
})
export class HomeComponent {
  readonly apps: SubApp[] = [
    {
      name: 'Todo',
      description: 'Manage your tasks',
      route: '/apps/todo',
      icon: 'checkmark-circle-outline',
    },
  ];

  constructor() {
    addIcons({ checkmarkCircleOutline });
  }
}
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck --workspace=apps/portal
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/portal/src/app/home/
git commit -m "feat(portal): home component with sub-app card grid"
```

---

## Task 10: Portal Todo Service (TDD)

**Files:**

- Create: `apps/portal/src/app/apps/todo/todo.service.ts`
- Create: `apps/portal/src/app/apps/todo/todo.service.spec.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p apps/portal/src/app/apps/todo
```

- [ ] **Step 2: Write the failing test**

Create `apps/portal/src/app/apps/todo/todo.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TodoService } from './todo.service';
import type { Todo } from '@personal-ai-os/shared';

const MOCK_TODO: Todo = { id: 1, title: 'Buy milk', done: false, createdAt: '2024-01-01T00:00:00' };

describe('TodoService', () => {
  let service: TodoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(TodoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loadAll sends GET /api/todos and populates todos signal', () => {
    service.loadAll();
    const req = httpMock.expectOne('/api/todos');
    expect(req.request.method).toBe('GET');
    req.flush([MOCK_TODO]);
    expect(service.todos()).toEqual([MOCK_TODO]);
  });

  it('create sends POST /api/todos with title and appends to todos signal', () => {
    service.create('Buy milk');
    const req = httpMock.expectOne('/api/todos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Buy milk' });
    req.flush(MOCK_TODO);
    expect(service.todos()).toContainEqual(MOCK_TODO);
  });

  it('update sends PATCH /api/todos/:id and replaces the todo in signal', () => {
    TestBed.runInInjectionContext(() => service.todos.set([MOCK_TODO]));
    service.update(1, { done: true });
    const req = httpMock.expectOne('/api/todos/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ done: true });
    const updated: Todo = { ...MOCK_TODO, done: true };
    req.flush(updated);
    expect(service.todos()[0]?.done).toBe(true);
  });

  it('remove sends DELETE /api/todos/:id and removes the todo from signal', () => {
    TestBed.runInInjectionContext(() => service.todos.set([MOCK_TODO]));
    service.remove(1);
    const req = httpMock.expectOne('/api/todos/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(service.todos()).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm test --workspace=apps/portal -- --include="**/todo.service.spec.ts"
```

Expected: FAIL — `Cannot find module './todo.service'`

- [ ] **Step 4: Implement `apps/portal/src/app/apps/todo/todo.service.ts`**

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Todo } from '@personal-ai-os/shared';

@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly http = inject(HttpClient);
  readonly todos = signal<Todo[]>([]);

  loadAll(): void {
    this.http.get<Todo[]>('/api/todos').subscribe((todos) => this.todos.set(todos));
  }

  create(title: string): void {
    this.http.post<Todo>('/api/todos', { title }).subscribe((todo) => {
      this.todos.update((list) => [...list, todo]);
    });
  }

  update(id: number, patch: { title?: string; done?: boolean }): void {
    this.http.patch<Todo>(`/api/todos/${id}`, patch).subscribe((updated) => {
      this.todos.update((list) => list.map((t) => (t.id === id ? updated : t)));
    });
  }

  remove(id: number): void {
    this.http.delete(`/api/todos/${id}`).subscribe(() => {
      this.todos.update((list) => list.filter((t) => t.id !== id));
    });
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test --workspace=apps/portal -- --include="**/todo.service.spec.ts"
```

Expected: PASS — 4 tests green.

- [ ] **Step 6: Commit**

```bash
git add apps/portal/src/app/apps/todo/todo.service.ts apps/portal/src/app/apps/todo/todo.service.spec.ts
git commit -m "feat(portal): TodoService with HTTP calls and signal state"
```

---

## Task 11: Portal Todo Component

**Files:**

- Create: `apps/portal/src/app/apps/todo/todo.component.ts`

- [ ] **Step 1: Write `apps/portal/src/app/apps/todo/todo.component.ts`**

```typescript
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonList,
  IonItem,
  IonCheckbox,
  IonLabel,
  IonButton,
  IonInput,
  IonIcon,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonToolbar,
  IonHeader,
  IonTitle,
  IonBackButton,
  IonButtons,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, addOutline, arrowBackOutline } from 'ionicons/icons';
import { TodoService } from './todo.service';
import type { Todo } from '@personal-ai-os/shared';

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonList,
    IonItem,
    IonCheckbox,
    IonLabel,
    IonButton,
    IonInput,
    IonIcon,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonToolbar,
    IonHeader,
    IonTitle,
    IonBackButton,
    IonButtons,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Todo</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        @for (todo of todoService.todos(); track todo.id) {
          <ion-item-sliding>
            <ion-item>
              <ion-checkbox
                slot="start"
                [checked]="todo.done"
                (ionChange)="toggle(todo)"
              ></ion-checkbox>
              <ion-label [class.line-through]="todo.done" [class.opacity-40]="todo.done">
                {{ todo.title }}
              </ion-label>
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option color="danger" (click)="remove(todo.id)">
                <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        }
      </ion-list>

      <div class="flex gap-2 p-4">
        <ion-input
          [(ngModel)]="newTitle"
          placeholder="Add a task…"
          class="flex-1 border border-gray-200 rounded-lg px-3"
          (keyup.enter)="add()"
        ></ion-input>
        <ion-button (click)="add()" [disabled]="!newTitle.trim()">
          <ion-icon slot="icon-only" name="add-outline"></ion-icon>
        </ion-button>
      </div>
    </ion-content>
  `,
})
export class TodoComponent {
  readonly todoService = inject(TodoService);
  newTitle = '';

  constructor() {
    addIcons({ trashOutline, addOutline, arrowBackOutline });
    this.todoService.loadAll();
  }

  add(): void {
    const title = this.newTitle.trim();
    if (!title) return;
    this.todoService.create(title);
    this.newTitle = '';
  }

  toggle(todo: Todo): void {
    this.todoService.update(todo.id, { done: !todo.done });
  }

  remove(id: number): void {
    this.todoService.remove(id);
  }
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck --workspace=apps/portal
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/portal/src/app/apps/todo/todo.component.ts
git commit -m "feat(portal): Todo sub-app component"
```

---

## Task 12: ESLint Configuration

**Files:**

- Create: `.eslintrc.js` (root)
- Create: `apps/backend/.eslintrc.js`
- Add portal ESLint via `ng add`

- [ ] **Step 1: Install root ESLint devDependencies**

Add to root `package.json` `devDependencies`:

```json
"@typescript-eslint/eslint-plugin": "^7.13.0",
"@typescript-eslint/parser": "^7.13.0",
"eslint": "^8.57.0"
```

Then:

```bash
npm install
```

- [ ] **Step 2: Write root `.eslintrc.js`**

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
  },
  ignorePatterns: ['dist/', 'out-tsc/', 'node_modules/', '*.js'],
};
```

- [ ] **Step 3: Verify backend lint passes**

```bash
npm run lint --workspace=apps/backend
```

Expected: no errors (or fix any flagged issues before continuing).

- [ ] **Step 4: Add Angular ESLint to portal**

```bash
cd apps/portal
npx ng add @angular-eslint/schematics --skip-confirmation
cd ../..
```

This creates `apps/portal/.eslintrc.json` and installs `@angular-eslint/*` packages.

- [ ] **Step 5: Verify portal lint passes**

```bash
npm run lint --workspace=apps/portal
```

Expected: no errors (or fix any before continuing).

- [ ] **Step 6: Commit**

```bash
git add .eslintrc.js apps/backend/.eslintrc.js apps/portal/.eslintrc.json apps/portal/package.json package.json package-lock.json
git commit -m "chore: ESLint for root, backend, and portal"
```

---

## Task 13: Husky + lint-staged Pre-commit

**Files:**

- Create: `.husky/pre-commit`
- Create: `.lintstagedrc.json`

- [ ] **Step 1: Initialize Husky**

```bash
npm run prepare
```

Expected: `.husky/` directory created.

- [ ] **Step 2: Write `.lintstagedrc.json`**

```json
{
  "*.{ts,html,css,json,md}": "prettier --write",
  "apps/backend/src/**/*.ts": "eslint --fix",
  "apps/portal/src/**/*.ts": "eslint --fix"
}
```

- [ ] **Step 3: Write `.husky/pre-commit`**

```sh
#!/bin/sh
npx lint-staged
npm run typecheck --workspaces --if-present
```

- [ ] **Step 4: Make the hook executable**

```bash
chmod +x .husky/pre-commit
```

- [ ] **Step 5: Test the hook by making a staged change**

```bash
echo "" >> README.md
git add README.md
git commit -m "test: verify pre-commit hook"
```

Expected: lint-staged runs (Prettier on README.md), typecheck runs, commit succeeds.

- [ ] **Step 6: Commit the hook files**

```bash
git add .husky/ .lintstagedrc.json
git commit -m "chore: Husky + lint-staged pre-commit hook"
```

---

## Task 14: GitHub Actions CI

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Prettier check
        run: npx prettier --check .

      - name: Lint
        run: npm run lint --workspaces --if-present

      - name: Typecheck
        run: npm run typecheck --workspaces --if-present

      - name: Build shared
        run: npm run build --workspace=packages/shared

      - name: Build backend
        run: npm run build --workspace=apps/backend

      - name: Build portal
        run: npm run build --workspace=apps/portal

      - name: Test backend
        run: npm test --workspace=apps/backend

      - name: Test portal
        run: npm test --workspace=apps/portal
```

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "ci: GitHub Actions CI pipeline"
```

---

## Self-Review Checklist

- [x] **Root scaffold** — package.json with workspaces, tsconfig.base.json, .prettierrc: Task 1
- [x] **Shared package** — `@personal-ai-os/shared` with `Todo` interface: Task 2
- [x] **Backend SQLite** — `DATABASE_PATH` env var, defaults to `./data/db.sqlite`: Task 4
- [x] **Backend CRUD** — GET/POST/PATCH/DELETE `/api/todos` with supertest tests: Task 5
- [x] **Backend static serving** — Express serves Angular dist in production: Task 6
- [x] **Portal scaffold** — Angular 17+ standalone, Ionic 7, Tailwind CSS: Task 7
- [x] **Portal routing** — `/` → home, `/apps/todo` → lazy-loaded Todo: Task 8
- [x] **Portal home** — card grid with sub-app cards: Task 9
- [x] **Portal TodoService** — signals + HttpClient, tested with HttpClientTestingModule: Task 10
- [x] **Portal TodoComponent** — list, add, toggle, swipe-delete: Task 11
- [x] **Strict TypeScript** — `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` in all workspaces: Tasks 1, 3, 7
- [x] **ESLint** — root + backend + Angular ESLint for portal: Task 12
- [x] **Prettier** — root config, format:check script: Tasks 1, 12
- [x] **Pre-commit** — Husky + lint-staged (prettier write + eslint fix + typecheck): Task 13
- [x] **CI** — one `ci.yml`: prettier check, lint, typecheck, build, test: Task 14
- [x] **Dev workflow** — `npm run dev` starts both apps with concurrently; proxy forwards `/api/*`: Tasks 1, 7
- [x] **No auth** — Tailscale is the perimeter, no auth code added
