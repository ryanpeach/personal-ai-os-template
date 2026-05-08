import fs from 'fs';
import os from 'os';
import path from 'path';
import { openDatabase } from '../db';
import type Database from 'better-sqlite3';

describe('openDatabase', () => {
  describe('path handling', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-db-'));
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true });
    });

    it('creates the data directory if it does not exist', () => {
      const dbPath = path.join(tmpDir, 'nested', 'db.sqlite');
      const db = openDatabase(dbPath);
      expect(fs.existsSync(dbPath)).toBe(true);
      db.close();
    });

    it('is idempotent — opening the same file twice does not throw', () => {
      const dbPath = path.join(tmpDir, 'db.sqlite');
      const db1 = openDatabase(dbPath);
      db1.close();
      const db2 = openDatabase(dbPath);
      db2.close();
    });
  });

  describe('with migrated database', () => {
    let db: Database.Database;

    beforeAll(() => {
      db = openDatabase();
    });

    afterAll(() => {
      db.close();
    });

    afterEach(() => {
      db.prepare('DELETE FROM todos').run();
    });

    it('inserts and retrieves a row', () => {
      db.prepare("INSERT INTO todos (title) VALUES ('hello')").run();
      const rows = db.prepare('SELECT title FROM todos').all() as { title: string }[];
      expect(rows[0]?.title).toBe('hello');
    });
  });
});
