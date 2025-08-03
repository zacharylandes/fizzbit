import {
  users,
  ideas,
  savedIdeas,
  type User,
  type UpsertUser,
  type Idea,
  type InsertIdea,
  type SavedIdea,
  type InsertSavedIdea,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Idea operations
  getIdea(id: string): Promise<Idea | undefined>;
  createIdea(idea: InsertIdea, userId?: string): Promise<Idea>;
  getRandomIdeas(count: number, excludeIds?: string[]): Promise<Idea[]>;
  saveIdea(ideaId: string, userId: string): Promise<SavedIdea>;
  unsaveIdea(ideaId: string, userId: string): Promise<void>;
  getSavedIdeas(userId: string): Promise<Idea[]>;
  getIdeaChain(parentIdeaId: string): Promise<Idea[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Idea operations
  async getIdea(id: string): Promise<Idea | undefined> {
    const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
    return idea;
  }

  async createIdea(insertIdea: InsertIdea, userId?: string): Promise<Idea> {
    const [idea] = await db
      .insert(ideas)
      .values({
        ...insertIdea,
        userId,
      })
      .returning();
    return idea;
  }

  async getRandomIdeas(count: number, excludeIds: string[] = []): Promise<Idea[]> {
    // Get random ideas - for now, just get all ideas and filter/shuffle in memory
    // In production, this would use proper SQL for better performance
    const allIdeas = await db.select().from(ideas);
    
    // Filter out excluded IDs
    const filteredIdeas = allIdeas.filter(idea => !excludeIds.includes(idea.id));
    
    // Shuffle and return random ideas
    const shuffled = filteredIdeas.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  async saveIdea(ideaId: string, userId: string): Promise<SavedIdea> {
    const [savedIdea] = await db
      .insert(savedIdeas)
      .values({
        ideaId,
        userId,
      })
      .returning();
    
    // Mark the idea as saved
    await db
      .update(ideas)
      .set({ isSaved: 1 })
      .where(eq(ideas.id, ideaId));
    
    return savedIdea;
  }

  async unsaveIdea(ideaId: string, userId: string): Promise<void> {
    // Remove the saved idea entry
    await db
      .delete(savedIdeas)
      .where(and(eq(savedIdeas.ideaId, ideaId), eq(savedIdeas.userId, userId)));
    
    // Mark the idea as not saved (only if no other users have it saved)
    const otherSavedEntries = await db
      .select()
      .from(savedIdeas)
      .where(eq(savedIdeas.ideaId, ideaId));
    
    if (otherSavedEntries.length === 0) {
      await db
        .update(ideas)
        .set({ isSaved: 0 })
        .where(eq(ideas.id, ideaId));
    }
  }

  async getSavedIdeas(userId: string): Promise<Idea[]> {
    const result = await db
      .select({ idea: ideas })
      .from(savedIdeas)
      .innerJoin(ideas, eq(savedIdeas.ideaId, ideas.id))
      .where(eq(savedIdeas.userId, userId))
      .orderBy(savedIdeas.createdAt);

    return result.map(r => r.idea);
  }

  async getIdeaChain(parentIdeaId: string): Promise<Idea[]> {
    return await db
      .select()
      .from(ideas)
      .where(eq(ideas.parentIdeaId, parentIdeaId));
  }
}

export const storage = new DatabaseStorage();