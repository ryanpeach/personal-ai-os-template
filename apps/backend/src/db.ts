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
