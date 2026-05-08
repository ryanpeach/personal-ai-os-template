import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export function openDatabase(dbPath?: string): Database.Database {
  const resolved =
    dbPath ?? process.env['DATABASE_PATH'] ?? path.join(process.cwd(), 'data', 'db.sqlite');

  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Database(resolved);
}
