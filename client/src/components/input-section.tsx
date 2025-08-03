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
    <div className="px-4 mb-4 relative z-10">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col gap-3 mb-4">
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
              className="w-full bg-gradient-to-r from-coral to-pink-500 hover:from-coral/90 hover:to-pink-600 text-white rounded-xl py-6 px-6 font-semibold shadow-lg touch-target"
              disabled={isLoading}
            >
              <label htmlFor="image-upload" className="cursor-pointer">
                <Camera className="mr-2 h-5 w-5" />
                Upload Image
              </label>
            </Button>
          </div>
          
          {/* Text Input Toggle */}
          <Button
            onClick={() => setShowTextInput(!showTextInput)}
            className="w-full bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white rounded-xl py-6 px-6 font-semibold shadow-lg touch-target"
            disabled={isLoading}
          >
            <Edit className="mr-2 h-5 w-5" />
            Text Prompt
          </Button>
        </div>
        
        {/* Text Input Area */}
        {showTextInput && (
          <div className="space-y-4">
            <Textarea 
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl focus:border-coral focus:outline-none resize-none" 
              placeholder="Describe your inspiration or what you're looking for..."
              disabled={isLoading}
            />
            <Button
              onClick={handleGenerateFromText}
              disabled={!textPrompt.trim() || isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-coral hover:from-amber-600 hover:to-coral/90 text-white rounded-xl py-3 font-semibold touch-target"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Ideas
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Upload Preview Area */}
        <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-xl text-center text-gray-500">
          {uploadedImage ? (
            <div className="space-y-2">
              <img 
                src={uploadedImage} 
                alt="Uploaded" 
                className="max-h-32 mx-auto rounded-lg object-cover"
              />
              <p className="text-sm font-medium text-gray-700">
                {isLoading ? "Analyzing image..." : "Image uploaded successfully!"}
              </p>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p>Uploaded image will appear here</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
