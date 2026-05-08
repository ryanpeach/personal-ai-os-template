'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const dbPath =
  process.env.DATABASE_PATH ?? path.join(__dirname, '..', 'data', 'db.sqlite');

if (fs.existsSync(dbPath)) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = `${dbPath}.${ts}.backup`;
  fs.copyFileSync(dbPath, dest);
  console.log(`[db] backed up to ${path.basename(dest)}`);
}

execFileSync(
  'knex',
  ['--knexfile', path.join(__dirname, '..', 'knexfile.cjs'), 'migrate:latest'],
  { stdio: 'inherit' },
);
