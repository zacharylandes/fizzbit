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
        content: "You are an SVG drawing generator. Make a minimal abstract SVG, viewBox 0 0 100 100, stroke-width 2, black stroke, no fill. Respond with only the SVG code, no explanations."
      },
      {
        role: "user", 
        content: `Make a minimal abstract SVG, viewBox 0 0 100 100, stroke-width 2, black stroke, no fill, inspired by the idea '${prompt}'.`
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
  
  const colors = ['black', 'black', 'black', 'black', 'black', 'black']; // Use black as placeholder - will be replaced by frontend
  
  for (let i = 0; i < count; i++) {
    // Generate deterministic but varied abstract patterns based on prompt
    const promptHash = originalPrompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seed = promptHash + i;
    
    // Use seed to generate consistent but varied shapes
    const color1 = colors[seed % colors.length];
    const color2 = colors[(seed + 2) % colors.length];
    
    let svg = '';
    
    switch (i % 5) {
      case 0: // Flowing organic curves
        svg = `<svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
          <path d="M20,120 C60,40 90,110 130,30 C160,90 180,20 200,80" fill="none" stroke="black" stroke-width="2"/>
          <path d="M10,60 C50,90 120,10 150,70 C170,30 190,100 210,50" fill="none" stroke="black" stroke-width="1.5"/>
        </svg>`;
        break;
      case 1: // Abstract waves
        svg = `<svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
          <path d="M0,75 Q50,20 100,75 T200,75" fill="none" stroke="black" stroke-width="2"/>
          <path d="M0,100 Q30,60 80,100 Q120,140 160,100 Q180,80 200,120" fill="none" stroke="black" stroke-width="1.5"/>
          <path d="M20,50 Q60,80 100,50 Q140,20 180,50" fill="none" stroke="black" stroke-width="1"/>
        </svg>`;
        break;
      case 2: // Intertwining lines
        svg = `<svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
          <path d="M10,75 C50,25 100,125 140,75 C180,25 200,75 190,100" fill="none" stroke="black" stroke-width="2"/>
          <path d="M30,30 C70,120 130,40 170,130" fill="none" stroke="black" stroke-width="1.5"/>
          <path d="M180,40 C140,80 100,20 60,90 C40,60 20,120 0,90" fill="none" stroke="black" stroke-width="1"/>
        </svg>`;
        break;
      case 3: // Spiral abstractions
        svg = `<svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
          <path d="M100,75 C120,55 140,75 120,95 C80,115 60,75 80,55 C100,35 140,55 120,95 C60,135 20,75 60,35" fill="none" stroke="black" stroke-width="2"/>
          <path d="M170,40 C150,60 170,80 190,60 C210,40 190,20 170,40" fill="none" stroke="black" stroke-width="1.5"/>
        </svg>`;
        break;
      case 4: // Abstract brush strokes  
        svg = `<svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
          <path d="M20,40 C60,20 80,100 120,80 C140,60 180,120 200,100" fill="none" stroke="black" stroke-width="3"/>
          <path d="M0,110 C40,130 100,70 160,90 C180,100 200,80 220,110" fill="none" stroke="black" stroke-width="1.5"/>
          <path d="M30,70 C80,50 120,130 170,110" fill="none" stroke="black" stroke-width="2"/>
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
      
      // ACCEPT creative concepts - look for story indicators instead of action words
      const storyIndicators = ['comedy', 'drama', 'man', 'woman', 'family', 'story', 'play', 'character', 'person', 'about', 'where', 'who', 'discovers', 'believes', 'thinks', 'tries', 'struggles', 'leads', 'turns', 'becomes', 'finds'];
      
      // Check if line contains story/character words
      const hasStoryElement = storyIndicators.some(word => lowerLine.includes(word));
      
      return hasStoryElement && line.length >= 15 && line.length <= 200;
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
    // Only accept lines that look like complete ideas
    return line.length > 15 && 
           line.length < 200 && 
           !line.toLowerCase().includes('here are') &&
           !line.toLowerCase().includes('creative concept') &&
           line.split(' ').length >= 6; // Ensure it's a complete sentence
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
  
  // STEP 3: Add SVG illustrations to some text ideas (ideas with non-empty titles)
  const textIdeasIndices = finalIdeas
    .map((idea, index) => ({ idea, index }))
    .filter(({ idea }) => idea.title && idea.title.trim().length > 0) // Only ideas with titles
    .map(({ index }) => index);
  
  const textSvgCount = Math.ceil(textIdeasIndices.length / 4); // 1/4 of text ideas get SVG
  
  // Randomly select text ideas to add SVGs to
  const shuffledIndices = [...textIdeasIndices].sort(() => Math.random() - 0.5);
  const selectedIndices = shuffledIndices.slice(0, textSvgCount);
  
  // Generate SVG drawings for selected text ideas
  const svgPromises = selectedIndices.map(async (index) => {
    const idea = finalIdeas[index];
    if (idea.title && idea.title.trim().length > 0) {
      const svgPrompt = `${originalPrompt} - ${idea.title}`;
      const svg = await generateSVGDrawing(svgPrompt);
      
      if (svg) {
        finalIdeas[index] = { ...idea, svg };
        console.log(`🎨 Added SVG to text idea: ${idea.title}`);
      }
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
  
  const systemPrompt = `Generate ${count} creative CONCEPTS/PLOT IDEAS for: "${prompt}"

IMPORTANT: The user asked for "ideas for a play" - this means PLOT CONCEPTS, not titles or names.

Generate actual play scenarios, plots, and story concepts. Each should be a complete creative concept in 6-15 words.

EXAMPLES for "ideas for a play about a man who thinks he's from the future":
✅ CORRECT (actual plot concepts):
- "Comedy where man tries convincing others he's from 2087 but fails hilariously"
- "Drama about someone whose future memories turn out to be elaborate dreams"
- "Man believes he's time traveler but discovers he just watches too much sci-fi"
- "Office comedy where employee thinks modern technology proves he's from tomorrow"
- "Family struggles with father who insists he's from year 3000"

❌ WRONG (just titles/names):
- "Time Traveler"
- "Future Shock" 
- "The Man from Tomorrow"
- "Temporal Confusion"

Each response should be a STORY CONCEPT that explains what the play is about, not just a title.

Format as JSON: [{"title": "Comedy where man tries convincing others he's from 2087 but fails hilariously"}, {"title": "Drama about someone whose future memories turn out to be elaborate dreams"}]`;

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