import OpenAI from 'openai';
import fs from 'fs';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioFilePath: string): Promise<{ text: string, duration?: number }> {
  try {
    console.log('🎤 Transcribing audio file:', audioFilePath);
    
    const audioReadStream = fs.createReadStream(audioFilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
      response_format: "json",
      temperature: 0.2, // Lower temperature for more focused transcription
    });

    console.log('🎤 Whisper transcription result:', transcription.text);

    return {
      text: transcription.text.trim(),
      duration: transcription.duration || 0,
    };
  } catch (error) {
    console.error('❌ Whisper transcription failed:', error);
    throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}