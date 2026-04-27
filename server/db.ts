import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

const sqlClient = neon(process.env.DATABASE_URL!);

export const usersTable = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url').default(
    'https://cdn-icons-png.flaticon.com/512/847/847969.png'
  ),
  gamesPlayed: integer('games_played').default(0),
  wins: integer('wins').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const matchesTable = pgTable('matches', {
  id: text('id').primaryKey(),
  winnerId: text('winner_id').references(() => usersTable.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
});

export const schema = { usersTable, matchesTable };

export const db = drizzle(sqlClient, { schema });

export async function initDb() {
  await sqlClient(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT DEFAULT 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
      games_played INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await sqlClient(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      winner_id TEXT REFERENCES users(id),
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ
    )
  `);
  console.log('[DB] Neon PostgreSQL initialized');
}