import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIdeaSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import OpenAI from "openai";
import { generateIdeasFromText, generateIdeasFromImage } from "./huggingface";
import multer from "multer";
import fs from "fs";
import path from "path";

// Initialize OpenAI with error handling
let openai: OpenAI | null = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY
    });
  } else {
    console.warn("Warning: OPENAI_API_KEY not found - AI features will use fallback responses");
  }
} catch (error) {
  console.error("Failed to initialize OpenAI client:", error);
  console.warn("AI features will use fallback responses");
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth middleware
  await setupAuth(app);
  
  // Configure multer for audio file uploads
  const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
      // Accept audio files
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed!'), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  });
  
  // Add global error handling middleware for async routes
  const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
    (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  
  // Generate ideas from text prompt using Hugging Face Llama 3
  app.post("/api/ideas/generate-from-text", asyncHandler(async (req: any, res) => {
    const { prompt } = req.body;
    const userId = req.user?.claims?.sub; // Get user ID if authenticated
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    try {
      // Use Hugging Face Llama 3 for fast and cheap idea generation
      const ideas = await generateIdeasFromText(prompt);

      // Store generated ideas in database with user ID if authenticated
      const createdIdeas = [];
      for (const ideaData of ideas) {
        const idea = await storage.createIdea({
          title: ideaData.title,
          description: ideaData.description,
          source: "text",
          sourceContent: prompt,
          isSaved: 0,
          metadata: { generatedAt: new Date().toISOString() }
        }, userId);
        createdIdeas.push(idea);
      }

      res.json({ ideas: createdIdeas });
    } catch (error) {
      console.error("Error generating ideas from text:", error);
      
      // Enhanced error handling with more specific error types
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      }
      
      // Fallback to predefined creative ideas when AI is unavailable
      const fallbackIdeas = [
        {
          title: "Create a Colorful Reading Nook",
          description: "Transform a corner of your room into a cozy reading space with bright cushions, fairy lights, and floating bookshelves painted in vibrant colors."
        },
        {
          title: "Design a Rainbow Garden Wall",
          description: "Paint a gradient rainbow mural on one wall and add hanging plants at different heights to create a living rainbow garden effect."
        },
        {
          title: "Build a Creative Workspace",
          description: "Set up an inspiring workspace with a cork board gallery wall, colorful desk accessories, and motivational quotes in beautiful typography."
        }
      ];

      const createdIdeas = [];
      for (const ideaData of fallbackIdeas) {
        const idea = await storage.createIdea({
          title: ideaData.title,
          description: ideaData.description,
          source: "text",
          sourceContent: prompt,
          isSaved: 0,
          metadata: { 
            generatedAt: new Date().toISOString(),
            type: "fallback"
          }
        }, userId);
        createdIdeas.push(idea);
      }

      res.json({ ideas: createdIdeas });
    }
  }));

  // Generate ideas from image using Hugging Face
  app.post("/api/ideas/generate-from-image", asyncHandler(async (req: any, res) => {
    const { imageBase64 } = req.body;
    const userId = req.user?.claims?.sub; // Get user ID if authenticated
    
    if (!imageBase64) {
      return res.status(400).json({ error: "Image data is required" });
    }

    try {
      // Use Hugging Face for image analysis and idea generation
      const ideas = await generateIdeasFromImage(imageBase64);

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
        }, userId);
        createdIdeas.push(idea);
      }

      res.json({ ideas: createdIdeas });
    } catch (error) {
      console.error("Error generating ideas from image:", error);
      
      // Fallback ideas for image processing errors
      const fallbackIdeas = [
        {
          title: "Visual Art Inspiration",
          description: "Create artwork inspired by the visual elements you uploaded. Experiment with colors, shapes, and themes you observed."
        },
        {
          title: "Photography Project",
          description: "Start a photography series exploring similar themes, compositions, or subjects as in your image."
        },
        {
          title: "Creative Story",
          description: "Write a story or poem inspired by the mood and elements in your image. Let your imagination fill in the details."
        }
      ];

      const createdIdeas = [];
      for (const ideaData of fallbackIdeas) {
        const idea = await storage.createIdea({
          title: ideaData.title,
          description: ideaData.description,
          source: "image",
          sourceContent: "uploaded_image",
          isSaved: 0,
          metadata: { 
            generatedAt: new Date().toISOString(),
            type: "fallback"
          }
        }, userId);
        createdIdeas.push(idea);
      }

      res.json({ ideas: createdIdeas });
    }
  }));

  // Audio transcription and idea generation
  app.post("/api/ideas/generate-from-audio", upload.single('audio'), asyncHandler(async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    
    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    try {
      console.log('📢 Processing audio file:', req.file.filename);
      
      if (!openai) {
        throw new Error("OpenAI client not available");
      }

      // Transcribe audio using OpenAI Whisper
      const audioReadStream = fs.createReadStream(req.file.path);
      const transcription = await openai.audio.transcriptions.create({
        file: audioReadStream,
        model: "whisper-1",
      });

      console.log('📝 Transcription result:', transcription.text);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      if (!transcription.text || transcription.text.trim().length === 0) {
        return res.status(400).json({ error: "Could not transcribe audio. Please try speaking more clearly." });
      }

      // Generate ideas from transcribed text using Hugging Face
      const ideas = await generateIdeasFromText(transcription.text);

      // Store generated ideas
      const createdIdeas = [];
      for (const ideaData of ideas) {
        const idea = await storage.createIdea({
          title: ideaData.title,
          description: ideaData.description,
          source: "audio",
          sourceContent: transcription.text,
          isSaved: 0,
          metadata: { 
            generatedAt: new Date().toISOString(),
            audioTranscription: true,
            originalAudioDuration: transcription.duration || 0
          }
        }, userId);
        createdIdeas.push(idea);
      }

      res.json({ 
        ideas: createdIdeas,
        transcription: transcription.text 
      });
    } catch (error) {
      console.error("Error processing audio:", error);
      
      // Clean up file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      // Fallback ideas for audio processing errors
      const fallbackIdeas = [
        {
          title: "Voice-Activated Creative Project",
          description: "Start a creative project where you record voice memos as inspiration. Use your spoken thoughts as seeds for larger works."
        },
        {
          title: "Audio Storytelling",
          description: "Create an audio story or podcast episode. Focus on sound design, music, and compelling narrative voice."
        },
        {
          title: "Musical Expression",
          description: "Compose a piece of music or song that expresses the thoughts and feelings from your voice recording."
        }
      ];

      const createdIdeas = [];
      for (const ideaData of fallbackIdeas) {
        const idea = await storage.createIdea({
          title: ideaData.title,
          description: ideaData.description,
          source: "audio",
          sourceContent: "audio_transcription_fallback",
          isSaved: 0,
          metadata: { 
            generatedAt: new Date().toISOString(),
            type: "fallback"
          }
        }, userId);
        createdIdeas.push(idea);
      }

      res.json({ 
        ideas: createdIdeas,
        transcription: "Audio processing unavailable - here are some voice-inspired ideas!"
      });
    }
  }));

  // Get random ideas for initial card stack
  app.get("/api/ideas/random", async (req, res) => {
    try {
      const count = parseInt(req.query.count as string) || 10; // Default to 10 ideas for better batching
      const excludeIds = req.query.exclude ? (req.query.exclude as string).split(',') : [];
      
      const ideas = await storage.getRandomIdeas(count, excludeIds);
      res.json({ ideas });
    } catch (error) {
      console.error("Error getting random ideas:", error);
      res.status(500).json({ error: "Failed to get ideas" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Save an idea - now requires authentication
  app.post("/api/ideas/:id/save", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const savedIdea = await storage.saveIdea(id, userId);
      res.json({ savedIdea });
    } catch (error) {
      console.error("Error saving idea:", error);
      res.status(500).json({ error: "Failed to save idea" });
    }
  });

  // Get saved ideas - now requires authentication
  app.get("/api/ideas/saved", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ideas = await storage.getSavedIdeas(userId);
      res.json({ ideas });
    } catch (error) {
      console.error("Error getting saved ideas:", error);
      res.status(500).json({ error: "Failed to get saved ideas" });
    }
  });

  // Unsave/delete an idea - now requires authentication
  app.delete("/api/ideas/:id/save", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      await storage.unsaveIdea(id, userId);
      res.json({ success: true, message: "Idea removed from saved" });
    } catch (error) {
      console.error("Error unsaving idea:", error);
      res.status(500).json({ error: "Failed to remove idea" });
    }
  });

  // Get prompt history - unique prompts used by the user
  app.get("/api/prompts/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const promptHistory = await storage.getPromptHistory(userId);
      res.json({ prompts: promptHistory });
    } catch (error) {
      console.error("Error getting prompt history:", error);
      res.status(500).json({ error: "Failed to get prompt history" });
    }
  });

  // Generate ideas based on existing idea (for swipe up action)
  app.post("/api/ideas/:id/explore", async (req: any, res) => {
    const { id } = req.params;
    const userId = req.user?.claims?.sub; // Get user ID if authenticated
    const parentIdea = await storage.getIdea(id);
    
    if (!parentIdea) {
      return res.status(404).json({ error: "Idea not found" });
    }

    try {
      // Check if OpenAI client is available
      if (!openai) {
        throw new Error("OpenAI client not initialized");
      }

      // Create a more targeted prompt by combining original user intent with the specific idea they're interested in
      let contextualPrompt = `Generate 5 new creative ideas inspired by this existing idea: "${parentIdea.title}" - ${parentIdea.description}.`;
      
      // If we have the original prompt/search context, combine it for better targeting
      if (parentIdea.sourceContent && parentIdea.sourceContent !== "uploaded_image") {
        contextualPrompt = `The user originally was interested in: "${parentIdea.sourceContent}". They then showed particular interest in this idea: "${parentIdea.title}" - ${parentIdea.description}. Generate 5 new creative ideas that blend these concepts together, using both the original interest and this specific idea as inspiration. Make them feel like natural combinations or extensions that bridge both concepts.`;
      }
      
      contextualPrompt += ` Respond with JSON containing an array of ideas, each with 'title' and 'description' fields.`;

      // Use gpt-4o-mini for faster response times in explore/swipe up actions
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a creative inspiration assistant. Generate ideas that thoughtfully combine user interests with specific concepts they've shown enthusiasm for. Create ideas that feel like natural extensions bridging multiple creative concepts together."
          },
          {
            role: "user",
            content: contextualPrompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 600  // Limit tokens for faster response
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
        }, userId);
        createdIdeas.push(idea);
      }

      res.json({ ideas: createdIdeas });
    } catch (error) {
      console.error("Error exploring idea:", error);
      
      // Fallback to contextual related ideas when AI is unavailable - generate 10 ideas
      const fallbackRelatedIdeas = parentIdea.sourceContent && parentIdea.sourceContent !== "uploaded_image" 
        ? [
            {
              title: `Enhanced ${parentIdea.title}`,
              description: `Take the core concept of "${parentIdea.title}" and combine it with your original interest in "${parentIdea.sourceContent}" to create an even more personalized version.`
            },
            {
              title: `${parentIdea.sourceContent} Meets ${parentIdea.title}`,
              description: `A creative fusion that brings together your original vision for ${parentIdea.sourceContent} with the specific elements that attracted you to ${parentIdea.title}.`
            },
            {
              title: `Advanced ${parentIdea.title} Concept`,
              description: `Take this idea to the next level by incorporating advanced techniques inspired by your interest in ${parentIdea.sourceContent}.`
            },
            {
              title: `Miniature ${parentIdea.title} Version`,
              description: `Create a smaller-scale version that captures the essence of both ${parentIdea.title} and ${parentIdea.sourceContent}.`
            },
            {
              title: `Seasonal ${parentIdea.title} Variation`,
              description: `Adapt this concept to change with the seasons, incorporating elements from your original ${parentIdea.sourceContent} theme.`
            },
            {
              title: `Budget-Friendly ${parentIdea.title}`,
              description: `An affordable approach to ${parentIdea.title} that still honors your original vision for ${parentIdea.sourceContent}.`
            },
            {
              title: `Interactive ${parentIdea.title} Experience`,
              description: `Make this concept interactive and engaging, blending the best of ${parentIdea.title} with ${parentIdea.sourceContent}.`
            },
            {
              title: `Collaborative ${parentIdea.title} Project`,
              description: `Turn this into a group project where friends or family can contribute to both the ${parentIdea.title} concept and your ${parentIdea.sourceContent} interests.`
            },
            {
              title: `Digital-Physical ${parentIdea.title} Hybrid`,
              description: `Combine traditional elements of ${parentIdea.title} with modern technology, staying true to your ${parentIdea.sourceContent} vision.`
            },
            {
              title: `Next Level Creative Combination`,
              description: `Build upon both your original interest and this specific idea to create something that feels uniquely tailored to your creative vision.`
            }
          ]
        : [
            {
              title: "Expand Your Creative Vision",
              description: "Take this concept and apply it to a different room or space. Consider how the same principles could transform other areas of your home."
            },
            {
              title: "Add a Personal Touch", 
              description: "Incorporate family photos, personal artwork, or meaningful objects that reflect your personality and make the space uniquely yours."
            },
            {
              title: "Mix Textures and Materials",
              description: "Combine different textures like wood, metal, fabric, and natural elements to add depth and visual interest to your design."
            },
            {
              title: "Color Variations",
              description: "Experiment with different color palettes to see how they transform the mood and feel of this creative concept."
            },
            {
              title: "Scale It Up",
              description: "Take this idea and make it bigger and bolder, turning it into a statement piece that commands attention."
            },
            {
              title: "Miniature Version",
              description: "Create a smaller, more intimate version of this concept that works in tight spaces or as an accent piece."
            },
            {
              title: "Seasonal Adaptation",
              description: "Modify this idea to change with the seasons, keeping your space fresh and dynamic throughout the year."
            },
            {
              title: "Functional Twist",
              description: "Add practical functionality to this creative concept, making it both beautiful and useful in your daily life."
            },
            {
              title: "Collaborative Project",
              description: "Turn this into a group activity where friends or family can contribute their own creative touches and ideas."
            },
            {
              title: "Modern Technology Integration",
              description: "Incorporate smart technology or digital elements to give this traditional concept a contemporary edge."
            }
          ];

      const createdIdeas = [];
      for (const ideaData of fallbackRelatedIdeas) {
        const idea = await storage.createIdea({
          title: ideaData.title,
          description: ideaData.description,
          source: parentIdea.source,
          sourceContent: parentIdea.sourceContent,
          parentIdeaId: parentIdea.id,
          isSaved: 0,
          metadata: { 
            generatedAt: new Date().toISOString(),
            basedOn: parentIdea.id,
            type: "fallback"
          }
        });
        createdIdeas.push(idea);
      }

      res.json({ ideas: createdIdeas });
    }
  });

  // Add health check endpoint for deployment verification
  app.get('/health', (req, res) => {
    try {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {
          openai: openai ? 'available' : 'fallback_mode',
          storage: 'available',
          degraded_mode: process.env.DEGRADED_MODE === 'true'
        }
      };
      
      res.json(healthStatus);
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Add graceful error handling for server creation
  let httpServer;
  try {
    httpServer = createServer(app);
    
    // Add server error handling
    httpServer.on('error', (error) => {
      console.error('HTTP server error:', error);
    });
    
    httpServer.on('clientError', (err, socket) => {
      console.error('Client error:', err.message);
      if (!socket.destroyed) {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      }
    });
    
  } catch (error) {
    console.error('Failed to create HTTP server:', error);
    throw new Error(`Server creation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return httpServer;
}
