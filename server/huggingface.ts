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
async function generateSVGDrawing(prompt: string): Promise<string | null> {
  try {
    const svgMessages = [
      {
        role: "system",
        content: "You are an SVG drawing generator. Create a simple, clean SVG illustration related to the given prompt. Use basic shapes and 2-3 colors maximum. Keep it minimalist and clear. Respond with only the SVG code, no explanations."
      },
      {
        role: "user", 
        content: `Create a simple SVG drawing related to: ${prompt}`
      }
    ];
    
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOGETHER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.2-3B-Instruct-Turbo",
        messages: svgMessages,
        max_tokens: 400,
        temperature: 0.7
      }),
    });
    
    if (!response.ok) {
      throw new Error(`SVG generation failed: ${response.status}`);
    }
    
    const data = await response.json();
    const svgContent = data.choices[0].message.content;
    
    // Extract SVG from response
    const svgMatch = svgContent.match(/<svg[\s\S]*?<\/svg>/i);
    return svgMatch ? svgMatch[0] : null;
    
  } catch (error) {
    console.warn('SVG generation failed:', (error as Error).message);
    return null;
  }
}

// Generate simple programmatic abstract SVGs (more reliable than AI-generated)
function generatePureAbstractSVGs(originalPrompt: string, count: number): IdeaResponse[] {
  const abstractSVGs: IdeaResponse[] = [];
  
  const colors = ['#4f46e5', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];
  
  for (let i = 0; i < count; i++) {
    // Generate deterministic but varied abstract patterns based on prompt
    const promptHash = originalPrompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seed = promptHash + i;
    
    // Use seed to generate consistent but varied shapes
    const color1 = colors[seed % colors.length];
    const color2 = colors[(seed + 2) % colors.length];
    
    let svg = '';
    
    switch (i % 5) {
      case 0: // Flowing curves
        svg = `<svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
          <path d="M20,75 Q100,20 180,75 Q100,130 20,75" fill="none" stroke="${color1}" stroke-width="3"/>
          <circle cx="50" cy="50" r="15" fill="${color2}" opacity="0.6"/>
          <circle cx="150" cy="100" r="10" fill="${color1}" opacity="0.4"/>
        </svg>`;
        break;
      case 1: // Geometric shapes
        svg = `<svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
          <rect x="40" y="40" width="60" height="60" fill="none" stroke="${color1}" stroke-width="2" transform="rotate(15 70 70)"/>
          <polygon points="120,30 160,90 80,90" fill="${color2}" opacity="0.5"/>
          <line x1="20" y1="20" x2="180" y2="130" stroke="${color1}" stroke-width="2" opacity="0.7"/>
        </svg>`;
        break;
      case 2: // Organic lines
        svg = `<svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
          <path d="M10,75 C50,25 100,125 140,75 C180,25 200,75 190,100" fill="none" stroke="${color1}" stroke-width="2"/>
          <path d="M30,100 C70,60 130,110 170,70" fill="none" stroke="${color2}" stroke-width="3" opacity="0.6"/>
          <circle cx="100" cy="75" r="5" fill="${color1}"/>
        </svg>`;
        break;
      case 3: // Abstract composition
        svg = `<svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="100" cy="75" rx="80" ry="40" fill="none" stroke="${color1}" stroke-width="2" opacity="0.5"/>
          <rect x="70" y="55" width="60" height="40" fill="${color2}" opacity="0.3" rx="10"/>
          <line x1="40" y1="40" x2="160" y2="110" stroke="${color1}" stroke-width="1" opacity="0.8"/>
        </svg>`;
        break;
      case 4: // Minimalist design
        svg = `<svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
          <circle cx="70" cy="60" r="25" fill="none" stroke="${color1}" stroke-width="2"/>
          <circle cx="130" cy="90" r="20" fill="${color2}" opacity="0.4"/>
          <path d="M40,120 L160,30" stroke="${color1}" stroke-width="1" opacity="0.6"/>
          <rect x="85" y="70" width="30" height="10" fill="${color2}" opacity="0.7"/>
        </svg>`;
        break;
    }
    
    abstractSVGs.push({
      id: `abstract-svg-${Date.now()}-${i}`,
      title: "", // No title for pure visual inspiration
      description: "", // No description for pure visual inspiration  
      sourceContent: originalPrompt,
      svg: svg
    });
    
    console.log(`🎨 Generated programmatic abstract SVG ${i + 1}`);
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
            words.length > 20 ||
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
  
  // Extract project ideas with more flexible approach
  const lines = response
    .replace(/[{}[\]"]/g, '') // Remove JSON syntax
    .replace(/title:|description:/gi, '') // Remove JSON keys
    .split(/[,\n]+/) // Split on separators
    .map(line => line.trim())
    .filter(line => {
      const words = line.split(' ');
      const lowerLine = line.toLowerCase();
      
      // REJECT lines with unwanted content
      if (lowerLine.includes('creative concept') ||
          lowerLine.includes('action step') ||
          lowerLine.includes('json') ||
          lowerLine.includes('array') ||
          words.length < 4 || words.length > 15) { // Relaxed word count
        return false;
      }
      
      // ACCEPT lines that look like project ideas
      const actionIndicators = ['build', 'create', 'design', 'make', 'explore', 'investigate', 'experiment', 'develop', 'construct', 'test', 'observe', 'study', 'grow', 'mix', 'measure', 'compare', 'track', 'record', 'demonstrate'];
      
      // Check if line contains action words (not just starting)
      const hasAction = actionIndicators.some(verb => lowerLine.includes(verb));
      
      return hasAction && line.length >= 15 && line.length <= 100;
    });

  console.log('Found potential ideas:', lines.length, lines.slice(0, 3));

  // Clean each line
  const cleanedResponse = lines.map(line => {
    return line
      .replace(/^\W+/, '') // Remove leading punctuation
      .replace(/\W+$/, '') // Remove trailing punctuation
      .replace(/^\d+\.?\s*/, '') // Remove numbering
      .trim();
  }).filter(line => line.length > 10);

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
  
  // STEP 1: Create 5 pure abstract SVG ideas (no text) 
  console.log('🎨 Generating 5 pure abstract SVGs...');
  const pureAbstractSVGs = generatePureAbstractSVGs(originalPrompt, 5);
  console.log(`🎨 Successfully generated ${pureAbstractSVGs.length} abstract SVGs`);
  
  // STEP 2: Distribute pure SVG ideas throughout the cards (sprinkle them in)
  if (pureAbstractSVGs.length > 0) {
    // Calculate positions to insert SVGs evenly throughout
    const totalSlots = 25;
    const svgPositions = [];
    
    // Spread SVGs evenly: positions 4, 9, 14, 19, 24 (every 5 cards)
    for (let i = 0; i < Math.min(pureAbstractSVGs.length, 5); i++) {
      svgPositions.push(4 + (i * 5)); // 4, 9, 14, 19, 24
    }
    
    // Insert SVGs at calculated positions
    svgPositions.forEach((position, index) => {
      if (position < totalSlots && pureAbstractSVGs[index]) {
        // Make sure we don't exceed the array bounds
        if (position < finalIdeas.length) {
          finalIdeas.splice(position, 0, pureAbstractSVGs[index]);
        } else {
          finalIdeas.push(pureAbstractSVGs[index]);
        }
        console.log(`🎨 Inserted abstract SVG at position ${position + 1}`);
      }
    });
  } else {
    console.log('🚨 No abstract SVGs generated, keeping all text ideas');
  }
  
  // Ensure we have exactly 25 ideas total
  while (finalIdeas.length > 25) {
    finalIdeas.pop(); // Remove excess
  }
  
  // If we have less than 25, pad with text ideas if available
  while (finalIdeas.length < 25 && ideas.length > 0) {
    finalIdeas.push(ideas[finalIdeas.length % ideas.length]);
  }
  
  // STEP 3: Add SVG illustrations to some remaining text ideas (about 1/4 of remaining)
  const remainingTextIdeas = finalIdeas.length - pureAbstractSVGs.length;
  const textSvgCount = Math.ceil(remainingTextIdeas / 4); // 1/4 of remaining text ideas get SVG
  
  const selectedIndices = new Set<number>();
  while (selectedIndices.size < textSvgCount && selectedIndices.size < remainingTextIdeas) {
    selectedIndices.add(Math.floor(Math.random() * remainingTextIdeas));
  }
  
  // Generate SVG drawings for selected text ideas
  const svgPromises = Array.from(selectedIndices).map(async (index) => {
    const idea = finalIdeas[index];
    const svgPrompt = `${originalPrompt} - ${idea.title}`;
    const svg = await generateSVGDrawing(svgPrompt);
    
    if (svg) {
      finalIdeas[index] = { ...idea, svg };
      console.log(`🎨 Added SVG to text idea: ${idea.title}`);
    }
  });
  
  await Promise.all(svgPromises);
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
  
  const systemPrompt = `Generate ${count} creative ideas directly related to: "${prompt}"

CRITICAL: Give them exactly what they're asking for. Pay attention to whether they want CONCEPTS or NAMES:

- "ideas for X" = Give actual concepts, plots, scenarios, or descriptions of what X could be about
- "names for X" = Give short titles, labels, or names only

EXAMPLES:
✅ CORRECT for "ideas for a play":
- "Comedy about roommates who accidentally time travel"
- "Drama where family secrets emerge during dinner"
- "Musical about competing food truck owners"

❌ WRONG for "ideas for a play" (these are names/titles):
- "The Time Traveler"
- "Family Secrets" 
- "Future Shock"

✅ CORRECT for "names for a play":
- "The Time Between"
- "Midnight Confessions" 
- "Breaking Bread"

Other examples:
- For "software consultancy names with Landes": "LandesTech", "Landes Logic"
- For "creative inspiration": "Practice morning pages daily", "Take photos of textures"

DO NOT include:
- Generic "creative concept" labels
- Bullet points or formatting
- Multiple sentences
- Unrelated suggestions

Format as JSON: [{"title": "LandesTech"}, {"title": "Practice morning pages daily"}]`;

  // PRIMARY: Try Together.ai Llama
  try {
    console.log('🔄 Trying Together.ai...');
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ];
    
    const response = await callTogetherAI(messages);
    console.log('📦 Together.ai raw response length:', response?.length || 0);
    console.log('🔍 TOGETHER DEBUG - First 300 chars:', response?.substring(0, 300));
    const ideas = parseIdeasFromResponse(response, prompt, count);
    console.log('🔍 TOGETHER DEBUG - Ideas returned from parser:', ideas.length);
    
    if (ideas.length > 0) {
      // Add SVG drawings to 1/3 of the ideas
      const ideasWithSvg = await addSVGToIdeas(ideas, prompt);
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
    const hfPrompt = `${systemPrompt}\n\nUser prompt: ${prompt}\n\nGenerate creative ideas in JSON format:`;
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
  const enhancedPrompt = `Generate creative project ideas inspired by: ${imageDescription.split('.')[0]}. Focus on actionable creative concepts, not descriptions.`;
  
  const ideas = await generateIdeasFromText(enhancedPrompt, count);
  
  // Mark ideas as image-sourced - don't add extra prefix since AI already formats with "Based on your uploaded image:"
  return ideas.map(idea => ({
    ...idea,
    sourceContent: 'Image upload'
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