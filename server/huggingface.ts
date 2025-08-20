import { HfInference } from '@huggingface/inference';
import OpenAI from 'openai';

// Function to generate system prompt based on creativity weights
function generateSystemPrompt(count: number, creativityWeights?: any): string {
  if (!creativityWeights) {
    // Default prompt when no weights provided
    return `Generate ${Math.min(count, 25)} compelling creative ideas. If it's a story/character concept, give plot and dramatic scenarios. If it's visual, give art projects. If it's abstract, give creative exercises. Always make the ideas directly about the user input - be imaginative but clear and actionable.

Format each as:
1. TITLE: [2-4 intriguing words]
IDEA: [One clear sentence that directly explores the user input]
HOOK: [What makes this interesting]

Example for "play about old man from future":
1. TITLE: Timeline Confusion
IDEA: The old man's "future memories" start coming true in real time during the performance, confusing both characters and audience about what's scripted
HOOK: Blurs line between theater and reality`;
  }

  const { wild = 0.33, actionable = 0.33, deep = 0.34 } = creativityWeights;
  
  // Build style guidance based on blend
  let styleGuide = "";
  let hookGuide = "";
  
  if (wild > 0.6) {
    styleGuide = "Be experimental, surreal, and boundary-pushing. Break rules and explore the absurd.";
    hookGuide = "What makes this delightfully strange or rule-breaking";
  } else if (actionable > 0.6) {
    styleGuide = "Be practical, immediate, and doable. Focus on quick wins and simple daily practices.";
    hookGuide = "Why this small action creates momentum or immediate satisfaction";
  } else if (deep > 0.6) {
    styleGuide = "Be substantial, meaningful, and project-oriented. Think long-term creative endeavors.";
    hookGuide = "What makes this worth the sustained effort and what you'll gain";
  } else {
    // Blended approach
    const styles = [];
    if (wild > 0.2) styles.push(`${Math.round(wild * 100)}% experimental/surreal`);
    if (actionable > 0.2) styles.push(`${Math.round(actionable * 100)}% practical/immediate`);
    if (deep > 0.2) styles.push(`${Math.round(deep * 100)}% substantial/long-term`);
    
    styleGuide = `Blend these creative approaches: ${styles.join(', ')}. `;
    hookGuide = "What makes this interesting given the creative blend";
  }
  
  // Time scope based on weights
  let timeScope = "";
  if (actionable > 0.4) {
    timeScope = "Each idea should be startable today or completable in 5-30 minutes. ";
  } else if (deep > 0.4) {
    timeScope = "Each idea should be a multi-week or multi-month journey. ";
  } else if (wild > 0.4) {
    timeScope = "Focus on imaginative leaps regardless of time commitment. ";
  } else {
    timeScope = "Mix time commitments from quick wins to longer projects. ";
  }

  return `Generate ${Math.min(count, 25)} compelling creative ideas using this creative blend:

STYLE BLEND: ${styleGuide}
TIME SCOPE: ${timeScope}
CREATIVE MIX: ${Math.round(wild * 100)}% Wild Inspiration + ${Math.round(actionable * 100)}% Daily Actionable + ${Math.round(deep * 100)}% Deep Projects

Always make the ideas directly about the user input - be imaginative but clear and actionable for the given blend.

Format each as:
1. TITLE: [2-4 intriguing words]
IDEA: [One clear sentence that explores the user input through this creative lens]
HOOK: [${hookGuide}]

Example for "learning piano" with 60% actionable, 30% deep, 10% wild:
1. TITLE: Daily Chord Victory
IDEA: Learn one new chord each morning and immediately play a simple song that uses it before breakfast
HOOK: Builds piano skills through tiny daily wins that create instant musical satisfaction`;
}

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
async function generateWithTogetherAI(prompt: string, count: number, creativityWeights?: any): Promise<IdeaResponse[]> {
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
            content: generateSystemPrompt(count, creativityWeights)
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
        temperature: 0.9,
        presence_penalty: 0.6,
        frequency_penalty: 0.6
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
  
  let currentIdea: { title?: string; idea?: string; hook?: string } = {};
  let ideaCount = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check for numbered start (reset current idea)
    if (trimmed.match(/^\d+\.\s*/)) {
      // Process previous idea if complete
      if (currentIdea.title && currentIdea.idea && ideaCount < count) {
        const description = `${currentIdea.idea}${currentIdea.hook ? ` - ${currentIdea.hook}` : ''}`;
        ideas.push({
          id: `together-${Date.now()}-${ideaCount}`,
          title: currentIdea.title.substring(0, 60),
          description: description.substring(0, 400),
          sourceContent: prompt
        });
        ideaCount++;
      }
      
      // Start new idea
      currentIdea = {};
      const content = trimmed.replace(/^\d+\.\s*/, '');
      
      // Check if TITLE is on the same line
      const titleMatch = content.match(/TITLE:\s*(.+)/i);
      if (titleMatch) {
        currentIdea.title = titleMatch[1].trim();
      }
    }
    // Look for TITLE, IDEA, HOOK sections
    else if (trimmed.match(/^TITLE:\s*/i)) {
      currentIdea.title = trimmed.replace(/^TITLE:\s*/i, '').trim();
    }
    else if (trimmed.match(/^IDEA:\s*/i)) {
      currentIdea.idea = trimmed.replace(/^IDEA:\s*/i, '').trim();
    }
    else if (trimmed.match(/^HOOK:\s*/i)) {
      currentIdea.hook = trimmed.replace(/^HOOK:\s*/i, '').trim();
    }
    // Support legacy TWIST format
    else if (trimmed.match(/^TWIST:\s*/i)) {
      currentIdea.hook = trimmed.replace(/^TWIST:\s*/i, '').trim();
    }
    // Fallback: parse old format
    else if (trimmed.includes(':') && !currentIdea.title) {
      const colonSplit = trimmed.split(':');
      if (colonSplit.length > 1) {
        currentIdea.title = colonSplit[0].trim();
        currentIdea.idea = colonSplit.slice(1).join(':').trim();
      }
    }
  }
  
  // Process last idea
  if (currentIdea.title && currentIdea.idea && ideaCount < count) {
    const description = `${currentIdea.idea}${currentIdea.hook ? ` - ${currentIdea.hook}` : ''}`;
    ideas.push({
      id: `together-${Date.now()}-${ideaCount}`,
      title: currentIdea.title.substring(0, 60),
      description: description.substring(0, 400),
      sourceContent: prompt
    });
  }
  
  return ideas;
}

