import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIdeaSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateIdeasFromText, generateIdeasFromImage, generateRelatedIdeas } from "./huggingface";
import { transcribeAudio } from "./whisper";
import { HfInference } from "@huggingface/inference";
import multer from "multer";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

// AI-powered creative idea generation using Together.ai, Hugging Face, and OpenAI

// Function to convert audio to WAV format using FFmpeg
const convertAudioToWav = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputPath,           // Input file
      '-acodec', 'pcm_s16le',    // Audio codec: PCM 16-bit little-endian
      '-ar', '16000',            // Sample rate: 16kHz (optimal for Whisper)
      '-ac', '1',                // Channels: mono
      '-y',                      // Overwrite output file
      outputPath                 // Output file
    ]);

    ffmpeg.stderr.on('data', (data) => {
      console.log(`FFmpeg: ${data}`);
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });
  });
};

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
        cb(new Error('Only audio files are allowed!'));
      }
    },
    limits: {
      fileSize: 25 * 1024 * 1024 // 25MB limit for audio files
    }
  });
  
  // Add global error handling middleware for async routes
  const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
    (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  
  // Generate ideas from text prompt using AI models
  app.post("/api/ideas/generate-from-text", asyncHandler(async (req: any, res) => {
    const { prompt } = req.body;
    const userId = req.user?.claims?.sub; // Get user ID if authenticated
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log('📝 Received prompt from client:', prompt);

    try {
      // Pass the original prompt directly to preserve context and maintain relevance
      console.log('🚀 Processing original prompt directly:', prompt);
      
      // Use AI models for personalized creative ideas
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
      
      // Return error instead of falling back to generic templates
      return res.status(500).json({ 
        error: "Failed to generate relevant ideas. Please try again.", 
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }));

  // Generate ideas from image using AI vision analysis
  app.post("/api/ideas/generate-from-image", asyncHandler(async (req: any, res) => {
    const { imageBase64 } = req.body;
    const userId = req.user?.claims?.sub; // Get user ID if authenticated
    
    if (!imageBase64) {
      return res.status(400).json({ error: "Image data is required" });
    }

    try {
      // Use AI vision models for visual analysis and creative ideas
      const ideas = await generateIdeasFromImage(imageBase64);

      // Store generated ideas
      const createdIdeas = [];
      for (const ideaData of ideas) {
        const idea = await storage.createIdea({
          title: ideaData.title,
          description: ideaData.description,
          source: "image",
          sourceContent: `Image uploaded at ${new Date().toISOString()}`,
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
          sourceContent: `Image fallback at ${new Date().toISOString()}`,
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

  // Generate ideas from drawing using same image analysis but different source tracking
  app.post("/api/ideas/generate-from-drawing", asyncHandler(async (req: any, res) => {
    const { imageBase64 } = req.body;
    const userId = req.user?.claims?.sub; // Get user ID if authenticated
    
    if (!imageBase64) {
      return res.status(400).json({ error: "Drawing data is required" });
    }

    try {
      // Use same image processing as uploads but mark as drawing
      const ideas = await generateIdeasFromImage(imageBase64);

      // Store generated ideas with drawing-specific metadata
      const createdIdeas = [];
      for (const ideaData of ideas) {
        const idea = await storage.createIdea({
          title: ideaData.title,
          description: ideaData.description,
          source: "drawing",
          sourceContent: `Drawing created at ${new Date().toISOString()}`,
          isSaved: 0,
          metadata: { 
            generatedAt: new Date().toISOString(),
            inputType: "drawing"
          }
        }, userId);
        createdIdeas.push(idea);
      }

      res.json({ ideas: createdIdeas });
    } catch (error) {
      console.error("Error generating ideas from drawing:", error);
      
      // Specific fallback for drawing errors
      const fallbackIdeas = [
        {
          title: "Sketch Development",
          description: "Develop your sketch into a more detailed artwork using different mediums and techniques."
        },
        {
          title: "Abstract Interpretation",
          description: "Create an abstract interpretation of your drawing using colors, shapes, and movement."
        },
        {
          title: "Digital Art Project",
          description: "Transform your sketch into a digital art piece using design software and creative effects."
        }
      ];

      const createdIdeas = [];
      for (const ideaData of fallbackIdeas) {
        const idea = await storage.createIdea({
          title: ideaData.title,
          description: ideaData.description,
          source: "drawing",
          sourceContent: `Drawing fallback at ${new Date().toISOString()}`,
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

  // Speech transcription using OpenAI Whisper (standalone endpoint)
  app.post("/api/speech/transcribe", upload.single('audio'), asyncHandler(async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    try {
      console.log('🎤 DEBUGGING - Raw file info:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        encoding: req.file.encoding,
        fieldname: req.file.fieldname
      });
      
      // Check if original file exists and has content
      if (!fs.existsSync(req.file.path)) {
        throw new Error(`Original file doesn't exist at path: ${req.file.path}`);
      }
      
      const originalStats = fs.statSync(req.file.path);
      console.log('🎤 DEBUGGING - Original file stats:', {
        size: originalStats.size,
        isFile: originalStats.isFile()
      });
      
      // Determine proper file extension based on mimetype
      let fileExtension = '.webm';
      if (req.file.mimetype.includes('wav')) {
        fileExtension = '.wav';
      } else if (req.file.mimetype.includes('mp4')) {
        fileExtension = '.mp4';
      } else if (req.file.mimetype.includes('ogg')) {
        fileExtension = '.ogg';
      } else if (req.file.mimetype.includes('webm')) {
        fileExtension = '.webm';
      }
      
      console.log('🎤 DEBUGGING - Determined file extension:', fileExtension, 'based on mimetype:', req.file.mimetype);
      
      // First try: Direct transcription with proper extension
      const directPath = req.file.path + fileExtension;
      console.log('🎤 DEBUGGING - Renaming file from:', req.file.path, 'to:', directPath);
      
      fs.renameSync(req.file.path, directPath);
      
      // Verify the renamed file exists and has content
      if (!fs.existsSync(directPath)) {
        throw new Error(`Renamed file doesn't exist at path: ${directPath}`);
      }
      
      const renamedStats = fs.statSync(directPath);
      console.log('🎤 DEBUGGING - Renamed file stats:', {
        path: directPath,
        size: renamedStats.size,
        isFile: renamedStats.isFile()
      });
      
      // Read first few bytes to check file header
      const buffer = fs.readFileSync(directPath).slice(0, 20);
      console.log('🎤 DEBUGGING - File header bytes:', Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
      try {
        console.log('🎤 DEBUGGING - Attempting direct transcription with file:', directPath);
        const result = await transcribeAudio(directPath);
        
        console.log('🎤 DEBUGGING - Direct transcription SUCCESS:', {
          text: result.text,
          duration: result.duration
        });
        
        // Clean up file
        fs.unlinkSync(directPath);
        
        res.json({
          text: result.text,
          duration: result.duration
        });
        
      } catch (directError) {
        console.log('🎤 DEBUGGING - Direct transcription FAILED:', directError.message);
        
        // Second try: Convert to WAV format
        const wavPath = req.file.path + '.wav';
        
        try {
          await convertAudioToWav(directPath, wavPath);
          console.log('🎤 Successfully converted audio to WAV format:', wavPath);
          
          const result = await transcribeAudio(wavPath);
          
          // Clean up both files
          fs.unlinkSync(directPath);
          fs.unlinkSync(wavPath);
          
          res.json({
            text: result.text,
            duration: result.duration
          });
          
        } catch (wavError) {
          // Final fallback: Try with .mp3 extension
          console.log('WAV conversion failed, trying MP3 format...');
          const mp3Path = req.file.path + '.mp3';
          fs.renameSync(directPath, mp3Path);
          
          try {
            const result = await transcribeAudio(mp3Path);
            fs.unlinkSync(mp3Path);
            
            res.json({
              text: result.text,
              duration: result.duration
            });
          } catch (mp3Error) {
            fs.unlinkSync(mp3Path);
            throw mp3Error;
          }
        }
      }
    } catch (error) {
      console.error('Speech transcription failed:', error);
      
      // Clean up uploaded files on error
      if (req.file) {
        const possibleFiles = [
          req.file.path, 
          req.file.path + '.wav', 
          req.file.path + '.webm', 
          req.file.path + '.mp4', 
          req.file.path + '.ogg'
        ];
        possibleFiles.forEach(filePath => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
      
      res.status(500).json({ 
        error: 'Speech transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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
      
      // Transcribe audio using Hugging Face Whisper model (free alternative)
      let transcriptionText = '';
      
      try {
        // Convert audio to WAV format for better compatibility
        const wavPath = req.file.path + '.wav';
        await convertAudioToWav(req.file.path, wavPath);
        
        // Read the audio file as buffer for Hugging Face
        const audioBuffer = fs.readFileSync(wavPath);
        
        // Try multiple Hugging Face speech-to-text models
        const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);
        let transcriptionResult;
        const speechModels = [
          'facebook/wav2vec2-base-960h',
          'facebook/wav2vec2-large-960h-lv60-self',
          'openai/whisper-tiny'
        ];
        
        for (const model of speechModels) {
          try {
            transcriptionResult = await hf.automaticSpeechRecognition({
              data: audioBuffer,
              model: model,
            });
            console.log(`Successfully transcribed using ${model}`);
            break;
          } catch (modelError) {
            console.log(`Model ${model} failed, trying next...`);
            continue;
          }
        }
        
        transcriptionText = transcriptionResult?.text || '';
        
        // If no model worked, provide a helpful fallback
        if (!transcriptionResult) {
          throw new Error('All speech-to-text models unavailable');
        }
        
        // Clean up files
        if (fs.existsSync(wavPath)) {
          fs.unlinkSync(wavPath);
        }
        fs.unlinkSync(req.file.path);
        
        console.log('📝 Transcription result:', transcriptionText);
        
      } catch (transcriptionError) {
        console.error('Hugging Face transcription failed:', transcriptionError);
        
        // Clean up files on error
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        // Return a helpful error suggesting client-side alternatives
        return res.status(503).json({ 
          error: "Speech-to-text service temporarily unavailable. Please try typing your idea or try again later.",
          fallback: "text_input_suggested" 
        });
      }
      
      if (!transcriptionText || transcriptionText.trim().length === 0) {
        return res.status(400).json({ error: "Could not transcribe audio. Please try speaking more clearly." });
      }

      // Generate ideas from the actual transcribed text with enhanced prompt
      const enhancedPrompt = `give me unique ideas that avoid the obvious for ${transcriptionText}`;
      const ideas = await generateIdeasFromText(enhancedPrompt);

      // Store generated ideas
      const createdIdeas = [];
      for (const ideaData of ideas) {
        const idea = await storage.createIdea({
          title: ideaData.title,
          description: ideaData.description,
          source: "audio",
          sourceContent: transcriptionText,
          isSaved: 0,
          metadata: { 
            generatedAt: new Date().toISOString(),
            transcribedText: transcriptionText,
            inputType: "voice"
          }
        }, userId);
        createdIdeas.push(idea);
      }

      res.json({ 
        ideas: createdIdeas,
        transcription: transcriptionText 
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
      // Use Hugging Face models for idea exploration

      // Create a more targeted prompt by combining original user intent with the specific idea they're interested in
      let contextualPrompt = `Generate 5 new creative ideas inspired by this existing idea: "${parentIdea.title}" - ${parentIdea.description}.`;
      
      // If we have the original prompt/search context, combine it for better targeting
      if (parentIdea.sourceContent && parentIdea.sourceContent !== "uploaded_image") {
        contextualPrompt = `The user originally was interested in: "${parentIdea.sourceContent}". They then showed particular interest in this idea: "${parentIdea.title}" - ${parentIdea.description}. Generate 5 new creative ideas that blend these concepts together, using both the original interest and this specific idea as inspiration. Make them feel like natural combinations or extensions that bridge both concepts.`;
      }
      
      contextualPrompt += ` Respond with JSON containing an array of ideas, each with 'title' and 'description' fields.`;

      // Use gpt-4o-mini for faster response times in explore/swipe up actions
      // Use AI models for reliable related idea generation
      const relatedIdeas = await generateRelatedIdeas(contextualPrompt, 3);
      
      if (relatedIdeas.length > 0) {
        const createdIdeas = [];
        for (const ideaData of relatedIdeas) {
          const newIdea = await storage.createIdea({
            title: ideaData.title,
            description: ideaData.description,
            source: "exploration",
            sourceContent: `Related to: ${parentIdea.title}`,
            isSaved: 0,
            metadata: { 
              exploredFrom: id,
              generatedAt: new Date().toISOString()
            }
          }, userId);
          createdIdeas.push(newIdea);
        }

        return res.json({ ideas: createdIdeas });
      }

      // Fallback to template-based ideas if Hugging Face fails
      console.log('Hugging Face related ideas failed, using template fallback...');
      const templateIdeas = [
        {
          title: `${parentIdea.title} Remix`,
          description: `Take the core concept of "${parentIdea.title}" and apply it to a completely different medium or context.`
        },
        {
          title: `Interactive ${parentIdea.title}`,
          description: `Transform "${parentIdea.title}" into an interactive experience that engages multiple senses.`
        },
        {
          title: `Collaborative ${parentIdea.title}`,
          description: `Reimagine "${parentIdea.title}" as a community-driven project that brings people together.`
        }
      ];

      // Store generated ideas with parent reference
      const createdIdeas = [];
      for (const ideaData of templateIdeas) {
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
          huggingface: process.env.HUGGINGFACE_TOKEN ? 'available' : 'fallback_mode',
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
