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
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

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

  const handleIdeasGenerated = (ideas: Idea[]) => {
    setCurrentIdeas(ideas);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-coral via-teal to-sky-500 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <>
      {/* Content Section */}
      {isAuthenticated ? (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">
              <span className="bg-gradient-to-r from-electric-cyan to-electric-green bg-clip-text text-transparent">
                Generate Ideas
              </span>
            </h2>
            <p className="text-muted-foreground">Upload a photo or describe your interests to get personalized creative inspiration.</p>
          </div>
          
          {/* Input Section */}
          <div className="mb-8">
            <InputSection onIdeasGenerated={handleIdeasGenerated} />
          </div>
        </div>
      ) : null}

      {/* Cards Section */}
      {isAuthenticated && (
        <div className="max-w-7xl mx-auto px-6 pb-20">
          <CardStack initialIdeas={currentIdeas} />
        </div>
      )}
    </>
  );
}
