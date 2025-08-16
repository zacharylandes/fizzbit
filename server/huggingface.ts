import { HfInference } from '@huggingface/inference';
import OpenAI from 'openai';

if (!process.env.TOGETHER_API_KEY) {
  throw new Error('TOGETHER_API_KEY is required');
}

// Keep OpenAI and HF as fallbacks
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const hf = process.env.HUGGINGFACE_TOKEN ? new HfInference(process.env.HUGGINGFACE_TOKEN) : null;

export interface IdeaResponse {
  id: string;
  title: string;
  description: string;
  sourceContent?: string;
}

// Use Flan-T5 which has reliable text-generation support across providers
const TEXT_MODEL = 'google/flan-t5-large';

// Helper function to parse text-based responses from Mistral
function parseTextResponse(text: string, count: number, prompt: string): IdeaResponse[] {
  const ideas: IdeaResponse[] = [];
  
  // Try to extract ideas from various text formats
  const lines = text.split('\n').filter(line => line.trim());
  let currentIdea: Partial<IdeaResponse> = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Look for title patterns
    if (trimmed.match(/^\d+\.|^-|^\*|^Title:|^Idea \d+:/i)) {
      if (currentIdea.title && currentIdea.description) {
        ideas.push({
          id: `t5-parsed-${Date.now()}-${ideas.length}`,
          title: currentIdea.title,
          description: currentIdea.description,
          sourceContent: prompt
        });
        currentIdea = {};
      }
      
      // Extract title
      currentIdea.title = trimmed
        .replace(/^\d+\.|^-|^\*|^Title:|^Idea \d+:/i, '')
        .trim()
        .split(':')[0]
        .substring(0, 50);
    } else if (trimmed.length > 20 && !currentIdea.description) {
      // This looks like a description
      currentIdea.description = trimmed.substring(0, 200);
    }
  }
  
  // Add the last idea if it exists
  if (currentIdea.title && currentIdea.description) {
    ideas.push({
      id: `t5-parsed-${Date.now()}-${ideas.length}`,
      title: currentIdea.title,
      description: currentIdea.description,
      sourceContent: prompt
    });
  }
  
  return ideas.slice(0, count);
}

// Helper function to generate related ideas using Hugging Face models
export async function generateRelatedIdeas(contextualPrompt: string, count: number = 3): Promise<IdeaResponse[]> {
  try {
    console.log('Using Hugging Face for related ideas...');
    
    const prompt = `Generate ${count} related creative ideas for: ${contextualPrompt}\n\nHere are ${count} related creative ideas:\n\n`;
    
    const result = await hf!.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.1',
      inputs: prompt,
      parameters: {
        max_new_tokens: 300,
        temperature: 0.7,
        top_p: 0.9,
        return_full_text: false
      }
    });
    
    if (result.generated_text) {
      const ideas = parseTextResponse(result.generated_text, count, contextualPrompt);
      if (ideas.length > 0) {
        return ideas.map(idea => ({
          ...idea,
          id: `hf-related-${Date.now()}-${ideas.indexOf(idea)}`,
          sourceContent: 'Related ideas'
        }));
      }
    }

    return [];
  } catch (error) {
    console.error('Hugging Face related ideas generation failed:', error);
    return [];
  }
}

