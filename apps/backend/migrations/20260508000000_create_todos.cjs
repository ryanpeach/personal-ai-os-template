'use strict';

exports.up = async function (knex) {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS todos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT    NOT NULL,
      done       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('todos');
};
