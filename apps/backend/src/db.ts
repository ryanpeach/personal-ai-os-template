import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

import { migrations } from './migrations/index';

function backup(dbPath: string): void {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = `${dbPath}.${ts}.backup`;
  fs.copyFileSync(dbPath, dest);
  console.log(`[db] backed up to ${path.basename(dest)}`);
}

function runMigrations(db: Database.Database, dbPath: string): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL UNIQUE,
      applied_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set(
    (db.prepare('SELECT name FROM _migrations').all() as { name: string }[]).map((r) => r.name),
  );

  const pending = migrations.filter((m) => !applied.has(m.name));

  if (pending.length > 0 && dbPath !== ':memory:' && fs.existsSync(dbPath)) {
    backup(dbPath);
  }

  for (const migration of pending) {
    db.exec(migration.sql);
    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(migration.name);
    console.log(`[db] applied migration: ${migration.name}`);
  }
}

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
  runMigrations(db, resolved);
  return db;
}
