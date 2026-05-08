'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const dbPath = process.env.DATABASE_PATH ?? path.join(__dirname, '..', 'data', 'db.sqlite');

if (fs.existsSync(dbPath)) {
  const backupsDir = path.join(path.dirname(dbPath), 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(backupsDir, `db.sqlite.${ts}.backup`);
  fs.copyFileSync(dbPath, dest);
  console.log(`[db] backed up to ${path.relative(process.cwd(), dest)}`);
}

execFileSync('knex', ['--knexfile', path.join(__dirname, '..', 'knexfile.cjs'), 'migrate:latest'], {
  stdio: 'inherit',
});
