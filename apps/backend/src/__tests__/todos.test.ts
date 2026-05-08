import request from 'supertest';
import { openDatabase } from '../db';
import { createApp } from '../app';
import type Database from 'better-sqlite3';
import type { Todo } from '@personal-ai-os/shared';

describe('Todos API', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    db = openDatabase();
    app = createApp(db);
  });

  afterAll(() => {
    db.close();
  });

  afterEach(() => {
    db.prepare('DELETE FROM todos').run();
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
