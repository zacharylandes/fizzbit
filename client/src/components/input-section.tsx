import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Edit, Upload, Sparkles, Mic, MicOff, Square, Paintbrush } from "lucide-react";
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
  const [showDrawingPad, setShowDrawingPad] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('/api/ideas/generate-from-audio', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onMutate: () => {
      // Show immediate processing feedback when recording stops
      toast({
        title: "Processing Voice Input",
        description: "Transcribing your audio and generating ideas...",
        duration: 2000,
      });
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

  // Drawing mutation
  const generateFromDrawingMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const response = await apiRequest("POST", "/api/ideas/generate-from-image", {
        imageBase64,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.ideas) {
        onIdeasGenerated(data.ideas);
        // Clear the drawing after generation
        clearCanvas();
        setShowDrawingPad(false);
        toast({
          title: "Ideas Generated!",
          description: "Creative inspiration from your drawing!",
          duration: 1000,
          variant: "success",
        });
      }
    },
    onError: () => {
      toast({
        title: "Drawing Analysis Failed",
        description: "Couldn't analyze your drawing. Try again?",
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
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType || 'audio/webm' });
        generateFromAudioMutation.mutate(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Simple counter approach - increment every second
      let seconds = 0;
      recordingIntervalRef.current = setInterval(() => {
        seconds++;
        console.log('⏰ Simple timer tick:', seconds);
        setRecordingDuration(seconds);
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
    console.log('🛑 Stop recording called, current state:', { isRecording, hasRecorder: !!mediaRecorderRef.current });
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('⏹️ Recording stopped, clearing interval');
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
        console.log('✅ Interval cleared');
      }
      
      // Keep duration visible until processing starts, then reset
      setTimeout(() => setRecordingDuration(0), 500);
    }
  };

  // Drawing pad functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#333';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const submitDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Convert canvas to base64 image
    const imageBase64 = canvas.toDataURL('image/png').split(',')[1];
    generateFromDrawingMutation.mutate(imageBase64);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
    console.log('⏱️ Formatting duration:', seconds, '→', formatted);
    return formatted;
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

        {/* Voice Input and Drawing Buttons - Side by Side */}
        <div className="mt-3 flex justify-center gap-3">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex-1 max-w-[140px] ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-md'
                : generateFromAudioMutation.isPending
                ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500 shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-sm'
            } rounded-xl py-4 px-4 font-medium text-center transition-all duration-200 ease-in-out`}
            disabled={(isLoading || generateFromAudioMutation.isPending) && !isRecording}
          >
            {generateFromAudioMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Processing...
              </>
            ) : isRecording ? (
              <>
                <div className="w-3 h-3 bg-white rounded-sm mr-2"></div>
                {recordingDuration}s
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Voice Input
              </>
            )}
          </Button>

          <Button
            onClick={() => setShowDrawingPad(!showDrawingPad)}
            className={`flex-1 max-w-[140px] ${
              showDrawingPad
                ? 'bg-purple-500 hover:bg-purple-600 text-white border-purple-500 shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-sm'
            } rounded-xl py-4 px-4 font-medium text-center transition-all duration-200 ease-in-out`}
            disabled={isLoading}
          >
            <Paintbrush className="mr-2 h-4 w-4" />
            Draw
          </Button>
        </div>

        {/* Drawing Pad */}
        {showDrawingPad && (
          <div className="mt-4 p-4 bg-background border border-input rounded-lg">
            <div className="flex flex-col items-center space-y-3">
              <canvas
                ref={canvasRef}
                width={300}
                height={200}
                className="border border-input rounded-lg cursor-crosshair touch-none"
                style={{ touchAction: 'none' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <div className="flex gap-2">
                <Button
                  onClick={clearCanvas}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Clear
                </Button>
                <Button
                  onClick={submitDrawing}
                  disabled={generateFromDrawingMutation.isPending}
                  className="bg-card-purple-gray-bg border-card-purple-gray/40 hover:bg-card-purple-gray-bg/90 text-card-purple-gray text-xs"
                >
                  {generateFromDrawingMutation.isPending ? (
                    <>
                      <div className="w-3 h-3 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1 h-3 w-3" />
                      Generate Ideas
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        
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
