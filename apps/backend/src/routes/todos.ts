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
    const row = db
      .prepare('SELECT * FROM todos WHERE id = ?')
      .get(result.lastInsertRowid) as DbRow;
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
    const newDone =
      typeof body.done === 'boolean' ? (body.done ? 1 : 0) : existing.done;
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
