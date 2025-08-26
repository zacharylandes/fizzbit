import { HfInference } from "@huggingface/inference";
import OpenAI from "openai";

export interface IdeaResponse {
  id: string;
  title: string;
  description: string;
  sourceContent?: string;
}

// Initialize Together.ai (primary) and Hugging Face (fallback) and OpenAI (ultimate fallback)
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Together.ai API client
async function callTogetherAI(messages: any[], model: string = "meta-llama/Llama-3.2-3B-Instruct-Turbo") {
  const response = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOGETHER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2000,
      temperature: 0.8,
      response_format: { type: "json_object" }
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Together.ai API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Hugging Face LLM fallback
async function callHuggingFaceLLM(prompt: string, model: string = "mistralai/Mistral-7B-Instruct-v0.3") {
  const response = await hf.textGeneration({
    model,
    inputs: prompt,
    parameters: {
      max_new_tokens: 2000,
      temperature: 0.8,
      return_full_text: false,
    },
  });
  
  return response.generated_text;
}

// Vision analysis using Together.ai vision model
async function analyzeImageWithTogetherAI(imageBase64: string) {
  const response = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST", 
    headers: {
      "Authorization": `Bearer ${TOGETHER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/Llama-Vision-Free",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text", 
              text: "Analyze this image and describe what you see, including colors, objects, mood, style, and any creative elements. Be detailed and descriptive."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    throw new Error(`Together.ai Vision API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// OpenAI vision fallback 
async function analyzeImageWithOpenAI(imageBase64: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this image and describe what you see, including colors, objects, mood, style, and any creative elements. Be detailed and descriptive."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      }
    ],
    max_tokens: 1000,
    temperature: 0.7
  });
  
  return response.choices[0].message.content;
}

// Parse AI response to extract ideas
function parseIdeasFromResponse(response: string, originalPrompt: string, count: number): IdeaResponse[] {
  try {
    // Try to parse as JSON first
    const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const ideas = Array.isArray(parsed) ? parsed : (parsed.ideas || []);
      
      return ideas.slice(0, count).map((idea: any, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        title: idea.title || `Creative Idea ${index + 1}`,
        description: idea.description || idea.idea || String(idea),
        sourceContent: originalPrompt
      }));
    }
  } catch (e) {
    console.log('JSON parsing failed, using text parsing...');
  }
  
  // Fallback to text parsing
  const lines = response.split('\n').filter(line => line.trim());
  const ideas: IdeaResponse[] = [];
  
  for (let i = 0; i < lines.length && ideas.length < count; i++) {
    const line = lines[i].trim();
    if (line.length > 10) {
      // Try to extract title and description
      const titleMatch = line.match(/^(\d+\.\s*)?([^:]+):\s*(.+)$/);
      if (titleMatch) {
        ideas.push({
          id: `ai-${Date.now()}-${ideas.length}`,
          title: titleMatch[2].trim(),
          description: titleMatch[3].trim(),
          sourceContent: originalPrompt
        });
      } else {
        // Use whole line as description with generated title
        ideas.push({
          id: `ai-${Date.now()}-${ideas.length}`,
          title: `Creative Concept ${ideas.length + 1}`,
          description: line,
          sourceContent: originalPrompt
        });
      }
    }
  }
  
  return ideas.slice(0, count);
}

// Generate template fallback ideas when all AI fails
function generateTemplateFallback(prompt: string, count: number): IdeaResponse[] {
  const templates = [
    {
      titlePrefix: "Community Challenge",
      descriptionTemplate: "Start a creative challenge around {topic} - invite others to share their unique approaches and build a collection of diverse perspectives."
    },
    {
      titlePrefix: "Daily Practice", 
      descriptionTemplate: "Create a 30-day {topic} practice where you explore one small aspect each day and document your discoveries."
    },
    {
      titlePrefix: "Collaborative Project",
      descriptionTemplate: "Partner with someone who has a different perspective on {topic} and create something that neither of you could make alone."
    },
    {
      titlePrefix: "Learning Journey",
      descriptionTemplate: "Teach yourself about {topic} by creating something new every week and sharing your process with others."
    },
    {
      titlePrefix: "Creative Remix", 
      descriptionTemplate: "Take the concept of {topic} and apply it to a completely different field or medium you've never tried before."
    },
    {
      titlePrefix: "Storytelling Angle",
      descriptionTemplate: "Document the stories behind {topic} - interview people, collect experiences, and share the human side."
    },
    {
      titlePrefix: "Problem-Solving Focus",
      descriptionTemplate: "Identify a common problem related to {topic} and create an innovative solution that helps others."
    },
    {
      titlePrefix: "Experimental Approach",
      descriptionTemplate: "Test unusual methods or combinations with {topic} and share what works, what doesn't, and what surprises you discover."
    }
  ];

  const shuffledTemplates = [...templates].sort(() => Math.random() - 0.5);
  const selectedTemplates = shuffledTemplates.slice(0, count);
  
  return selectedTemplates.map((template, index) => {
    const topic = prompt.toLowerCase();
    return {
      id: `template-${Date.now()}-${index}`,
      title: template.titlePrefix,
      description: template.descriptionTemplate.replace(/\{topic\}/g, topic) + " - What makes this interesting is how it connects your passion with community engagement and learning.",
      sourceContent: prompt
    };
  });
}

