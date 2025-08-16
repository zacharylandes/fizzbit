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
            content: `You are a gentle creative guide who believes everyone already has what they need to make something meaningful.

Generate exactly ${Math.min(count, 25)} inspirational creative ideas that:
1. Feel ACHIEVABLE: Could start in the next 10 minutes
2. Feel PERSONAL: Connect to universal emotions without needing personal details  
3. Feel MEANINGFUL: Create something they'll treasure, not just make for making's sake
4. Feel FLEXIBLE: Can be adapted to their skill/time/resources

Use this structure for each idea:
"1. THE MOMENT: [Relatable observation about life]
THE INVITATION: [Gentle suggestion that feels like permission, not homework]
THE SIMPLE WAY: [2-3 steps using everyday items]
THE SURPRISING PART: [Small twist that makes it special]
WHY IT MATTERS: [One sentence about what they might discover]"

Example quality:
✅ "THE MOMENT: Your phone has 10,000 photos but your walls are empty
THE INVITATION: Choose one photo from each month of last year - not the best, but the most 'Tuesday'
THE SIMPLE WAY: Print them small at any pharmacy, tape them inside your closet door
THE SURPRISING PART: The ordinary moments will matter more than the big ones
WHY IT MATTERS: You'll see your real life is already beautiful"

❌ "Create a mixed media collage exploring themes of identity using found objects"

Remember: Give them permission to be creative with what they already have, not adding to their to-do list.`
          },
          {
            role: 'user',
            content: `Context: User provided: "${prompt}"

Examples of the energy we want:
1. Input: "sunset" → "Mechanical Twilight: Build a sunset that only works when someone cries into a sensor using rusted clockwork and expired film negatives"
2. Input: "coffee" → "Sonic Brewing: Extract coffee using sound frequencies - each note unlocks different flavor compounds, performed live like a DJ set"

Generate ${Math.min(count, 25)} ideas for: "${prompt}"`
          }
        ],
        max_tokens: 3000,
        temperature: 0.7,
        top_p: 0.9
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
  
  let currentIdea = '';
  let ideaCount = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check if this is the start of a new numbered idea
    if (trimmed.match(/^\d+\.\s*/)) {
      // Process the previous idea if it exists
      if (currentIdea && ideaCount < count) {
        const parsedIdea = parseInspirationalIdea(currentIdea, ideaCount, prompt);
        if (parsedIdea) {
          ideas.push(parsedIdea);
          ideaCount++;
        }
      }
      
      // Start new idea
      currentIdea = trimmed.replace(/^\d+\.\s*/, '');
    } else if (currentIdea) {
      // Continue building current idea
      currentIdea += ' ' + trimmed;
    }
  }
  
  // Process the last idea
  if (currentIdea && ideaCount < count) {
    const parsedIdea = parseInspirationalIdea(currentIdea, ideaCount, prompt);
    if (parsedIdea) {
      ideas.push(parsedIdea);
    }
  }
  
  return ideas;
}

