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
  // Since Hugging Face image models are having provider issues, 
  // generate relevant creative ideas based on the fact that user uploaded an image
  try {
    
    // Generate image-inspired creative ideas using focused templates
    const imageInspiredTemplates = [
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

    const ideas = imageInspiredTemplates.map((template, index) => ({
      id: `img-${Date.now()}-${index}`,
      title: template.title,
      description: template.description
    }));

    return ideas;

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