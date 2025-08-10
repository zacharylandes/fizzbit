import { HfInference } from '@huggingface/inference';

if (!process.env.HUGGINGFACE_TOKEN) {
  throw new Error('HUGGINGFACE_TOKEN is required');
}

const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);

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

// Helper function to generate related ideas using OpenAI
export async function generateRelatedIdeas(contextualPrompt: string, count: number = 3): Promise<IdeaResponse[]> {
  try {
    console.log('Using OpenAI for related ideas...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Use mini for speed and cost efficiency
        messages: [
          {
            role: 'system',
            content: `You are a creative inspiration assistant. Generate ideas that thoughtfully combine user interests with specific concepts they've shown enthusiasm for. Create ideas that feel like natural extensions bridging multiple creative concepts together. Format as JSON with "ideas" array containing objects with "title" and "description" fields.`
          },
          {
            role: 'user',
            content: contextualPrompt
          }
        ],
        max_tokens: 600,
        temperature: 0.8,
        response_format: { type: "json_object" }
      })
    });

    if (openaiResponse.ok) {
      const openaiData = await openaiResponse.json();
      const content = openaiData.choices[0].message.content;
      
      try {
        const parsed = JSON.parse(content);
        if (parsed.ideas && Array.isArray(parsed.ideas)) {
          return parsed.ideas.slice(0, count).map((idea: any, index: number) => ({
            id: `openai-related-${Date.now()}-${index}`,
            title: idea.title || `Related Idea ${index + 1}`,
            description: idea.description || 'A related creative concept.',
            sourceContent: 'Related ideas'
          }));
        }
      } catch (parseError) {
        console.error('Failed to parse OpenAI related ideas response:', parseError);
      }
    }

    return [];
  } catch (error) {
    console.error('OpenAI related ideas generation failed:', error);
    return [];
  }
}

