import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Edit, Upload, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Idea } from "@shared/schema";

interface InputSectionProps {
  onIdeasGenerated: (ideas: Idea[]) => void;
}

export function InputSection({ onIdeasGenerated }: InputSectionProps) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPrompt, setTextPrompt] = useState("");
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
        onIdeasGenerated(data.ideas);
        setTextPrompt("");
        toast({
          title: "Ideas Generated!",
          description: "Fresh creative ideas based on your prompt.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate ideas. Please try again.",
        variant: "destructive",
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
        onIdeasGenerated(data.ideas);
        toast({
          title: "Ideas Generated!",
          description: "Creative ideas inspired by your image.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to analyze image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        setUploadedImage(result);
        generateFromImageMutation.mutate(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateFromText = () => {
    if (textPrompt.trim()) {
      generateFromTextMutation.mutate(textPrompt.trim());
    }
  };

  const isLoading = generateFromTextMutation.isPending || generateFromImageMutation.isPending;

  return (
    <div className="mb-3 relative z-10">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg">
        <div className="flex flex-row gap-2">
          {/* Image Upload Button */}
          <div className="w-full">
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
              className="flex-1 bg-gradient-to-r from-coral to-pink-500 hover:from-coral/90 hover:to-pink-600 text-white rounded-lg py-3 px-4 font-medium shadow-md touch-target"
              disabled={isLoading}
            >
              <label htmlFor="image-upload" className="cursor-pointer">
                <Camera className="mr-1 h-4 w-4" />
                Image
              </label>
            </Button>
          </div>
          
          {/* Text Input Toggle */}
          <Button
            onClick={() => setShowTextInput(!showTextInput)}
            className="flex-1 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white rounded-lg py-3 px-4 font-medium shadow-md touch-target"
            disabled={isLoading}
          >
            <Edit className="mr-1 h-4 w-4" />
            Text
          </Button>
        </div>
        
        {/* Text Input Area */}
        {showTextInput && (
          <div className="mt-2 space-y-2">
            <Textarea 
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:border-coral focus:outline-none resize-none text-sm" 
              placeholder="Describe your inspiration..."
              disabled={isLoading}
            />
            <Button
              onClick={handleGenerateFromText}
              disabled={!textPrompt.trim() || isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-coral hover:from-amber-600 hover:to-coral/90 text-white rounded-lg py-2 font-medium touch-target"
            >
              {isLoading ? (
                <>
                  <div className="w-3 h-3 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Upload Preview Area - Compact */}
        {uploadedImage && (
          <div className="mt-2 p-2 border border-dashed border-gray-300 rounded-lg text-center">
            <img 
              src={uploadedImage} 
              alt="Uploaded" 
              className="max-h-16 mx-auto rounded object-cover"
            />
            <p className="text-xs text-gray-600 mt-1">
              {isLoading ? "Analyzing..." : "Ready!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
