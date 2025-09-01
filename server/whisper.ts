import OpenAI from 'openai';
import fs from 'fs';
import { HfInference } from '@huggingface/inference';

if (!process.env.OPENAI_API_KEY && !process.env.HUGGINGFACE_API_KEY) {
  throw new Error('Either OPENAI_API_KEY or HUGGINGFACE_API_KEY environment variable is required');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

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
    
    // Try Hugging Face Whisper Large V3 first (more accurate)
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        console.log('🎤 Trying Hugging Face Whisper Large V3...');
        const audioBuffer = fs.readFileSync(audioFilePath);
        
        const result = await hf.automaticSpeechRecognition({
          data: audioBuffer,
          model: 'openai/whisper-large-v3'
        });
        
        if (result && result.text && result.text.trim()) {
          console.log('🎤 HF Whisper Large V3 transcription result:', result.text);
          return {
            text: result.text.trim(),
            duration: 0 // HF doesn't return duration
          };
        }
      } catch (hfError) {
        console.log('🎤 HF Whisper Large V3 failed, trying medium model:', hfError instanceof Error ? hfError.message : 'Unknown error');
        
        // Try Whisper Medium as fallback
        try {
          const audioBuffer = fs.readFileSync(audioFilePath);
          
          const result = await hf.automaticSpeechRecognition({
            data: audioBuffer,
            model: 'openai/whisper-medium'
          });
          
          if (result && result.text && result.text.trim()) {
            console.log('🎤 HF Whisper Medium transcription result:', result.text);
            return {
              text: result.text.trim(),
              duration: 0
            };
          }
        } catch (hfMediumError) {
          console.log('🎤 HF Whisper Medium failed, falling back to OpenAI:', hfMediumError instanceof Error ? hfMediumError.message : 'Unknown error');
        }
      }
    }
    
    // Fallback to OpenAI Whisper with improved settings
    console.log('🎤 Using OpenAI Whisper as fallback...');
    const audioReadStream = fs.createReadStream(audioFilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
      response_format: "verbose_json", // Get more detailed response
      temperature: 0.0, // Most focused transcription
      language: "en", // Specify English for better accuracy
      prompt: "This is a creative prompt or idea description." // Context hint
    });

    console.log('🎤 OpenAI Whisper transcription result:', transcription.text);

    return {
      text: transcription.text.trim(),
      duration: transcription.duration || 0,
    };
  } catch (error) {
    console.error('❌ All transcription methods failed:', error);
    throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}