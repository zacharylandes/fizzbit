import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Edit, Upload, Sparkles, Mic, MicOff, Square, Paintbrush, Trash2 } from "lucide-react";
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

export function InputSection({ 
  onIdeasGenerated, 
  promptValue = "", 
  onPromptChange, 
  shouldAutoGenerate = false
}: InputSectionProps) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPrompt, setTextPrompt] = useState(promptValue);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showDrawingPad, setShowDrawingPad] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingCounterRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { toast } = useToast();

  // Text prompt mutation
  const generateFromTextMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ideas/generate-from-text", {
        prompt
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.ideas) {
        // Clear existing state and provide fresh ideas
        onIdeasGenerated(data.ideas);
        setTextPrompt("");
        // Don't clear currentPrompt - keep it for maintaining context during prefetch
        // onPromptChange?.(""); 
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
  // No longer needed - using Web Speech API directly

  // Image analysis mutation
  const generateFromImageMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const response = await apiRequest("POST", "/api/ideas/generate-from-image", {
        imageBase64
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
      const response = await apiRequest("POST", "/api/ideas/generate-from-drawing", {
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



  // OpenAI Whisper for high-accuracy speech recognition
  const startWhisperRecognition = () => {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Microphone Not Supported",
        description: "Please use the text input instead.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    // Start recording with MediaRecorder
    navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000, // Higher sample rate for better quality
        channelCount: 1 // Mono for speech
      } 
    })
      .then(stream => {
        // Create MediaRecorder with optimal settings for better quality
        let options = { 
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 128000 // Higher bitrate for better quality
        };
        
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'audio/webm', audioBitsPerSecond: 128000 };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'audio/mp4', audioBitsPerSecond: 128000 };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'audio/wav', audioBitsPerSecond: 128000 };
        }
        
        mediaRecorder = new MediaRecorder(stream, options);
        audioChunks = [];
        
        // Set up recording state
        setIsRecording(true);
        setRecordingDuration(0);
        recordingCounterRef.current = 0;
        
        // Start timer
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
        
        recordingIntervalRef.current = setInterval(() => {
          recordingCounterRef.current++;
          setRecordingDuration(recordingCounterRef.current);
        }, 1000);
        
        toast({
          title: "Recording...",
          description: "Speak clearly - using professional speech recognition",
          duration: 1500,
        });
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          // Stop all streams
          stream.getTracks().forEach(track => track.stop());
          
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
          }
          
          if (audioChunks.length === 0) {
            setIsRecording(false);
            toast({
              title: "No Audio Recorded",
              description: "Please try recording again.",
              variant: "destructive",
              duration: 3000,
            });
            return;
          }
          
          // Create audio blob and send to Whisper
          const audioBlob = new Blob(audioChunks, { type: mediaRecorder?.mimeType || 'audio/webm' });
          console.log('🎤 Audio recorded, size:', audioBlob.size, 'bytes');
          
          // Show processing message
          toast({
            title: "Processing Speech...",
            description: "Converting your voice to text with AI",
            duration: 2000,
          });
          
          try {
            // Send to backend for Whisper processing
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            
            const response = await fetch('/api/speech/transcribe', {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) {
              throw new Error(`Transcription failed: ${response.status}`);
            }
            
            const result = await response.json();
            const transcript = result.text?.trim();
            
            if (!transcript || transcript.length < 2) {
              throw new Error('No speech detected in recording');
            }
            
            console.log('🎤 Whisper transcript:', transcript);
            
            // Update UI with transcript
            setTextPrompt(transcript);
            if (onPromptChange) {
              onPromptChange(transcript);
            }
            
            // Generate ideas
            generateFromTextMutation.mutate(transcript);
            
            toast({
              title: "Speech Recognized!",
              description: `"${transcript}"`,
              duration: 3000,
            });
            
          } catch (error) {
            console.error('Whisper transcription failed:', error);
            toast({
              title: "Speech Recognition Failed",
              description: "Please try speaking again or use text input.",
              variant: "destructive",
              duration: 4000,
            });
          } finally {
            setIsRecording(false);
            setCurrentRecognition(null);
          }
        };
        
        // Auto-stop after 30 seconds
        const autoStopTimeout = setTimeout(() => {
          if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, 30000);
        
        // Store recorder for manual stopping
        setCurrentRecognition({
          stop: () => {
            clearTimeout(autoStopTimeout);
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          }
        });
        
        // Start recording
        mediaRecorder.start(1000); // Collect data every second
        console.log('🎤 Whisper recording started');
        
      })
      .catch(error => {
        console.error('Failed to access microphone:', error);
        setIsRecording(false);
        
        let errorMessage = "Could not access your microphone.";
        if (error.name === 'NotAllowedError') {
          errorMessage = "Microphone access denied. Please allow microphone access in your browser settings.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No microphone found. Please check your audio devices.";
        }
        
        toast({
          title: "Microphone Error",
          description: errorMessage,
          variant: "destructive",
          duration: 4000,
        });
      });
  };

  // Audio recording functions using Whisper
  const startRecording = startWhisperRecognition;

  // Store recognition instance globally to allow manual control
  const [currentRecognition, setCurrentRecognition] = useState<any>(null);

  const stopRecording = () => {
    if (isRecording && currentRecognition) {
      currentRecognition.stop();
      setCurrentRecognition(null);
      setIsRecording(false);
      setRecordingDuration(0);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      toast({
        title: "Voice Input Stopped",
        description: "Processing your speech...",
        duration: 1000,
      });
    }
  };

  const cancelRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setRecordingDuration(0);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      toast({
        title: "Recording Cancelled",
        description: "Voice input was discarded",
        duration: 1000,
        variant: "info",
      });
    }
  };

  // Drawing pad functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): void => {
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

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): void => {
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

  // Cleanup recording on unmount only
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []); // Empty dependency array - only run on unmount

  const isLoading = generateFromTextMutation.isPending || generateFromImageMutation.isPending || generateFromDrawingMutation.isPending;

  return (
    <div className="mb-3 relative z-10">
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
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
            className="flex-1 bg-card-blue border border-gray-300 hover:bg-card-blue/90 text-gray-700 rounded-lg py-3 px-4 font-medium shadow-sm touch-target text-center transition-all duration-300"
            disabled={isLoading}
          >
            <label htmlFor="image-upload" className="cursor-pointer flex items-center justify-center text-gray-700 font-medium">
              <Camera className="mr-2 h-4 w-4" />
              Upload Image
            </label>
          </Button>

          {/* Text Input Toggle */}
          <Button
            onClick={() => setShowTextInput(!showTextInput)}
            className="flex-1 bg-card-mint border border-gray-300 hover:bg-card-mint/90 text-gray-700 rounded-lg py-3 px-4 font-medium shadow-sm touch-target text-center transition-all duration-300"
            disabled={isLoading}
          >
            <Edit className="mr-2 h-4 w-4" />
            Write Text
          </Button>
        </div>

        {/* Voice Input and Drawing Buttons - Side by Side */}
        <div className="mt-3 flex gap-3">
          {isRecording ? (
            // Recording controls - Stop and Cancel
            <>
              <Button
                onClick={stopRecording}
                className="flex-1 bg-card-coral border border-gray-300 hover:bg-card-coral/90 text-gray-700 shadow-sm rounded-lg py-3 px-4 font-medium text-center transition-all duration-300 touch-target"
              >
                <div className="w-3 h-3 bg-white rounded-sm mr-2"></div>
                {formatDuration(recordingDuration)}
              </Button>
              <Button
                onClick={cancelRecording}
                className="bg-card-soft-coral border border-gray-300 hover:bg-card-soft-coral/90 text-gray-700 shadow-sm rounded-lg py-3 px-4 font-medium text-center transition-all duration-300 touch-target"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            // Normal voice input button
            <Button
              onClick={startRecording}
              className="flex-1 bg-card-peach border border-gray-300 hover:bg-card-peach/90 text-gray-700 shadow-sm rounded-lg py-3 px-4 font-medium text-center transition-all duration-300 touch-target"
              disabled={isLoading}
            >
              <Mic className="mr-2 h-4 w-4" />
              Voice Input
            </Button>
          )}

          <Button
            onClick={() => setShowDrawingPad(!showDrawingPad)}
            className={`flex-1 ${
              showDrawingPad
                ? 'bg-card-plum border border-gray-300 hover:bg-card-plum/90 text-gray-700 shadow-sm'
                : 'bg-card-muted-gold border border-gray-300 hover:bg-card-muted-gold/90 text-gray-700 shadow-sm'
            } rounded-lg py-3 px-4 font-medium text-center transition-all duration-300 touch-target`}
            disabled={isLoading}
          >
            <Paintbrush className="mr-2 h-4 w-4" />
            Draw
          </Button>
        </div>

        {/* Drawing Pad */}
        {showDrawingPad && (
          <div className="mt-4 p-4 bg-card-mint border border-gray-200 rounded-lg shadow-sm">
            <div className="flex flex-col items-center space-y-3">
              <canvas
                ref={canvasRef}
                width={300}
                height={200}
                className="border-2 border-card-mint rounded-lg cursor-crosshair touch-none bg-white card-shadow"
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
                  className="text-xs border border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm"
                >
                  Clear
                </Button>
                <Button
                  onClick={submitDrawing}
                  disabled={generateFromDrawingMutation.isPending}
                  className="bg-card-blue border border-gray-300 hover:bg-card-blue/90 text-gray-700 text-xs shadow-sm"
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
              className="w-full h-24 p-3 bg-white border border-gray-300 rounded-lg focus:border-gray-400 focus:outline-none resize-none text-sm text-gray-800 placeholder:text-gray-500 shadow-sm" 
              placeholder="Describe your creative inspiration or what you'd like ideas about..."
              disabled={isLoading}
            />
            <Button
              onClick={handleGenerateFromText}
              disabled={!textPrompt.trim() || isLoading}
              className="w-full bg-card-coral border border-gray-300 hover:bg-card-coral/90 text-gray-700 rounded-lg py-3 font-medium touch-target transition-all duration-300 shadow-sm"
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
          <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
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
              className="max-h-20 mx-auto rounded object-cover border border-gray-300 shadow-sm"
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
