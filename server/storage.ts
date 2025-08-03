import { type Idea, type InsertIdea, type SavedIdea, type InsertSavedIdea } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getIdea(id: string): Promise<Idea | undefined>;
  createIdea(idea: InsertIdea): Promise<Idea>;
  getRandomIdeas(count: number, excludeIds?: string[]): Promise<Idea[]>;
  saveIdea(ideaId: string): Promise<SavedIdea>;
  unsaveIdea(ideaId: string): Promise<void>;
  getSavedIdeas(): Promise<Idea[]>;
  getIdeaChain(parentIdeaId: string): Promise<Idea[]>;
}

export class MemStorage implements IStorage {
  private ideas: Map<string, Idea>;
  private savedIdeas: Map<string, SavedIdea>;

  constructor() {
    this.ideas = new Map();
    this.savedIdeas = new Map();
    
    // Initialize with some default ideas
    this.initializeDefaultIdeas();
  }

  private async initializeDefaultIdeas() {
    const defaultIdeas: InsertIdea[] = [
      {
        title: "Create a Vibrant Art Gallery Wall",
        description: "Transform your space with a curated collection of colorful artwork. Mix different sizes and mediums to create visual interest and personality in your room.",
        source: "text",
        sourceContent: "colorful home decoration",
        isSaved: 0,
        metadata: { category: "home-decor", colors: ["vibrant", "mixed"] }
      },
      {
        title: "Design a Rainbow Reading Nook",
        description: "Create a cozy corner with colorful cushions, bright lighting, and rainbow-organized bookshelves for the perfect reading escape.",
        source: "text",
        sourceContent: "cozy reading space",
        isSaved: 0,
        metadata: { category: "interior-design", colors: ["rainbow", "cozy"] }
      },
      {
        title: "Build a Colorful Herb Garden",
        description: "Combine functionality with beauty by creating a vibrant herb garden using colorful pots and creative arrangements both indoors and outdoors.",
        source: "text",
        sourceContent: "herb garden ideas",
        isSaved: 0,
        metadata: { category: "gardening", colors: ["natural", "bright"] }
      },
      {
        title: "Craft a Mobile-Inspired Color Palette",
        description: "Design a room using colors inspired by your favorite mobile app interfaces - think coral pinks, ocean blues, and energetic oranges.",
        source: "text",
        sourceContent: "mobile app design colors",
        isSaved: 0,
        metadata: { category: "color-theory", colors: ["coral", "blue", "orange"] }
      },
      {
        title: "Create a Sunset Photography Series",
        description: "Capture the magical golden hour with a series of sunset photographs using different angles, silhouettes, and foreground elements.",
        source: "text",
        sourceContent: "sunset photography",
        isSaved: 0,
        metadata: { category: "photography", colors: ["golden", "warm"] }
      }
    ];

    for (const idea of defaultIdeas) {
      await this.createIdea(idea);
    }
  }

  async getIdea(id: string): Promise<Idea | undefined> {
    return this.ideas.get(id);
  }

  async createIdea(insertIdea: InsertIdea): Promise<Idea> {
    const id = randomUUID();
    const idea: Idea = { 
      ...insertIdea,
      sourceContent: insertIdea.sourceContent ?? null,
      parentIdeaId: insertIdea.parentIdeaId ?? null,
      isSaved: insertIdea.isSaved ?? 0,
      metadata: insertIdea.metadata ?? null,
      id, 
      createdAt: new Date()
    };
    this.ideas.set(id, idea);
    return idea;
  }

  async getRandomIdeas(count: number, excludeIds: string[] = []): Promise<Idea[]> {
    const allIdeas = Array.from(this.ideas.values()).filter(
      idea => !excludeIds.includes(idea.id)
    );
    
    // Shuffle and return random ideas
    const shuffled = allIdeas.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  async saveIdea(ideaId: string): Promise<SavedIdea> {
    const id = randomUUID();
    const savedIdea: SavedIdea = {
      id,
      ideaId,
      createdAt: new Date()
    };
    this.savedIdeas.set(id, savedIdea);
    
    // Mark the idea as saved
    const idea = this.ideas.get(ideaId);
    if (idea) {
      idea.isSaved = 1;
      this.ideas.set(ideaId, idea);
    }
    
    return savedIdea;
  }

  async unsaveIdea(ideaId: string): Promise<void> {
    // Find and remove the saved idea entry
    const savedIdeaEntries = Array.from(this.savedIdeas.entries());
    const savedEntry = savedIdeaEntries.find(([_, savedIdea]) => savedIdea.ideaId === ideaId);
    
    if (savedEntry) {
      this.savedIdeas.delete(savedEntry[0]);
    }
    
    // Mark the idea as not saved
    const idea = this.ideas.get(ideaId);
    if (idea) {
      idea.isSaved = 0;
      this.ideas.set(ideaId, idea);
    }
  }

  async getSavedIdeas(): Promise<Idea[]> {
    const savedIdeaIds = Array.from(this.savedIdeas.values()).map(si => si.ideaId);
    return Array.from(this.ideas.values()).filter(idea => savedIdeaIds.includes(idea.id));
  }

  async getIdeaChain(parentIdeaId: string): Promise<Idea[]> {
    return Array.from(this.ideas.values()).filter(
      idea => idea.parentIdeaId === parentIdeaId
    );
  }
}

export const storage = new MemStorage();
