import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardStack } from "@/components/card-stack";
import { InputSection } from "@/components/input-section";
import { type Idea } from "@shared/schema";
import { Bookmark, Home, History, Settings, LogOut, User, Lightbulb, LogIn } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
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
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Main Header */}
      <div className="border-b border-electric-blue/20 glass">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* SWIVL Brand */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-electric rounded-lg glow-electric-blue">
                <Lightbulb className="h-6 w-6 text-white animate-pulse" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-electric-blue to-electric-purple bg-clip-text text-transparent">
                SWIVL
              </h1>
            </div>
            
            {/* Simple Auth Button */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link href="/saved">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="glass border border-electric-purple/30 text-electric-purple hover:text-white hover:bg-electric-purple/20 transition-all duration-300 relative"
                  >
                    <Bookmark className="h-5 w-5 mr-2" />
                    Saved
                    {(savedIdeasData?.ideas?.length || 0) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-neon text-white text-xs rounded-full h-5 w-5 flex items-center justify-center glow-electric-pink">
                        {savedIdeasData?.ideas?.length || 0}
                      </span>
                    )}
                  </Button>
                </Link>
                <a href="/api/logout">
                  <Button
                    size="sm"
                    className="bg-gradient-sunset text-white hover:scale-105 glow-electric-orange transition-all duration-300 px-4 py-2"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </a>
              </div>
            ) : (
              <a href="/api/login">
                <Button
                  size="sm"
                  className="bg-gradient-neon text-white hover:scale-105 glow-electric-blue transition-all duration-300 px-4 py-2"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
      
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

    </div>
  );
}