// Together.ai API function for cost-effective idea generation
async function generateWithTogetherAI(prompt: string, count: number): Promise<IdeaResponse[]> {
  try {
    console.log('🚀 Using Together.ai Llama-3.2-3B-Instruct-Turbo for cost-effective generation...');
    
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
        messages: [
          {
            role: 'system',
            content: `You are a creative idea generator. Always return exactly ${Math.min(count, 25)} ideas in a numbered list format. They should be interesting and unique. Some should be related to art/music/food, others should be related to business ideas and others related to health and wellness, meditation or plants. Format each as: "1. [Title]: [Description]"`
          },
          {
            role: 'user',
            content: `Generate ${Math.min(count, 25)} creative ideas inspired by: ${prompt}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`Together.ai API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from Together.ai');
    }

    console.log('🚀 Together.ai response received, parsing ideas...');
    const ideas = parseTogetherAIResponse(content, count, prompt);
    
    if (ideas.length > 0) {
      console.log(`✅ Successfully generated ${ideas.length} ideas using Together.ai Llama`);
      return ideas;
    }
    
    throw new Error('No valid ideas parsed from Together.ai response');
  } catch (error) {
    console.error('Together.ai generation failed:', (error as Error).message);
    throw error;
  }
}

// Parse Together.ai numbered list response
function parseTogetherAIResponse(text: string, count: number, prompt: string): IdeaResponse[] {
  const ideas: IdeaResponse[] = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Look for numbered list format: "1. Title: Description" or "1. Title - Description"
    const match = trimmed.match(/^\d+\.\s*([^::\-]+)[:\-]\s*(.+)$/);
    if (match) {
      const [, title, description] = match;
      ideas.push({
        id: `together-${Date.now()}-${ideas.length}`,
        title: title.trim().substring(0, 50),
        description: description.trim().substring(0, 200),
        sourceContent: prompt
      });
    }
    // Alternative format: just numbered items without colons
    else if (trimmed.match(/^\d+\.\s*(.+)$/)) {
      const content = trimmed.replace(/^\d+\.\s*/, '').trim();
      // Try to split on first sentence for title/description
      const sentences = content.split(/[.!?]+/);
      const title = sentences[0]?.substring(0, 50) || `Idea ${ideas.length + 1}`;
      const description = sentences.slice(1).join('. ').trim() || content;
      
      ideas.push({
        id: `together-${Date.now()}-${ideas.length}`,
        title: title.trim(),
        description: description.substring(0, 200) || title,
        sourceContent: prompt
      });
    }
    
    if (ideas.length >= count) break;
  }
  
  return ideas;
}

export async function generateIdeasFromText(prompt: string, count: number = 25): Promise<IdeaResponse[]> {
  // PRIMARY: Use Together.ai for cost-effective idea generation
  try {
    const ideas = await generateWithTogetherAI(prompt, count);
    if (ideas.length > 0) {
      return ideas;
    }
  } catch (error) {
    console.warn('Together.ai failed, trying fallback options:', (error as Error).message);
  }
  // FALLBACK 1: OpenAI if available
  if (openai) {
    try {
      console.log('🤖 Using OpenAI GPT-4o-mini as fallback...');
      
      const systemPrompt = `You are a creative idea generator. Using the user's specific prompt as your foundation, generate exactly ${count} diverse creative ideas that are directly related to their interest. Generate ideas across these categories: unusual business concepts, creative plays/sitcoms, food recipes, and fine art projects. All ideas must be clearly connected to and inspired by the user's specific prompt. Format as JSON with "ideas" array containing objects with "title", "description", and "category" fields. Make titles concise (max 6 words) and descriptions detailed but under 100 words.`;
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 1200
      });

      const responseText = completion.choices[0].message.content;
      if (responseText) {
        try {
          const jsonResponse = JSON.parse(responseText);
          let ideas: any[] = [];
          
          if (Array.isArray(jsonResponse)) {
            ideas = jsonResponse;
          } else if (jsonResponse.ideas && Array.isArray(jsonResponse.ideas)) {
            ideas = jsonResponse.ideas;
          } else if (jsonResponse.suggestions && Array.isArray(jsonResponse.suggestions)) {
            ideas = jsonResponse.suggestions;
          }

          const formattedIdeas = ideas.slice(0, count).map((idea, index) => ({
            id: `openai-fallback-${Date.now()}-${index}`,
            title: idea.title || `Idea ${index + 1}`,
            description: idea.description || idea.content || 'Creative idea generated for you.'
          }));

          if (formattedIdeas.length > 0) {
            console.log(`✅ Generated ${formattedIdeas.length} ideas using OpenAI (fallback)`);
            return formattedIdeas;
          }
        } catch (parseError) {
          console.error('Failed to parse OpenAI JSON response:', parseError);
          const ideas = parseTextResponse(responseText, count, prompt);
          if (ideas.length > 0) {
            console.log(`✅ Generated ${ideas.length} ideas using OpenAI text parsing`);
            return ideas;
          }
        }
      }
    } catch (error) {
      console.error('OpenAI fallback failed:', error);
    }
  }

  // Fall back to creative templates when OpenAI fails completely
  console.log('OpenAI text generation failed, falling back to creative templates');
  
  const ideaTemplates = [
    {
      titlePrefix: "Unusual Business:",
      descriptionTemplate: "Launch a unique service where customers pay to {topic} in unexpected ways. Think subscription boxes for niche interests, reverse marketplaces, or services that solve problems people didn't know they had."
    },
    {
      titlePrefix: "Pop-Up Experience:",
      descriptionTemplate: "Create temporary experiences around {topic} - popup restaurants with themed menus, nomadic workshops, or traveling installations that bring unusual concepts directly to communities."
    },
    {
      titlePrefix: "Comedy Series:",
      descriptionTemplate: "A sitcom where characters must navigate daily life while dealing with {topic} in the most ridiculous ways. Each episode features misunderstandings, mishaps, and heartwarming moments."
    },
    {
      titlePrefix: "Fusion Dish:",
      descriptionTemplate: "Combine unexpected flavors inspired by {topic} to create a dish that surprises and delights. Use unconventional ingredients, unique cooking methods, or creative presentation."
    },
    {
      titlePrefix: "Mixed Media Installation:",
      descriptionTemplate: "Create an immersive art piece using {topic} as inspiration. Combine traditional materials with technology, found objects, or interactive elements that invite viewer participation."
    },
    {
      titlePrefix: "Interactive Workshop:",
      descriptionTemplate: "Design a hands-on workshop around {topic} that includes collaborative activities, skill-building exercises, and creative exploration for participants."
    },
    {
      titlePrefix: "Community Project:",
      descriptionTemplate: "Start a community initiative focused on {topic}. Bring people together through shared goals, creative challenges, and collaborative creation."
    },
    {
      titlePrefix: "Digital Experience:",
      descriptionTemplate: "Create a multimedia project around {topic} that combines technology, storytelling, and user interaction to build an engaging experience."
    }
  ];

  const shuffledTemplates = [...ideaTemplates].sort(() => Math.random() - 0.5);
  const selectedTemplates = shuffledTemplates.slice(0, count);
  
  const ideas = selectedTemplates.map((template, index) => {
    const topic = prompt.toLowerCase();
    return {
      id: `template-${Date.now()}-${index}`,
      title: template.titlePrefix.replace(':', ''),
      description: template.descriptionTemplate.replace(/\{topic\}/g, topic),
      sourceContent: prompt
    };
  });

  console.log(`Fallback: Generated ${ideas.length} template-based ideas`);
  return ideas;
}

