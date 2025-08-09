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

// Llama 3 model for text generation
const LLAMA_MODEL = 'meta-llama/Meta-Llama-3-8B-Instruct';

export async function generateIdeasFromText(prompt: string): Promise<IdeaResponse[]> {
  try {
    const systemPrompt = `You are a creative idea generator. Generate exactly 3 unique, creative, and actionable ideas based on the user's prompt. Each idea should be innovative and inspiring.

Format your response as valid JSON with this structure:
{
  "ideas": [
    {
      "title": "Creative Title Here",
      "description": "Detailed description of the idea, explaining what it is, how it works, and why it's interesting. Keep it engaging and specific."
    }
  ]
}

User prompt: ${prompt}

Generate 3 diverse, creative ideas:`;

    const response = await hf.textGeneration({
      model: LLAMA_MODEL,
      inputs: systemPrompt,
      parameters: {
        max_new_tokens: 800,
        temperature: 0.8,
        top_p: 0.9,
        return_full_text: false,
      },
    });

    let responseText = response.generated_text;
    
    // Clean up the response to extract JSON
    responseText = responseText.trim();
    
    // Find JSON in the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.ideas || !Array.isArray(parsed.ideas)) {
      throw new Error('Invalid response format');
    }

    return parsed.ideas.map((idea: any, index: number) => ({
      id: `llama-${Date.now()}-${index}`,
      title: idea.title || `Creative Idea ${index + 1}`,
      description: idea.description || 'An innovative creative concept.'
    }));

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
    // Use Hugging Face's image-to-text model to analyze the image first
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    const imageDescription = await hf.imageToText({
      data: imageBuffer,
      model: 'Salesforce/blip-image-captioning-large',
    });

    const description = imageDescription.generated_text;
    
    // Now generate ideas based on the image description
    const systemPrompt = `You are a creative idea generator. Based on this image description: "${description}", generate exactly 3 unique, creative, and actionable ideas.

Format your response as valid JSON with this structure:
{
  "ideas": [
    {
      "title": "Creative Title Here", 
      "description": "Detailed description of the idea, explaining what it is, how it works, and why it's interesting. Keep it engaging and specific."
    }
  ]
}

Generate 3 diverse, creative ideas inspired by the image:`;

    const response = await hf.textGeneration({
      model: LLAMA_MODEL,
      inputs: systemPrompt,
      parameters: {
        max_new_tokens: 800,
        temperature: 0.8,
        top_p: 0.9,
        return_full_text: false,
      },
    });

    let responseText = response.generated_text;
    
    // Clean up the response to extract JSON
    responseText = responseText.trim();
    
    // Find JSON in the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.ideas || !Array.isArray(parsed.ideas)) {
      throw new Error('Invalid response format');
    }

    return parsed.ideas.map((idea: any, index: number) => ({
      id: `llama-img-${Date.now()}-${index}`,
      title: idea.title || `Image-Inspired Idea ${index + 1}`,
      description: idea.description || 'A creative concept inspired by your image.'
    }));

  } catch (error) {
    console.error('Hugging Face image processing error:', error);
    
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