export async function generateIdeasFromText(prompt: string, count: number = 8): Promise<IdeaResponse[]> {
  try {
    console.log('Using OpenAI for reliable text generation...');
    
    // Detect if user is asking for a list format
    const isListRequest = /\b(list|names?|titles?|suggestions?|options?)\b/i.test(prompt) && 
                         !/\b(idea|project|concept|activity|exercise)\b/i.test(prompt);
    
    // Use OpenAI directly for reliable results
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Use mini for speed and cost efficiency
        messages: [
          {
            role: 'system',
            content: isListRequest 
              ? `You are a creative brainstorming assistant. Generate exactly ${count} concise, creative suggestions based on the user's request. Each suggestion should be a simple name or title, not a detailed explanation. Format as JSON with "ideas" array containing objects with "title" and "description" fields. The title should be the main suggestion (max 4 words), and the description should be very brief - just one short phrase or sentence (max 15 words).`
              : `You are a creative idea generator. Generate exactly ${count} unique, inspiring creative ideas based on the user prompt. Each idea should be practical and actionable. Format as JSON with "ideas" array containing objects with "title" and "description" fields. Make titles concise (max 5 words) and descriptions detailed but under 100 words.`
          },
          {
            role: 'user',
            content: isListRequest 
              ? `Generate ${count} suggestions for: ${prompt}`
              : `Generate ${count} creative ideas for: ${prompt}`
          }
        ],
        max_tokens: isListRequest ? 600 : 1000,
        temperature: 0.8,
        response_format: { type: "json_object" }
      })
    });

    if (openaiResponse.ok) {
      const openaiData = await openaiResponse.json();
      const content = openaiData.choices[0].message.content;
      
      try {
        const parsed = JSON.parse(content);
        if (parsed.ideas && Array.isArray(parsed.ideas)) {
          return parsed.ideas.map((idea: any, index: number) => ({
            id: `openai-${Date.now()}-${index}`,
            title: idea.title || `Creative Idea ${index + 1}`,
            description: idea.description || 'A creative project to explore.',
            sourceContent: prompt
          }));
        }
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
      }
    } else {
      console.error('OpenAI API error:', openaiResponse.status, openaiResponse.statusText);
    }

    // Fallback to template-based ideas if OpenAI fails
    const ideaTemplates = [
      {
        titlePrefix: "Creative Workshop:",
        descriptionTemplate: "Design an interactive workshop about {topic}. Include hands-on activities, group collaboration, and skill-building exercises that inspire participants to explore new creative techniques."
      },
      {
        titlePrefix: "Digital Project:",
        descriptionTemplate: "Create a multimedia experience around {topic}. Combine storytelling, technology, and user interaction to build something engaging that brings your concept to life."
      },
      {
        titlePrefix: "Community Initiative:",
        descriptionTemplate: "Start a community project focused on {topic}. Bring people together through challenges, shared goals, and collaborative creation that builds connections and inspires action."
      },
      {
        titlePrefix: "Art Series:",
        descriptionTemplate: "Create a collection of artworks exploring {topic}. Use different mediums and techniques to express various aspects and emotions related to your theme."
      },
      {
        titlePrefix: "Interactive Experience:",
        descriptionTemplate: "Design an immersive experience around {topic} that engages multiple senses and invites participation from your audience."
      },
      {
        titlePrefix: "Storytelling Project:",
        descriptionTemplate: "Develop a narrative-driven project about {topic} using your preferred medium - writing, video, podcast, or visual storytelling."
      },
      {
        titlePrefix: "Learning Journey:",
        descriptionTemplate: "Create an educational pathway that teaches others about {topic} through engaging activities, challenges, and hands-on exploration."
      },
      {
        titlePrefix: "Social Impact:",
        descriptionTemplate: "Design a project that uses {topic} to make a positive difference in your community or address a meaningful cause."
      }
    ];

    // Take first 'count' templates and generate ideas
    const selectedTemplates = ideaTemplates.slice(0, count);
    const ideas = selectedTemplates.map((template, index) => {
      const topic = prompt.toLowerCase();
      return {
        id: `template-${Date.now()}-${index}`,
        title: template.titlePrefix.replace(':', ''),
        description: template.descriptionTemplate.replace('{topic}', topic),
        sourceContent: prompt
      };
    });

    return ideas;

  } catch (error) {
    console.error('Hugging Face API error:', error);
    
    // Fallback response if API fails
    return [
      {
        id: `fallback-${Date.now()}-1`,
        title: "Creative Workshop",
        description: "Organize a hands-on workshop where participants explore creative techniques related to your interest. Include interactive activities and collaborative projects."
      },
      {
        id: `fallback-${Date.now()}-2`, 
        title: "Digital Storytelling Project",
        description: "Create a multimedia storytelling experience that combines your passion with modern technology. Use videos, interactive elements, and user participation."
      },
      {
        id: `fallback-${Date.now()}-3`,
        title: "Community Challenge",
        description: "Design a creative challenge that brings people together around your interest. Include social sharing, progress tracking, and celebration of achievements."
      }
    ];
  }
}

export async function generateIdeasFromImage(imageBase64: string, count: number = 8): Promise<IdeaResponse[]> {
  try {
    // First try Hugging Face image analysis
    let imageDescription = '';
    
    try {
      const imageBuffer = Buffer.from(imageBase64, 'base64');
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
                content: `You are a creative idea generator. Generate exactly ${count} unique, inspiring creative ideas based on the image description provided. Each idea should be practical and actionable with completely different approaches. Format as JSON with "ideas" array containing objects with "title" and "description" fields. Make titles concise (max 5 words) and descriptions detailed but under 100 words. Ensure each idea is completely unique and diverse.`
              },
              {
                role: 'user',
                content: `Based on this image: "${imageDescription}" - Generate ${count} completely different creative project ideas that are inspired by what's shown in the image.`
              }
            ],
            max_tokens: 1200,
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