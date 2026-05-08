'use strict';
const Knex = require('knex');
const path = require('path');
const fs = require('fs');

const TEST_DB_PATH = path.join(__dirname, 'data', 'test.sqlite');

async function globalSetup() {
  process.env.DATABASE_PATH = TEST_DB_PATH;

  const dir = path.dirname(TEST_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const knex = Knex.default({
    client: 'better-sqlite3',
    connection: { filename: TEST_DB_PATH },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      loadExtensions: ['.cjs'],
    },
  });

  try {
    await knex.migrate.latest();
  } finally {
    await knex.destroy();
  }
}

module.exports = globalSetup;
