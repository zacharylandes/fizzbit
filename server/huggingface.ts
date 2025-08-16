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
    let imageDescription = '';
    
    // PRIMARY: Try Together.ai vision model for cost-effectiveness
    try {
      console.log('🚀 Using Together.ai vision model for image analysis...');
      
      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-Vision-Free',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Describe this image in 2-3 sentences, focusing on the main subject, colors, mood, setting, and any creative elements that could inspire ideas.'
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
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Together.ai vision API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      imageDescription = data.choices?.[0]?.message?.content || '';
      
      if (imageDescription.trim()) {
        console.log('✅ Together.ai vision analysis successful');
      } else {
        throw new Error('No description received from Together.ai vision');
      }
      
    } catch (togetherError) {
      console.warn('Together.ai vision failed, trying OpenAI vision...', (togetherError as Error).message);
      
      // FALLBACK: OpenAI vision model
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
                    text: 'Describe this image in 2-3 sentences focusing on the main subject, colors, mood, and setting.'
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
            max_tokens: 150
          })
        });

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          imageDescription = openaiData.choices[0].message.content;
          console.log('✅ OpenAI vision analysis successful (fallback)');
        }
      } catch (openaiError) {
        console.log('OpenAI vision also failed, using template fallback');
        imageDescription = 'An uploaded image with visual elements and creative potential';
      }
    }

    // Generate ideas using Together.ai for consistency
    if (imageDescription.trim()) {
      console.log('🎯 Generating ideas from image description using Together.ai...');
      const prompt = `Image analysis: ${imageDescription}. Generate creative ideas inspired by this visual content.`;
      
      // Import and use the text generation function
      const { generateIdeasFromText } = await import('./huggingface');
      return await generateIdeasFromText(prompt, count);
    }

    // Template fallback when no description available
    const imageTemplates = [
      {
        title: "Visual Art Series",
        description: "Create a series of artworks inspired by the themes and colors in this image."
      },
      {
        title: "Photo Story",
        description: "Use this image as inspiration for a creative photography project or story."
      },
      {
        title: "Color Palette Business",
        description: "Start a design business using the color scheme from this image."
      },
      {
        title: "Mood Board Creation",
        description: "Build a comprehensive mood board around the aesthetic of this image."
      },
      {
        title: "Interactive Installation",
        description: "Design an interactive art piece that captures the essence of this visual."
      },
      {
        title: "Fashion Collection",
        description: "Design a clothing line inspired by the style and colors in this image."
      },
      {
        title: "Interior Design",
        description: "Create a room design concept based on the visual elements of this image."
      },
      {
        title: "Digital Art Project",
        description: "Use this image as reference for a digital illustration or animation project."
      }
    ].slice(0, count);

    return imageTemplates.map((template, index) => ({
      id: `image-template-${Date.now()}-${index}`,
      title: template.title,
      description: template.description,
      sourceContent: "Image upload"
    }));

  } catch (error) {
    console.error('Image processing error:', error);
    
    // Ultimate fallback
    return [{
      id: `image-error-${Date.now()}`,
      title: "Creative Visual Project",
      description: "Use your uploaded image as inspiration for a creative project or artistic exploration.",
      sourceContent: "Image upload"
    }];
  }
}