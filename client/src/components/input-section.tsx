import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Edit, Upload, Sparkles, Mic, MicOff, Square } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Idea } from "@shared/schema";

interface InputSectionProps {
  onIdeasGenerated: (ideas: Idea[]) => void;
  promptValue?: string;
  onPromptChange?: (prompt: string) => void;
  shouldAutoGenerate?: boolean;
}

export function InputSection({ onIdeasGenerated, promptValue = "", onPromptChange, shouldAutoGenerate = false }: InputSectionProps) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPrompt, setTextPrompt] = useState(promptValue);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Text prompt mutation
  const generateFromTextMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ideas/generate-from-text", {
        prompt,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.ideas) {
        // Clear existing state and provide fresh ideas
        onIdeasGenerated(data.ideas);
        setTextPrompt("");
        onPromptChange?.("");
        setShowTextInput(false); // Hide input after generation
        toast({
          title: "Ideas Generated!",
          description: "Fresh creativity from your prompt ✨",
          duration: 1000,
          variant: "success",
        });
      }
    },
    onError: () => {
      toast({
        title: "Oops!",
        description: "Couldn't generate ideas. Try again?",
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  // Audio transcription and idea generation mutation
  const generateFromAudioMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      const response = await fetch('/api/ideas/generate-from-audio', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.ideas) {
        onIdeasGenerated(data.ideas);
        toast({
          title: "Ideas Generated!",
          description: `From your voice: "${data.transcription?.slice(0, 50)}${data.transcription?.length > 50 ? '...' : ''}"`,
          duration: 3000,
          variant: "success",
        });
      }
    },
    onError: (error) => {
      console.error('Audio generation error:', error);
      toast({
        title: "Voice Processing Failed",
        description: "Couldn't understand the audio. Try speaking clearly.",
        variant: "destructive",
        duration: 2000,
      });
    },
  });

  // Image analysis mutation
  const generateFromImageMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const response = await apiRequest("POST", "/api/ideas/generate-from-image", {
        imageBase64,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.ideas) {
        // Clear existing state and provide fresh ideas 
        onIdeasGenerated(data.ideas);
        // Keep image visible after generation so user can see what inspired the ideas
        // setUploadedImage(null); // Don't clear - keep for reference
        toast({
          title: "Ideas Generated!",
          description: "Creative magic from your image 🎨",
          duration: 1000,
          variant: "success",
        });
      }
    },
    onError: () => {
      toast({
        title: "Hmm...",
        description: "Couldn't analyze that image. Try another?",
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  // Function to compress and resize image
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800px on longest side)
        const maxSize = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImage(file);
        const base64 = compressedDataUrl.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        setUploadedImage(compressedDataUrl);
        generateFromImageMutation.mutate(base64);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process image. Try a different one?",
          variant: "destructive",
          duration: 2000,
        });
      }
    }
  };

  // Convert audio blob to WAV format
  const convertToWav = async (webmBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const fileReader = new FileReader();
      
      fileReader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Convert to WAV
          const wav = audioBufferToWav(audioBuffer);
          const wavBlob = new Blob([wav], { type: 'audio/wav' });
          resolve(wavBlob);
        } catch (error) {
          reject(error);
        }
      };
      
      fileReader.onerror = () => reject(new Error('Failed to read audio file'));
      fileReader.readAsArrayBuffer(webmBlob);
    });
  };

  // Convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert audio data
    const offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset + (i * numberOfChannels + channel) * 2, sample * 0x7FFF, true);
      }
    }
    
    return arrayBuffer;
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      // Try different MIME types for better compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose
          }
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunks, { type: mimeType || 'audio/webm' });
          
          // Convert to WAV for OpenAI compatibility
          const wavBlob = await convertToWav(audioBlob);
          generateFromAudioMutation.mutate(wavBlob);
        } catch (error) {
          console.error('Error converting audio:', error);
          toast({
            title: "Audio Processing Failed",
            description: "Could not process the recording. Try again.",
            variant: "destructive",
            duration: 3000,
          });
        }
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to record voice prompts.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerateFromText = () => {
    if (textPrompt.trim()) {
      generateFromTextMutation.mutate(textPrompt.trim());
    }
  };

  const handleTextPromptChange = (value: string) => {
    setTextPrompt(value);
    onPromptChange?.(value);
  };

  // Update local state when controlled value changes
  useEffect(() => {
    setTextPrompt(promptValue);
    if (promptValue) {
      setShowTextInput(true);
    }
  }, [promptValue]);

  // Auto-generate ideas only when explicitly requested (from swipe up)
  useEffect(() => {
    if (shouldAutoGenerate && promptValue) {
      generateFromTextMutation.mutate(promptValue);
    }
  }, [shouldAutoGenerate, promptValue]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (isRecording && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const isLoading = generateFromTextMutation.isPending || generateFromImageMutation.isPending || generateFromAudioMutation.isPending;

  return (
    <div className="mb-3 relative z-10">
      <div className="bg-card border border-border rounded-xl p-4 card-shadow">
        <div className="flex flex-row gap-3">
          {/* Image Upload Button */}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
            disabled={isLoading}
          />
          <Button
            asChild
            className="flex-1 bg-card-blue-gray-bg border-card-blue-gray/40 hover:bg-card-blue-gray-bg/90 hover-lift text-card-blue-gray rounded-lg py-3 px-4 font-medium card-shadow touch-target text-center transition-all duration-300"
            disabled={isLoading}
          >
            <label htmlFor="image-upload" className="cursor-pointer flex items-center justify-center text-card-blue-gray font-medium">
              <Camera className="mr-2 h-4 w-4" />
              Upload Image
            </label>
          </Button>

          {/* Text Input Toggle */}
          <Button
            onClick={() => setShowTextInput(!showTextInput)}
            className="flex-1 bg-card-sage-bg border-card-sage/40 hover:bg-card-sage-bg/90 hover-lift text-card-sage rounded-lg py-3 px-4 font-medium card-shadow touch-target text-center transition-all duration-300"
            disabled={isLoading}
          >
            <Edit className="mr-2 h-4 w-4" />
            Write Text
          </Button>
        </div>

        {/* Audio Recording Button - Centered Below */}
        <div className="mt-3 flex justify-center">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-48 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white border-red-600 animate-pulse'
                : 'bg-card-cream-bg border-card-cream/40 hover:bg-card-cream-bg/90 text-card-cream'
            } hover-lift rounded-lg py-3 px-4 font-medium card-shadow touch-target text-center transition-all duration-300`}
            disabled={isLoading && !isRecording}
          >
            {isRecording ? (
              <>
                <Square className="mr-2 h-4 w-4" />
                {formatDuration(recordingDuration)}
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Voice Input
              </>
            )}
          </Button>
        </div>
        
        {/* Text Input Area */}
        {showTextInput && (
          <div className="mt-4 space-y-3">
            <Textarea 
              value={textPrompt}
              onChange={(e) => handleTextPromptChange(e.target.value)}
              className="w-full h-24 p-3 bg-background border border-input rounded-lg focus:border-ring focus:outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground" 
              placeholder="Describe your creative inspiration or what you'd like ideas about..."
              disabled={isLoading}
            />
            <Button
              onClick={handleGenerateFromText}
              disabled={!textPrompt.trim() || isLoading}
              className="w-full bg-card-purple-gray-bg border-card-purple-gray/40 hover:bg-card-purple-gray-bg/90 hover-lift text-card-purple-gray rounded-lg py-3 font-medium touch-target transition-all duration-300 card-shadow"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating Ideas...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Ideas
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Upload Preview Area - Enhanced */}
        {uploadedImage && (
          <div className="mt-4 p-3 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-foreground">Uploaded Image</h3>
              <Button
                onClick={() => setUploadedImage(null)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            <img 
              src={uploadedImage} 
              alt="Uploaded for inspiration" 
              className="max-h-20 mx-auto rounded object-cover border border-border"
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {isLoading ? "Analyzing your image..." : "Image ready for idea generation"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
