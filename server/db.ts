import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';

// 1. Инициализация файла БД
const sqlite = new Database('monopoly.db');
sqlite.pragma('journal_mode = WAL');

// 2. Определение схем таблиц
export const usersTable = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url').default('https://cdn-icons-png.flaticon.com/512/847/847969.png'),
  gamesPlayed: integer('games_played').default(0),
  wins: integer('wins').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const matchesTable = sqliteTable('matches', {
  id: text('id').primaryKey(),
  winnerId: text('winner_id').references(() => usersTable.id),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
});

// 3. Экспорт схемы для Drizzle (это ключевой момент для типов)
export const schema = {
  usersTable,
  matchesTable,
};

// 4. Инициализация Drizzle с явной схемой
export const db = drizzle(sqlite, { schema });

// 5. Функция инициализации (создает таблицы, если их нет)
export function initDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT DEFAULT 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
      games_played INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      winner_id TEXT REFERENCES users(id),
      start_time INTEGER NOT NULL,
      end_time INTEGER
    );
  `);
  console.log('[DB] Database initialized');
}