import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Edit, Upload, Sparkles } from "lucide-react";
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
        setUploadedImage(null); // Clear uploaded image after generation
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

  const isLoading = generateFromTextMutation.isPending || generateFromImageMutation.isPending;

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
        
        {/* Upload Preview Area - Compact */}
        {uploadedImage && (
          <div className="mt-2 p-2 glass border border-dashed border-electric-blue/30 rounded-lg text-center">
            <img 
              src={uploadedImage} 
              alt="Uploaded" 
              className="max-h-16 mx-auto rounded object-cover"
            />
            <p className="text-xs text-white/70 mt-1">
              {isLoading ? "Analyzing..." : "Ready!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