export async function generateIdeasFromImage(imageBase64: string, count: number = 25): Promise<IdeaResponse[]> {
  try {
    // First try Hugging Face image analysis
    let imageDescription = '';
    
    try {
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      if (!hf) {
        throw new Error('Hugging Face not available');
      }
      const hfResult = await hf.imageToText({
        data: imageBuffer,
        model: 'Salesforce/blip-image-captioning-large',
      });
      imageDescription = hfResult.generated_text || '';
    } catch (hfError) {
      console.log('Hugging Face image analysis failed, trying OpenAI vision...');
      
      // Fallback to OpenAI vision model
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Describe this image in 1-2 sentences focusing on the main subject, colors, mood, and setting.'
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${imageBase64}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 100
          })
        });

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          imageDescription = openaiData.choices[0].message.content;
        }
      } catch (openaiError) {
        console.log('OpenAI vision also failed, using generic image-based ideas');
      }
    }

    // Generate ideas based on the image analysis (or generic if analysis failed)
    if (imageDescription.trim()) {
      // Use OpenAI directly for reliable idea generation based on image
      console.log('Using OpenAI for image-based idea generation...');

      // Fallback to OpenAI if Llama 3 fails
      try {
        const openaiIdeaResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `You are a creative idea generator. Parse the user's request for specific categories and generate exactly ${count} ideas total (repeat the pattern): 3 unusual business concepts, 2 creative plays/sitcoms, 2 food recipes, 2 fine art projects, then repeat this pattern until you reach ${count} total ideas. Present them in random order. Format as JSON with "ideas" array containing objects with "title", "description", and "category" fields. Make titles concise (max 6 words) and descriptions detailed but under 100 words.`
              },
              {
                role: 'user',
                content: `using the prompt "${imageDescription}" as inspiration, provide me 3 ideas for an unusual business concept, 2 ideas for a creative and unusual play or sitcom, 2 ideas for a food recipe, and 2 ideas for a fine art project, the ideas will be sorted randomly`
              }
            ],
            max_tokens: 3000,
            temperature: 0.9,
            response_format: { type: "json_object" }
          })
        });

        if (openaiIdeaResponse.ok) {
          const openaiIdeaData = await openaiIdeaResponse.json();
          const content = openaiIdeaData.choices[0].message.content;
          
          try {
            const parsed = JSON.parse(content);
            if (parsed.ideas && Array.isArray(parsed.ideas)) {
              return parsed.ideas.map((idea: any, index: number) => ({
                id: `openai-img-fallback-${Date.now()}-${index}`,
                title: idea.title || `Creative Idea ${index + 1}`,
                description: idea.description || 'A creative project inspired by your image.',
                sourceContent: `Image: ${imageDescription}`
              }));
            }
          } catch (parseError) {
            console.error('Failed to parse OpenAI idea response:', parseError);
          }
        }
      } catch (error) {
        console.error('OpenAI idea generation failed:', error);
      }

      // Fallback to template-based unique ideas if OpenAI fails
      const personalizedTemplates = [
        {
          title: "Artistic Recreation",
          description: `Recreate this scene using watercolor, oil paint, or digital art. Focus on capturing the mood and lighting you see.`
        },
        {
          title: "Story Writing",
          description: `Write a short story or screenplay inspired by this moment. What led to this scene? What happens next?`
        },
        {
          title: "Color Palette Design",
          description: `Extract the dominant colors and create a design project - room decor, fashion collection, or brand identity.`
        },
        {
          title: "Photography Series",
          description: `Shoot a series of photos exploring the same theme, location type, or emotional tone as this image.`
        },
        {
          title: "Mixed Media Art",
          description: `Combine photography, painting, and text to create a layered artwork that expands on this visual concept.`
        },
        {
          title: "Minimalist Interpretation",
          description: `Reduce this scene to its essential elements using simple shapes, lines, and limited colors.`
        },
        {
          title: "Different Time Period",
          description: `Reimagine this scene in a different era - how would it look 50 years ago or 50 years from now?`
        },
        {
          title: "Interactive Experience",
          description: `Design an immersive installation or digital experience that lets people step into this world.`
        }
      ].slice(0, count);

      return personalizedTemplates.map((template, index) => ({
        id: `analyzed-img-${Date.now()}-${index}`,
        title: template.title,
        description: template.description,
        sourceContent: `Image: ${imageDescription}`
      }));
    } else {
      // Fallback generic image-inspired ideas - expand to 8
      const genericTemplates = [
        {
          title: "Visual Storytelling Project",
          description: "Create a series of images or artwork that tells a story inspired by your uploaded photo. Focus on the emotions, colors, and mood you captured."
        },
        {
          title: "Photo Recreation Challenge", 
          description: "Recreate your image using a completely different medium - paint, digital art, sculpture, or mixed media. Explore how the same concept translates across art forms."
        },
        {
          title: "Inspired Color Palette",
          description: "Extract the dominant colors from your image and use them as inspiration for a new creative project - room design, fashion outfit, or artistic composition."
        },
        {
          title: "Abstract Interpretation",
          description: "Transform your photo into an abstract artwork focusing on shapes, patterns, and emotional resonance rather than literal representation."
        },
        {
          title: "Time-lapse Concept",
          description: "Create a time-based project showing how the scene in your photo might change over hours, days, seasons, or years."
        },
        {
          title: "Texture and Material Study",
          description: "Focus on the textures and materials visible in your image to inspire a tactile art project using fabric, clay, metal, or natural materials."
        },
        {
          title: "Lighting Experiment",
          description: "Explore how different lighting conditions would change the mood and impact of your image through photography, digital art, or installation."
        },
        {
          title: "Community Art Project",
          description: "Use your image as inspiration for a collaborative artwork where others can contribute their own interpretations or additions."
        }
      ].slice(0, count);

      return genericTemplates.map((template, index) => ({
        id: `generic-img-${Date.now()}-${index}`,
        title: template.title,
        description: template.description,
        sourceContent: "Image upload"
      }));
    }

  } catch (error) {
    console.error('Image processing error:', error);
    
    // Fallback response if API fails
    return [
      {
        id: `img-fallback-${Date.now()}-1`,
        title: "Visual Art Project",
        description: "Create an artistic interpretation or series inspired by the visual elements in your image. Explore different mediums and techniques."
      },
      {
        id: `img-fallback-${Date.now()}-2`,
        title: "Story Behind the Scene", 
        description: "Develop a compelling narrative or backstory based on what you see in the image. Turn it into a short story, video, or interactive experience."
      },
      {
        id: `img-fallback-${Date.now()}-3`,
        title: "Educational Experience",
        description: "Design a learning experience that uses your image as inspiration. Create tutorials, workshops, or educational content around the themes you observe."
      }
    ];
  }
}