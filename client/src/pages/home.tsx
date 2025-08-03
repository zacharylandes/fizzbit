import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardStack } from "@/components/card-stack";
import { InputSection } from "@/components/input-section";
import { type Idea } from "@shared/schema";
import { Bookmark, Home, History, Settings, LogOut, User } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-coral via-teal to-sky-500">
      {/* Header with Input Section */}
      <div className="relative pt-2 pb-2 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white">Inspire Me</h1>
            {user && (
              <div className="flex items-center space-x-2 text-white/80">
                <User className="h-4 w-4" />
                <span className="text-sm">
                  {user.firstName || user.email?.split('@')[0] || 'User'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/saved">
              <Button
                size="sm"
                className="bg-white/20 backdrop-blur-sm rounded-full p-3 text-white touch-target hover:bg-white/30 relative"
              >
                <Bookmark className="h-5 w-5" />
                {(savedIdeasData?.ideas?.length || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-coral text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {savedIdeasData?.ideas?.length || 0}
                  </span>
                )}
              </Button>
            </Link>
            <a href="/api/logout">
              <Button
                size="sm"
                className="bg-white/20 backdrop-blur-sm rounded-full p-3 text-white touch-target hover:bg-white/30"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
        
        {/* Input Section moved into header */}
        <InputSection onIdeasGenerated={handleIdeasGenerated} />
      </div>

      {/* Cards Section */}
      <div className="px-4 pb-20">
        <CardStack initialIdeas={currentIdeas} />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-6 py-4">
        <div className="flex justify-around items-center">
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center space-y-1 touch-target text-coral"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Button>
          
          <Link href="/saved">
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1 touch-target text-gray-400 hover:text-gray-600"
            >
              <Bookmark className="h-5 w-5" />
              <span className="text-xs">Saved</span>
            </Button>
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center space-y-1 touch-target text-gray-400 hover:text-gray-600"
          >
            <History className="h-5 w-5" />
            <span className="text-xs">History</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center space-y-1 touch-target text-gray-400 hover:text-gray-600"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
