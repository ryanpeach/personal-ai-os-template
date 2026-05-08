import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import Knex from 'knex';

function backup(dbPath: string): void {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = `${dbPath}.${ts}.backup`;
  fs.copyFileSync(dbPath, dest);
  console.log(`[db] backed up to ${path.basename(dest)}`);
}

async function runMigrations(dbPath: string): Promise<void> {
  const existedBefore = fs.existsSync(dbPath);
  const knex = Knex({
    client: 'better-sqlite3',
    connection: { filename: dbPath },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, '..', 'migrations'),
      loadExtensions: ['.cjs'],
    },
  });

  try {
    const [, pending] = await knex.migrate.list();
    if (pending.length > 0 && existedBefore) {
      backup(dbPath);
    }
    await knex.migrate.latest();
  } finally {
    await knex.destroy();
  }
}

export async function openDatabase(dbPath?: string): Promise<Database.Database> {
  const resolved =
    dbPath ?? process.env['DATABASE_PATH'] ?? path.join(process.cwd(), 'data', 'db.sqlite');

  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await runMigrations(resolved);
  return new Database(resolved);
}
