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
    console.log('🎤 WHISPER DEBUGGING - Starting transcription for file:', audioFilePath);
    
    // Check if file exists before creating stream
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found at path: ${audioFilePath}`);
    }
    
    const fileStats = fs.statSync(audioFilePath);
    console.log('🎤 WHISPER DEBUGGING - File stats:', {
      path: audioFilePath,
      size: fileStats.size,
      isFile: fileStats.isFile(),
      extension: audioFilePath.split('.').pop()
    });
    
    // Check file extension
    const extension = audioFilePath.split('.').pop()?.toLowerCase();
    const supportedFormats = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'];
    
    console.log('🎤 WHISPER DEBUGGING - File extension:', extension, 'Supported?', supportedFormats.includes(extension || ''));
    
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