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
import { eq, and, or } from "drizzle-orm";
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
  getPromptHistory(userId: string): Promise<Array<{
    id: string;
    type: "text" | "image";
    content: string;
    timestamp: string;
    ideasGenerated: number;
  }>>;
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

  async getPromptHistory(userId: string): Promise<Array<{
    id: string;
    type: "text" | "image";
    content: string;
    timestamp: string;
    ideasGenerated: number;
  }>> {
    // Get unique prompts for this user based on ideas they've generated or interacted with
    const userIdeas = await db
      .select()
      .from(ideas)
      .leftJoin(savedIdeas, eq(ideas.id, savedIdeas.ideaId))
      .where(
        // Include ideas the user saved OR ideas generated for authenticated requests
        // Since we store userId when generating ideas for logged-in users
        and(
          eq(savedIdeas.userId, userId)
        )
      );

    // Also get ideas that were generated during authenticated sessions
    const generatedIdeas = await db
      .select()
      .from(ideas)
      .where(eq(ideas.userId, userId));

    // Combine and deduplicate by sourceContent
    const allUserIdeas = [...userIdeas.map(r => r.ideas), ...generatedIdeas].filter(Boolean);
    
    // Group by unique source content and count ideas per prompt
    const promptMap = new Map<string, {
      id: string;
      type: "text" | "image";
      content: string;
      timestamp: string;
      ideasGenerated: number;
    }>();

    for (const idea of allUserIdeas) {
      if (!idea.sourceContent) continue;
      
      const key = `${idea.source}-${idea.sourceContent}`;
      
      if (promptMap.has(key)) {
        const existing = promptMap.get(key)!;
        existing.ideasGenerated += 1;
        // Use the earliest timestamp
        if (idea.createdAt && new Date(idea.createdAt) < new Date(existing.timestamp)) {
          existing.timestamp = idea.createdAt.toISOString();
        }
      } else {
        promptMap.set(key, {
          id: idea.id,
          type: idea.source as "text" | "image",
          content: idea.sourceContent,
          timestamp: idea.createdAt?.toISOString() || new Date().toISOString(),
          ideasGenerated: 1,
        });
      }
    }

    // Convert to array and sort by timestamp (newest first)
    return Array.from(promptMap.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

export const storage = new DatabaseStorage();