// Main text idea generation function
export async function generateIdeasFromText(prompt: string, count: number = 25): Promise<IdeaResponse[]> {
  console.log(`🚀 Generating ${count} ideas from text prompt: "${prompt}"`);
  
  const systemPrompt = `You are a creative AI that generates personalized, actionable creative ideas. Generate exactly ${count} unique creative ideas based on the user's prompt. Each idea should be:

1. Directly related to their specific prompt/interest
2. Contextually appropriate (plots for stories, art projects for visuals, exercises for abstract concepts)  
3. Actionable and specific, not generic
4. Use TITLE/IDEA/HOOK structure for clear, compelling suggestions

Respond with a JSON array of objects, each with:
- "title": A catchy 3-5 word title
- "description": Detailed idea with specific next steps

Make each idea feel personally crafted for their specific interest.`;

  // PRIMARY: Try Together.ai Llama
  try {
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ];
    
    const response = await callTogetherAI(messages);
    const ideas = parseIdeasFromResponse(response, prompt, count);
    
    if (ideas.length > 0) {
      console.log(`✅ Together.ai generated ${ideas.length} ideas`);
      return ideas;
    }
  } catch (error) {
    console.warn('Together.ai failed:', (error as Error).message);
  }

  // FALLBACK 1: Try Hugging Face Mistral
  try {
    const hfPrompt = `${systemPrompt}\n\nUser prompt: ${prompt}\n\nGenerate creative ideas in JSON format:`;
    const response = await callHuggingFaceLLM(hfPrompt);
    const ideas = parseIdeasFromResponse(response, prompt, count);
    
    if (ideas.length > 0) {
      console.log(`✅ Hugging Face generated ${ideas.length} ideas`);  
      return ideas;
    }
  } catch (error) {
    console.warn('Hugging Face failed:', (error as Error).message);
  }

  // FALLBACK 2: Try OpenAI
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 2000
    });
    
    const ideas = parseIdeasFromResponse(response.choices[0].message.content || "", prompt, count);
    
    if (ideas.length > 0) {
      console.log(`✅ OpenAI generated ${ideas.length} ideas`);
      return ideas;
    }
  } catch (error) {
    console.warn('OpenAI failed:', (error as Error).message);
  }

  // FINAL FALLBACK: Template-based ideas
  console.log('All AI services failed, using template fallback');
  return generateTemplateFallback(prompt, count);
}

// Image analysis and idea generation  
export async function generateIdeasFromImage(imageBase64: string, count: number = 25): Promise<IdeaResponse[]> {
  console.log(`📷 Analyzing image and generating ${count} ideas`);
  
  let imageDescription = "";
  
  // PRIMARY: Try Together.ai vision model
  try {
    imageDescription = await analyzeImageWithTogetherAI(imageBase64);
    console.log('✅ Together.ai vision analysis successful');
  } catch (error) {
    console.warn('Together.ai vision failed:', (error as Error).message);
    
    // FALLBACK: Try OpenAI vision
    try {
      imageDescription = await analyzeImageWithOpenAI(imageBase64) || "";
      console.log('✅ OpenAI vision analysis successful');
    } catch (visionError) {
      console.warn('All vision models failed:', (visionError as Error).message);
      imageDescription = "visual art photography creative projects image inspiration design aesthetic colors composition";
    }
  }
  
  // Generate ideas based on image description
  const enhancedPrompt = `Based on this visual content: ${imageDescription}. Generate creative project ideas inspired by the visual elements, themes, colors, and mood.`;
  
  const ideas = await generateIdeasFromText(enhancedPrompt, count);
  
  // Mark ideas as image-sourced
  return ideas.map(idea => ({
    ...idea,
    sourceContent: 'Image upload',
    description: `Based on your uploaded image: ${idea.description}`
  }));
}

// Related idea generation for exploration
export async function generateRelatedIdeas(contextualPrompt: string, count: number = 3): Promise<IdeaResponse[]> {
  console.log(`🔗 Generating ${count} related ideas from context: "${contextualPrompt}"`);
  
  const systemPrompt = `Generate ${count} creative ideas that build upon or relate to the given context. Each idea should feel like a natural extension or creative variation of the original concept.

Respond with JSON array of objects with "title" and "description" fields.`;

  // PRIMARY: Try Together.ai
  try {
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: contextualPrompt }
    ];
    
    const response = await callTogetherAI(messages);
    const ideas = parseIdeasFromResponse(response || "", contextualPrompt, count);
    
    if (ideas.length > 0) {
      console.log(`✅ Together.ai generated ${ideas.length} related ideas`);
      return ideas;
    }
  } catch (error) {
    console.warn('Together.ai related ideas failed:', (error as Error).message);
  }

  // FALLBACK: Use main text generation with modified prompt
  const fallbackPrompt = `Generate creative variations and extensions of: ${contextualPrompt}`;
  const ideas = await generateIdeasFromText(fallbackPrompt, count);
  
  console.log(`✅ Generated ${ideas.length} related ideas via fallback`);
  return ideas.slice(0, count);
}