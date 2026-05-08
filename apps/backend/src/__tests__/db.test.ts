import fs from 'fs';
import os from 'os';
import path from 'path';
import { openDatabase } from '../db';

describe('openDatabase', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-db-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('creates todos table in a fresh database', async () => {
    const db = await openDatabase(path.join(tmpDir, 'db.sqlite'));
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='todos'")
      .all() as { name: string }[];
    expect(tables).toHaveLength(1);
    db.close();
  });

  it('is idempotent — opening the same file twice does not throw', async () => {
    const dbPath = path.join(tmpDir, 'db.sqlite');
    const db1 = await openDatabase(dbPath);
    db1.close();
    const db2 = await openDatabase(dbPath);
    db2.close();
  });

  it('inserts and retrieves a row', async () => {
    const db = await openDatabase(path.join(tmpDir, 'db.sqlite'));
    db.prepare("INSERT INTO todos (title) VALUES ('hello')").run();
    const rows = db.prepare('SELECT title FROM todos').all() as { title: string }[];
    expect(rows[0]?.title).toBe('hello');
    db.close();
  });
});
