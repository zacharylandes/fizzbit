import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const ideas = pgTable("ideas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  source: text("source").notNull(), // 'text' or 'image'
  sourceContent: text("source_content"), // original prompt or image data
  parentIdeaId: varchar("parent_idea_id"), // for inspiration chains
  isSaved: integer("is_saved").default(0), // 0 = not saved, 1 = saved
  metadata: jsonb("metadata"), // additional data like image analysis results
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedIdeas = pgTable("saved_ideas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ideaId: varchar("idea_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIdeaSchema = createInsertSchema(ideas).omit({
  id: true,
  createdAt: true,
});

export const insertSavedIdeaSchema = createInsertSchema(savedIdeas).omit({
  id: true,
  createdAt: true,
});

export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type Idea = typeof ideas.$inferSelect;
export type InsertSavedIdea = z.infer<typeof insertSavedIdeaSchema>;
export type SavedIdea = typeof savedIdeas.$inferSelect;
