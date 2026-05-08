import express from 'express';
import type Database from 'better-sqlite3';
import { createTodosRouter } from './routes/todos';

export function createApp(db: Database.Database): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/todos', createTodosRouter(db));
  return app;
}
