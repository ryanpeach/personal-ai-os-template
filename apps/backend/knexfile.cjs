'use strict';
const path = require('path');

module.exports = {
  client: 'better-sqlite3',
  connection: {
    filename: process.env.DATABASE_PATH ?? path.join(__dirname, 'data', 'db.sqlite'),
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    loadExtensions: ['.cjs'],
  },
};
