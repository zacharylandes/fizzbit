import { HfInference } from "@huggingface/inference";
import OpenAI from "openai";

export interface IdeaResponse {
  id: string;
  title: string;
  description: string;
  sourceContent?: string;
  svg?: string; // Optional SVG drawing
}

// Initialize Together.ai (primary) and Hugging Face (fallback) and OpenAI (ultimate fallback)
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate simple SVG drawing related to prompt using Llama
// SVG generation now handled client-side using procedural JavaScript

// OpenAI API client for SVG generation
async function callOpenAI(messages: any[]): Promise<string | null> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages,
        max_tokens: 1500,
        temperature: 0.7
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
    
  } catch (error) {
    console.warn('OpenAI API call failed:', (error as Error).message);
    return null;
  }
}

// Generate placeholder SVG ideas that will be procedurally generated client-side
function generatePureAbstractSVGs(originalPrompt: string, count: number): IdeaResponse[] {
  const abstractSVGs: IdeaResponse[] = [];
  
  console.log(`🎨 Generating ${count} procedural abstract SVGs for prompt: "${originalPrompt}"`);
  
  for (let i = 0; i < count; i++) {
    abstractSVGs.push({
      id: `procedural-svg-${Date.now()}-${i}`,
      title: "", // No title for pure visual inspiration
      description: "", // No description for pure visual inspiration  
      sourceContent: originalPrompt,
      // Flag to indicate client-side generation needed - use empty svg field
      svg: "PROCEDURAL"
    });
    
    console.log(`🎨 Generated procedural abstract SVG placeholder ${i + 1}`);
  }
  
  return abstractSVGs;
}

