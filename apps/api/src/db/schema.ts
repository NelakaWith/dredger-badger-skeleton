import {
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
  jsonb,
} from 'drizzle-orm/pg-core';

/**
 * Tasks Table Schema:
 * Holds all discovered items, their metadata, extracted content, and AI results.
 */
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: text('url').notNull().unique(),
  title: text('title').notNull(),
  
  // Content
  content: text('content'), // Raw or snippet content
  fullText: text('full_text'), // Full extracted content

  // AI results
  results: jsonb('results'), // Generic JSONB for any AI extraction data
  summary: text('summary'),

  // Flags for content quality and status
  processingStatus: text('processing_status').default('discovered'), // discovered, scraped, analyzed, failed

  // Semantic Search / Near-Duplicate Detection
  // pgvector extension must be enabled in Postgres
  embedding: vector('embedding', { dimensions: 3072 }), // Gemini Embedding 2 standard dimensions

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
