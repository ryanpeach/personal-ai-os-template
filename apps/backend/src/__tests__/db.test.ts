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