// Together.ai API client with timeout
async function callTogetherAI(messages: any[], model: string = "meta-llama/Llama-3.2-3B-Instruct-Turbo") {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOGETHER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1200,
        temperature: 0.8
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Together.ai API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
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
  console.log('🔍 PARSING DEBUG - Raw AI response:', response.substring(0, 500) + (response.length > 500 ? '...' : ''));
  
  try {
    // Try to parse as JSON first - handle various JSON formats
    let jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      jsonMatch = response.match(/\{[\s\S]*\}/);
    }
    
    console.log('🔍 PARSING DEBUG - JSON match found:', !!jsonMatch);
    console.log('🔍 PARSING DEBUG - JSON content:', jsonMatch?.[0]?.substring(0, 200));
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('🔍 PARSING DEBUG - Parsed JSON:', parsed);
      const ideas = Array.isArray(parsed) ? parsed : (parsed.ideas || [parsed]);
      console.log('🔍 PARSING DEBUG - Ideas array length:', ideas.length);
      
      const validIdeas = ideas.filter((idea: any, index: number) => {
        const title = idea.title || idea.idea || idea.content;
        console.log(`🔍 PARSING DEBUG - Idea ${index}:`, { title, type: typeof title });
        
        if (!title || typeof title !== 'string') {
          console.log(`🔍 PARSING DEBUG - Rejected ${index}: No valid title`);
          return false;
        }
        
        const titleStr = String(title).trim();
        const words = titleStr.split(' ');
        
        console.log(`🔍 PARSING DEBUG - Title ${index}: "${titleStr}" (${titleStr.length} chars, ${words.length} words)`);
        
        // REJECT only obviously invalid titles
        if (titleStr.length < 2 || 
            titleStr.length > 150 ||
            words.length < 1 || 
            words.length > 30 ||
            titleStr.toLowerCase().includes('creative concept') ||
            titleStr.toLowerCase().includes('creative idea') ||
            titleStr.toLowerCase().includes('action step')) {
          console.log(`🔍 PARSING DEBUG - Rejected ${index}: Failed validation`);
          return false;
        }
        
        console.log(`🔍 PARSING DEBUG - Accepted ${index}: "${titleStr}"`);
        // ACCEPT any reasonable title - be much more flexible
        // Allow app names, techniques, methods, project ideas, etc.
        return true;
      }).slice(0, count);
      
      console.log('🔍 PARSING DEBUG - Valid ideas count:', validIdeas.length);
      
      return validIdeas.map((idea: any, index: number) => {
        const title = String(idea.title || idea.idea || idea.content).trim();
        
        return {
          id: `ai-${Date.now()}-${index}`,
          title: title,
          description: title, // Use title as description for simple format
          sourceContent: originalPrompt
        };
      });
    }
  } catch (e) {
    console.log('JSON parsing failed, using text parsing...');
  }
  
  // Debug what we're getting from AI
  console.log('Text parsing fallback - raw response sample:', response.substring(0, 500));
  
  // Extract project ideas with more flexible approach - split ONLY on numbered list items
  const lines = response
    .replace(/[{}[\]"]/g, '') // Remove JSON syntax
    .replace(/title:|description:/gi, '') // Remove JSON keys
    .split(/\n/) // Split only on newlines first
    .map(line => line.trim())
    .filter(line => line.length > 5)
    .join('\n')
    .split(/\n(?=\d+\.|\-\s|\*\s)/) // Split only on numbered/bulleted items
    .map(line => line.trim())
    .filter(line => {
      const words = line.split(' ');
      const lowerLine = line.toLowerCase();
      
      // REJECT lines with unwanted content
      if (lowerLine.includes('here are') ||
          lowerLine.includes('creative concept') ||
          lowerLine.includes('action step') ||
          lowerLine.includes('json') ||
          lowerLine.includes('array') ||
          words.length < 6 || words.length > 25) { // Allow longer complete sentences
        return false;
      }
      
      // Different validation for names vs story concepts
      const isNameRequest = originalPrompt.toLowerCase().includes('name') || originalPrompt.toLowerCase().includes('title') || originalPrompt.toLowerCase().includes('call');
      
      if (isNameRequest) {
        // For names/titles, accept shorter, more direct responses
        return line.length >= 5 && line.length <= 100 && !lowerLine.includes('concept:');
      } else {
        // For play concepts, look for story indicators
        const storyIndicators = ['comedy', 'drama', 'man', 'woman', 'family', 'story', 'play', 'character', 'person', 'about', 'where', 'who', 'discovers', 'believes', 'thinks', 'tries', 'struggles', 'leads', 'turns', 'becomes', 'finds'];
        
        // Check if line contains story/character words
        const hasStoryElement = storyIndicators.some(word => lowerLine.includes(word));
        
        return hasStoryElement && line.length >= 15 && line.length <= 200;
      }
    });

  console.log('Found potential ideas:', lines.length, lines.slice(0, 3));

  // Clean each line more carefully to preserve complete ideas
  const cleanedResponse = lines.map(line => {
    return line
      .replace(/^\d+\.?\s*/, '') // Remove numbering
      .replace(/^[\-\*]\s*/, '') // Remove bullet points
      .replace(/^["']/, '') // Remove opening quotes
      .replace(/["']$/, '') // Remove closing quotes
      .trim();
  }).filter(line => {
    // Different validation for names vs story concepts
    const isNameRequest = originalPrompt.toLowerCase().includes('name') || originalPrompt.toLowerCase().includes('title') || originalPrompt.toLowerCase().includes('call');
    
    if (isNameRequest) {
      // For names/titles, be more lenient
      return line.length > 5 && 
             line.length < 100 && 
             !line.toLowerCase().includes('here are') &&
             !line.toLowerCase().includes('creative concept') &&
             line.split(' ').length >= 2; // Names can be short
    } else {
      // For play concepts, require complete sentences
      return line.length > 15 && 
             line.length < 200 && 
             !line.toLowerCase().includes('here are') &&
             !line.toLowerCase().includes('creative concept') &&
             line.split(' ').length >= 6; // Ensure it's a complete sentence
    }
  });

  const ideas: IdeaResponse[] = [];
  
  // Create ideas from cleaned content
  for (let i = 0; i < cleanedResponse.length && ideas.length < count; i++) {
    const ideaText = cleanedResponse[i].trim();
    
    if (ideaText.length > 10) {
      ideas.push({
        id: `ai-${Date.now()}-${ideas.length}`,
        title: ideaText,
        description: ideaText,
        sourceContent: originalPrompt
      });
    }
  }
  
  console.log(`Extracted ${ideas.length} actual ideas from response`);
  
  return ideas.slice(0, count);
}

// Create 5 pure abstract SVG ideas + add SVGs to some text ideas  
async function addSVGToIdeas(ideas: IdeaResponse[], originalPrompt: string): Promise<IdeaResponse[]> {
  const finalIdeas = [...ideas];
  
  // Add procedural SVG generation flag to all text ideas
  finalIdeas.forEach(idea => {
    idea.svg = "PROCEDURAL"; // Mark for client-side people illustration generation
  });
  
  // Ensure we have exactly 25 ideas total
  while (finalIdeas.length > 25) {
    finalIdeas.pop(); // Remove excess
  }
  
  // If we have less than 25, throw error instead of generic templates
  if (finalIdeas.length < 25) {
    const needed = 25 - finalIdeas.length;
    console.log(`❌ Only generated ${finalIdeas.length} relevant ideas, need ${needed} more. Throwing error instead of using generic templates.`);
    throw new Error('Unable to generate enough relevant ideas for this prompt. Please try rephrasing your request or check back later.');
  }
  
  // SVG illustrations for text ideas are now generated client-side
  return finalIdeas;
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
  
  // Use simple, direct prompt for all requests
  const systemPrompt = `Generate ${count} completely different creative concepts. RETURN ONLY A JSON ARRAY - no other text.

Example (but you must create ${count} items):
[
  {"title": "Hands-on volcano experiments using baking soda and food coloring"},
  {"title": "Weather tracking station with daily measurements and predictions"},
  {"title": "Interactive storytelling app with voice recognition features"},
  {"title": "Community garden project with automated watering systems"},
  {"title": "DIY photo booth with custom props and backdrop designs"},
  {"title": "Weekly cooking challenge featuring international cuisine exploration"},
  {"title": "Local history walking tour with augmented reality components"},
  {"title": "Mindfulness meditation garden with sound therapy elements"}
]

CRITICAL: Must return exactly ${count} different ideas in valid JSON array format. No single objects, no text outside JSON.`;

  // PRIMARY: Try Together.ai Llama - Make multiple calls for variety
  try {
    console.log('🔄 Trying Together.ai with multiple calls for variety...');
    const allIdeas: IdeaResponse[] = [];
    
    // Make multiple calls to get diverse ideas
    const batchSize = Math.min(5, count); // Generate in batches of 5
    const numBatches = Math.ceil(count / batchSize);
    
    for (let batch = 0; batch < numBatches; batch++) {
      const batchPrompt = `Generate 1 unique creative concept based on: "${prompt}". 
      Variation ${batch + 1}: Make this different from typical approaches.
      Return only: {"title": "your creative concept here"}`;
      
      const messages = [
        { role: "user", content: batchPrompt }
      ];
      
      try {
        const response = await callTogetherAI(messages);
        const ideas = parseIdeasFromResponse(response, prompt, 1);
        if (ideas.length > 0) {
          allIdeas.push(...ideas);
        }
      } catch (batchError) {
        console.log(`Batch ${batch + 1} failed, continuing...`);
      }
      
      // Stop if we have enough ideas
      if (allIdeas.length >= count) break;
    }
    
    console.log(`🔍 TOGETHER DEBUG - Total ideas from batches: ${allIdeas.length}`);
    
    if (allIdeas.length > 0) {
      // Add SVG drawings to 1/3 of the ideas
      const ideasWithSvg = await addSVGToIdeas(allIdeas, prompt);
      console.log(`✅ Together.ai generated ${ideasWithSvg.length} ideas`);
      return ideasWithSvg;
    } else {
      console.log('❌ Together.ai returned no valid ideas');
    }
  } catch (error) {
    console.warn('❌ Together.ai failed:', (error as Error).message);
  }

  // FALLBACK 1: Try Hugging Face Mistral
  try {
    console.log('🔄 Trying Hugging Face fallback...');
    const hfPrompt = `${systemPrompt}\n\nGenerate creative ideas in JSON format:`;
    const response = await callHuggingFaceLLM(hfPrompt);
    console.log('📦 Hugging Face raw response length:', response?.length || 0);
    const ideas = parseIdeasFromResponse(response, prompt, count);
    
    if (ideas.length > 0) {
      // Add SVG drawings to 1/3 of the ideas
      const ideasWithSvg = await addSVGToIdeas(ideas, prompt);
      console.log(`✅ Hugging Face generated ${ideasWithSvg.length} ideas`);  
      return ideasWithSvg;
    } else {
      console.log('❌ Hugging Face returned no valid ideas');
    }
  } catch (error) {
    console.warn('❌ Hugging Face failed:', (error as Error).message);
  }

  // FALLBACK 2: Try OpenAI
  try {
    console.log('🔄 Trying OpenAI fallback...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 2500
    });
    
    const rawContent = response.choices[0].message.content || "";
    console.log('📦 OpenAI raw response length:', rawContent.length);
    console.log('🔍 OPENAI DEBUG - First 300 chars:', rawContent.substring(0, 300));
    const ideas = parseIdeasFromResponse(rawContent, prompt, count);
    console.log('🔍 OPENAI DEBUG - Ideas returned from parser:', ideas.length);
    
    if (ideas.length > 0) {
      // Add SVG drawings to 1/3 of the ideas
      const ideasWithSvg = await addSVGToIdeas(ideas, prompt);
      console.log(`✅ OpenAI generated ${ideasWithSvg.length} ideas`);
      return ideasWithSvg;
    } else {
      console.log('❌ OpenAI returned no valid ideas');
    }
  } catch (error) {
    console.warn('❌ OpenAI failed:', (error as Error).message);
  }

  // FINAL FALLBACK: Throw error instead of generic templates
  console.log('All AI services failed, no fallback to generic content');
  throw new Error('Unable to generate relevant ideas for this prompt. Please try rephrasing your request or check back later.');
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
      throw new Error('Unable to analyze your drawing. Please try again or check your internet connection.');
    }
  }
  
  // Generate ideas based on image description
  const enhancedPrompt = `Generate creative project ideas inspired by: ${imageDescription.split('.')[0]}. Focus on actionable creative concepts, not descriptions.`;
  
  const ideas = await generateIdeasFromText(enhancedPrompt, count);
  
  // Mark ideas as image-sourced - preserve original sourceContent for procedural SVGs
  return ideas.map(idea => ({
    ...idea,
    sourceContent: idea.svg === "PROCEDURAL" ? idea.sourceContent : 'Image upload'
  }));
}

// Related idea generation for exploration
export async function generateRelatedIdeas(contextualPrompt: string, count: number = 3): Promise<IdeaResponse[]> {
  console.log(`🔗 Generating ${count} related ideas from context: "${contextualPrompt}"`);
  
  const systemPrompt = `Generate ${count} unique creative project ideas related to ${contextualPrompt}. Be concise and actionable.
Respond with a JSON array of objects, each with:
- "title": a short and concise sentence with no more than 12 words. it should be a unique and creative idea related to ${contextualPrompt}`;

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