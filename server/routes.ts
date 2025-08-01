import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIdeaSchema } from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate ideas from text prompt
  app.post("/api/ideas/generate-from-text", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a creative inspiration assistant. Generate unique, actionable creative ideas based on user prompts. Respond with JSON containing an array of 3 ideas, each with 'title' and 'description' fields. Make descriptions engaging and specific."
          },
          {
            role: "user",
            content: `Generate 3 creative ideas inspired by: ${prompt}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || "{}");
      const ideas = aiResponse.ideas || [];

      // Store generated ideas in memory
      const createdIdeas = [];
      for (const ideaData of ideas) {
        const idea = await storage.createIdea({
          title: ideaData.title,
          description: ideaData.description,
          source: "text",
          sourceContent: prompt,
          isSaved: 0,
          metadata: { generatedAt: new Date().toISOString() }
        });
        createdIdeas.push(idea);
      }

      res.json({ ideas: createdIdeas });
    } catch (error) {
      console.error("Error generating ideas from text:", error);
      res.status(500).json({ error: "Failed to generate ideas" });
    }
  });

  // Generate ideas from image
  app.post("/api/ideas/generate-from-image", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: "Image data is required" });
      }

      // Analyze image with OpenAI Vision
      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image and generate 3 creative ideas inspired by what you see. Focus on colors, objects, themes, and mood. Respond with JSON containing an array of ideas, each with 'title' and 'description' fields."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const aiResponse = JSON.parse(visionResponse.choices[0].message.content || "{}");
      const ideas = aiResponse.ideas || [];

      // Store generated ideas
      const createdIdeas = [];
      for (const ideaData of ideas) {
        const idea = await storage.createIdea({
          title: ideaData.title,
          description: ideaData.description,
          source: "image",
          sourceContent: "uploaded_image",
          isSaved: 0,
          metadata: { 
            generatedAt: new Date().toISOString(),
            imageAnalysis: true
          }
        });
        createdIdeas.push(idea);
      }

      res.json({ ideas: createdIdeas });
    } catch (error) {
      console.error("Error generating ideas from image:", error);
      res.status(500).json({ error: "Failed to analyze image and generate ideas" });
    }
  });

  // Get random ideas for initial card stack
  app.get("/api/ideas/random", async (req, res) => {
    try {
      const count = parseInt(req.query.count as string) || 3;
      const excludeIds = req.query.exclude ? (req.query.exclude as string).split(',') : [];
      
      const ideas = await storage.getRandomIdeas(count, excludeIds);
      res.json({ ideas });
    } catch (error) {
      console.error("Error getting random ideas:", error);
      res.status(500).json({ error: "Failed to get ideas" });
    }
  });

  // Save an idea
  app.post("/api/ideas/:id/save", async (req, res) => {
    try {
      const { id } = req.params;
      const savedIdea = await storage.saveIdea(id);
      res.json({ savedIdea });
    } catch (error) {
      console.error("Error saving idea:", error);
      res.status(500).json({ error: "Failed to save idea" });
    }
  });

  // Get saved ideas
  app.get("/api/ideas/saved", async (req, res) => {
    try {
      const ideas = await storage.getSavedIdeas();
      res.json({ ideas });
    } catch (error) {
      console.error("Error getting saved ideas:", error);
      res.status(500).json({ error: "Failed to get saved ideas" });
    }
  });

  // Generate ideas based on existing idea (for swipe up action)
  app.post("/api/ideas/:id/explore", async (req, res) => {
    try {
      const { id } = req.params;
      const parentIdea = await storage.getIdea(id);
      
      if (!parentIdea) {
        return res.status(404).json({ error: "Idea not found" });
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a creative inspiration assistant. Generate ideas that build upon or are inspired by an existing idea. Create variations, extensions, or related concepts."
          },
          {
            role: "user",
            content: `Generate 3 new creative ideas inspired by this existing idea: "${parentIdea.title}" - ${parentIdea.description}. Make them related but unique variations or extensions of this concept. Respond with JSON containing an array of ideas, each with 'title' and 'description' fields.`
          }
        ],
        response_format: { type: "json_object" }
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || "{}");
      const ideas = aiResponse.ideas || [];

      // Store generated ideas with parent reference
      const createdIdeas = [];
      for (const ideaData of ideas) {
        const idea = await storage.createIdea({
          title: ideaData.title,
          description: ideaData.description,
          source: parentIdea.source,
          sourceContent: parentIdea.sourceContent,
          parentIdeaId: parentIdea.id,
          isSaved: 0,
          metadata: { 
            generatedAt: new Date().toISOString(),
            basedOn: parentIdea.id
          }
        });
        createdIdeas.push(idea);
      }

      res.json({ ideas: createdIdeas });
    } catch (error) {
      console.error("Error exploring idea:", error);
      res.status(500).json({ error: "Failed to explore idea" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