export async function generateIdeasFromText(prompt: string, creativityWeights?: any, count: number = 25): Promise<IdeaResponse[]> {
  // PRIMARY: Use Together.ai for cost-effective idea generation
  try {
    const ideas = await generateWithTogetherAI(prompt, count, creativityWeights);
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
      
      const systemPrompt = generateSystemPrompt(count, creativityWeights).replace(/Format each as:\n1\. TITLE:.*$/s, 'Format as JSON with "ideas" array containing objects with "title" and "description" fields.');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.9,
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
      titlePrefix: "Sonic Archaeology:",
      descriptionTemplate: "Map the hidden sounds of {topic} using contact microphones and rusted metal recording devices - each vibration tells a forgotten story. Inspired by Janet Cardiff's sound walks. What if you also broadcast findings on pirate radio? Vibe: nostalgic, rebellious, scientific."
    },
    {
      titlePrefix: "Temporal Taste:",
      descriptionTemplate: "Create a dish where {topic} flavors only emerge when eaten at specific times of day, using thermochromic spices and sundial plating. Inspired by Ferran Adrià's molecular gastronomy. What if you also served it in complete darkness? Vibe: mysterious, precise, ephemeral."
    },
    {
      titlePrefix: "Ghost Commerce:",
      descriptionTemplate: "Build a business around {topic} that only operates during solar eclipses, using vintage typewriters for transactions and handwritten contracts on rice paper. Inspired by Yves Klein's art happening philosophy. What if customers paid in handmade objects? Vibe: ceremonial, exclusive, surreal."
    },
    {
      titlePrefix: "Breath Mapping:",
      descriptionTemplate: "Document {topic} through the breathing patterns of strangers, using antique spirometry equipment and creating wearable lung sculptures. Inspired by Felix Gonzalez-Torres' breath works. What if you also composed music from the rhythm data? Vibe: intimate, scientific, meditative."
    },
    {
      titlePrefix: "Memory Palace:",
      descriptionTemplate: "Transform {topic} into a physical maze where visitors can only navigate using childhood memories, built with salvaged playground equipment and smell-triggered pathways. Inspired by Sophie Calle's autobiographical investigations. What if you also recorded people's stories? Vibe: nostalgic, disorienting, therapeutic."
    },
    {
      titlePrefix: "Decay Ballet:",
      descriptionTemplate: "Choreograph a performance where {topic} slowly decomposes during the show, using organic materials and time-lapse projection. Inspired by Tino Sehgal's constructed situations. What if the audience had to help rebuild it? Vibe: morbid, beautiful, participatory."
    },
    {
      titlePrefix: "Frequency Garden:",
      descriptionTemplate: "Grow plants that respond to {topic} using specific radio frequencies, creating living installations in abandoned buildings with copper wire root systems. Inspired by Brandon LaBelle's sound ecology. What if each plant generated its own music? Vibe: experimental, organic, futuristic."
    },
    {
      titlePrefix: "Time Capsule Theater:",
      descriptionTemplate: "Stage plays about {topic} using only objects that will decompose by opening night, performing in locations scheduled for demolition. Inspired by Robert Smithson's entropy works. What if the script also degraded during performance? Vibe: urgent, ephemeral, archaeological."
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

export async function generateIdeasFromImage(imageBase64: string, creativityWeights?: any, count: number = 25): Promise<IdeaResponse[]> {
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
      return await generateIdeasFromText(prompt, creativityWeights, count);
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