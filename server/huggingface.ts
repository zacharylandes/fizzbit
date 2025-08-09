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

export async function generateIdeasFromText(prompt: string): Promise<IdeaResponse[]> {
  try {
    // For now, use a simple prompt-based approach since Llama model has compatibility issues
    // We'll generate creative ideas based on the prompt
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
      }
    ];

    // Generate unique ideas based on the prompt
    const ideas = ideaTemplates.map((template, index) => {
      const topic = prompt.toLowerCase();
      return {
        id: `hf-${Date.now()}-${index}`,
        title: `${template.titlePrefix} ${prompt}`,
        description: template.descriptionTemplate.replace('{topic}', topic)
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

export async function generateIdeasFromImage(imageBase64: string): Promise<IdeaResponse[]> {
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
      // Use actual image content for personalized ideas
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
        }
      ];

      return personalizedTemplates.map((template, index) => ({
        id: `analyzed-img-${Date.now()}-${index}`,
        title: template.title,
        description: template.description,
        sourceContent: `Image: ${imageDescription}`
      }));
    } else {
      // Fallback generic image-inspired ideas
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
        }
      ];

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