function parseInspirationalIdea(text: string, index: number, prompt: string): IdeaResponse | null {
  // Extract title from "THE MOMENT:" or fallback to first few words
  const momentMatch = text.match(/THE MOMENT:\s*([^\.]+)/i);
  const title = momentMatch 
    ? momentMatch[1].trim().substring(0, 50)
    : text.split(/[.!?]/)[0]?.substring(0, 50) || `Creative Moment ${index + 1}`;
  
  return {
    id: `together-${Date.now()}-${index}`,
    title: title.trim(),
    description: text.trim().substring(0, 500), // Longer for inspirational format
    sourceContent: prompt
  };
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
      
      const systemPrompt = `You are a gentle creative guide who believes everyone already has what they need to make something meaningful.

Generate exactly ${count} inspirational creative ideas that:
1. Feel ACHIEVABLE: Could start in the next 10 minutes
2. Feel PERSONAL: Connect to universal emotions without needing personal details
3. Feel MEANINGFUL: Create something they'll treasure, not just make for making's sake  
4. Feel FLEXIBLE: Can be adapted to their skill/time/resources

Format as JSON with "ideas" array containing objects with "title" and "description" fields. Each description should include:
- THE MOMENT: [Relatable observation about life]
- THE INVITATION: [Gentle suggestion that feels like permission]
- THE SIMPLE WAY: [2-3 steps using everyday items]
- THE SURPRISING PART: [Small twist that makes it special]
- WHY IT MATTERS: [One sentence about what they might discover]

Example: "THE MOMENT: Your phone has photos but your walls are empty. THE INVITATION: Choose one photo from each month of last year - not the best, but the most 'Tuesday'. THE SIMPLE WAY: Print them small at any pharmacy, tape them inside your closet door. THE SURPRISING PART: The ordinary moments will matter more than the big ones. WHY IT MATTERS: You'll see your real life is already beautiful."`;
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 3000
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
      titlePrefix: "Your phone remembers everything",
      descriptionTemplate: "THE MOMENT: Your phone remembers everything but you feel like you forget everything. THE INVITATION: Start a tiny daily practice of noticing one small thing about {topic} that usually goes unseen. THE SIMPLE WAY: Use your phone's notes app to write one sentence each day, take one photo of a detail. THE SURPRISING PART: After a week you'll have a collection that feels more real than any social media feed. WHY IT MATTERS: You'll realize you've been paying attention all along."
    },
    {
      titlePrefix: "The quiet corners",
      descriptionTemplate: "THE MOMENT: Your home has corners you never really look at, spaces that feel forgotten. THE INVITATION: Choose one overlooked corner and make it a shrine to {topic} in the gentlest way possible. THE SIMPLE WAY: Add one small object, one photo, one word written on paper each day for five days. THE SURPRISING PART: The corner will start to feel like it's been waiting for you. WHY IT MATTERS: You'll discover that making space sacred is simpler than you thought."
    },
    {
      titlePrefix: "The things you touch",
      descriptionTemplate: "THE MOMENT: You touch hundreds of objects every day but rarely pause to really feel them. THE INVITATION: Spend one minute each morning touching something related to {topic} with real attention. THE SIMPLE WAY: Close your eyes, feel the texture, temperature, weight - then write three words about what you noticed. THE SURPRISING PART: Ordinary objects will start to feel like small revelations. WHY IT MATTERS: You'll reconnect with the physical world in a gentle way."
    },
    {
      titlePrefix: "The stories behind",
      descriptionTemplate: "THE MOMENT: Every object in your home arrived there somehow, but you've forgotten most of those stories. THE INVITATION: Find three objects connected to {topic} and remember or imagine their journey to you. THE SIMPLE WAY: Write one paragraph for each - where it came from, how it found you, what it might have seen. THE SURPRISING PART: Your possessions will start to feel like old friends with secret histories. WHY IT MATTERS: You'll see that your space is already full of meaningful connections."
    },
    {
      titlePrefix: "The five-minute ritual",
      descriptionTemplate: "THE MOMENT: Your days blur together and you crave something that feels intentional but not overwhelming. THE INVITATION: Create a tiny five-minute ritual around {topic} that you can do with things you already have. THE SIMPLE WAY: Pick a consistent time, gather three simple objects, do the same gentle actions each day. THE SURPRISING PART: Five minutes will start to feel like stepping into a different world. WHY IT MATTERS: You'll discover that ritual doesn't need to be complicated to be transformative."
    },
    {
      titlePrefix: "The letters you won't send",
      descriptionTemplate: "THE MOMENT: You have thoughts about {topic} that feel too small or strange to share but too important to forget. THE INVITATION: Write letters about these thoughts to someone who would understand, even if you never send them. THE SIMPLE WAY: Use the back of old envelopes, write by hand, address them to real or imaginary people. THE SURPRISING PART: The act of addressing someone will change what you write. WHY IT MATTERS: You'll find your own voice by imagining who's listening."
    },
    {
      titlePrefix: "The sounds you make",
      descriptionTemplate: "THE MOMENT: You move through your days mostly in silence, but your voice wants to explore {topic} in ways words can't capture. THE INVITATION: Spend two minutes making sounds - humming, whispering, singing - related to how {topic} feels. THE SIMPLE WAY: Do it while walking, or in the shower, or washing dishes - let the sounds be as weird or gentle as they want to be. THE SURPRISING PART: Your voice will find rhythms you didn't know you had. WHY IT MATTERS: You'll remember that expression doesn't always need words."
    },
    {
      titlePrefix: "The gift you give yourself",
      descriptionTemplate: "THE MOMENT: You're generous with others but rarely give yourself permission to be creative just for the joy of it. THE INVITATION: Make something tiny related to {topic} as a gift to your future self. THE SIMPLE WAY: Use materials from your junk drawer, spend no money, make it small enough to fit in your pocket. THE SURPRISING PART: Making something with your hands will feel like coming home. WHY IT MATTERS: You'll remember that creativity is a form of self-kindness."
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