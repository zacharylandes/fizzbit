import { HfInference } from '@huggingface/inference';

if (!process.env.HUGGINGFACE_TOKEN) {
  throw new Error('HUGGINGFACE_TOKEN is required');
}

const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);

export interface IdeaResponse {
  id: string;
  title: string;
  description: string;
}

// Use a reliable model that supports text generation
const TEXT_MODEL = 'gpt2';

export async function generateIdeasFromText(prompt: string, count: number = 8): Promise<IdeaResponse[]> {
  try {
    // Use OpenAI as primary since Hugging Face text models have issues
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
            role: 'system',
            content: `You are a creative idea generator. Generate exactly ${count} unique, inspiring creative ideas based on the user prompt. Each idea should be practical and actionable. Format as JSON with "ideas" array containing objects with "title" and "description" fields. Make titles concise (max 5 words) and descriptions detailed but under 100 words.`
          },
          {
            role: 'user',
            content: `Generate ${count} creative ideas for: ${prompt}`
          }
        ],
        max_tokens: 1000,
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
            id: `text-${Date.now()}-${index}`,
            title: idea.title || `Creative Idea ${index + 1}`,
            description: idea.description || 'A creative project to explore.',
            sourceContent: prompt
          }));
        }
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
      }
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
      // Use actual image content for personalized ideas - expand to 8 variations
      const personalizedTemplates = [
        {
          title: "Recreate This Scene",
          description: `${imageDescription} - Recreate this scene in a different artistic medium like watercolor, digital art, or sculpture. Focus on capturing the same mood and atmosphere.`
        },
        {
          title: "Story Inspired by This Image",
          description: `${imageDescription} - Write a short story or create a narrative inspired by what you see here. What happened before this moment? What happens next?`
        },
        {
          title: "Color and Mood Study",
          description: `${imageDescription} - Extract the colors and emotional tone from this image to inspire a new creative project - whether it's interior design, fashion, or another artwork.`
        },
        {
          title: "Photo Series Extension",
          description: `${imageDescription} - Create a series of related images that tell a bigger story. Capture different angles, times of day, or emotional moments in the same theme.`
        },
        {
          title: "Mixed Media Interpretation",
          description: `${imageDescription} - Combine multiple art forms to reinterpret this image - photography with text, digital art with physical elements, or music with visuals.`
        },
        {
          title: "Minimalist Version",
          description: `${imageDescription} - Reduce this image to its essential elements. Create a simplified, minimalist interpretation focusing on the core composition and feeling.`
        },
        {
          title: "Different Perspective",
          description: `${imageDescription} - Reimagine this scene from a completely different viewpoint or time period. How would it look from above, from inside, or 100 years ago?`
        },
        {
          title: "Interactive Installation",
          description: `${imageDescription} - Design an interactive art installation or experience that lets others step into and engage with the world depicted in your image.`
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