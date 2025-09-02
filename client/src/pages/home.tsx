import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardStack } from "@/components/card-stack";
import { InputSection } from "@/components/input-section";
import { type Idea } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const [currentIdeas, setCurrentIdeas] = useState<Idea[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [shouldAutoGenerate, setShouldAutoGenerate] = useState<boolean>(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Check for reused prompt from history tab
  useEffect(() => {
    const reusedPromptData = localStorage.getItem("reusedPrompt");
    if (reusedPromptData) {
      try {
        const { content } = JSON.parse(reusedPromptData);
        setCurrentPrompt(content);
        setShouldAutoGenerate(true);
        localStorage.removeItem("reusedPrompt"); // Clear after use
      } catch (error) {
        console.error("Failed to parse reused prompt:", error);
      }
    }
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access your saved ideas",
        variant: "info",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch saved ideas count for the bookmark badge
  const { data: savedIdeasData } = useQuery({
    queryKey: ["/api/ideas/saved"],
    enabled: isAuthenticated, // Only fetch if authenticated
  }) as { data: { ideas: any[] } | undefined };


  const handlePromptChange = (prompt: string) => {
    setCurrentPrompt(prompt);
    // Turn off auto-generate when user is typing
    setShouldAutoGenerate(false);
  };

  const handleSwipeUpPrompt = (ideaContent: string) => {
    // Combine the current prompt with the swiped idea to create a chained prompt
    const chainedPrompt = currentPrompt 
      ? `${currentPrompt} + ${ideaContent}` 
      : ideaContent;
    
    setCurrentPrompt(chainedPrompt);
    setShouldAutoGenerate(true);
  };

  // Reset auto-generate flag after it's been used and ensure new ideas replace old ones
  const handleIdeasGeneratedWrapper = (ideas: Idea[]) => {
    // Always replace current ideas with new ones to ensure top card is from latest prompt
    setCurrentIdeas(ideas);
    setShouldAutoGenerate(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-card-mint border-t-transparent rounded-full animate-spin"></div>
          <p className="text-card-mint">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex flex-col h-full">
      {/* Content Section */}
      {isAuthenticated ? (
        <div className="max-w-7xl mx-auto w-full px-6 pt-4 pb-2">
          <div className="mb-4 text-center">
            <h2 className="text-2xl font-crimson font-semibold mb-2 text-card-coral bg-card-coral-bg/20 px-4 py-2 rounded-lg border-2 border-card-coral/30 button-shadow">
              Get Inspired
            </h2>
            <p className="text-muted-foreground text-base font-inter">Upload a photo or describe your interests to get personalized creative inspiration.</p>
            
          </div>
          
          
          {/* Input Section */}
          <div className="mb-2">
            <InputSection 
              onIdeasGenerated={handleIdeasGeneratedWrapper}
              promptValue={currentPrompt}
              onPromptChange={handlePromptChange}
              shouldAutoGenerate={shouldAutoGenerate}
            />
          </div>
        </div>
      ) : null}

      {/* Cards Section */}
      {isAuthenticated && (
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 pb-20">
          <CardStack 
            initialIdeas={currentIdeas} 
            onSwipeUpPrompt={handleSwipeUpPrompt}
            currentPrompt={currentPrompt}
          />
        </div>
      )}
    </div>
  );
}
