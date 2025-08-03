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
    <div className="min-h-screen bg-gradient-to-br from-coral via-teal to-sky-500">
      {/* Main Header */}
      <div className="bg-gradient-to-r from-coral/20 via-teal-500/20 to-sky-500/20 backdrop-blur-sm border-b border-white/30">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* SWIVL Brand */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Lightbulb className="h-6 w-6 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-coral via-teal-300 to-sky-300 bg-clip-text text-transparent">
                SWIVL
              </h1>
            </div>
            
            {/* Dynamic Auth Button */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {user && (
                  <div className="flex items-center space-x-2 text-white">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {(user as any).firstName || (user as any).email?.split('@')[0] || 'User'}
                    </span>
                  </div>
                )}
                <a href="/api/logout">
                  <Button
                    size="sm"
                    className="bg-coral/80 backdrop-blur-sm rounded-full px-4 py-2 text-white touch-target hover:bg-coral flex items-center space-x-2 shadow-lg"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">Logout</span>
                  </Button>
                </a>
              </div>
            ) : (
              <a href="/api/login">
                <Button
                  size="sm"
                  className="bg-coral/80 backdrop-blur-sm rounded-full px-4 py-2 text-white touch-target hover:bg-coral flex items-center space-x-2 shadow-lg"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="text-sm font-medium">Login</span>
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
      
      {/* Content Header with Input Section */}
      <div className="relative pt-4 pb-2 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-white/90 text-lg font-medium">Get Inspired</span>
          </div>
          {isAuthenticated && (
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
          )}
        </div>
        
        {/* Input Section */}
        {isAuthenticated && (
          <InputSection onIdeasGenerated={handleIdeasGenerated} />
        )}
      </div>

      {/* Cards Section */}
      {isAuthenticated ? (
        <div className="px-4 pb-20">
          <CardStack initialIdeas={currentIdeas} />
        </div>
      ) : (
        <div className="px-4 pb-20 text-center">
          <div className="max-w-md mx-auto mt-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">
                Welcome to SWIVL!
              </h2>
              <p className="text-white/90 mb-6 leading-relaxed">
                Ready to unlock endless creative inspiration? Log in to start generating ideas from your photos and thoughts.
              </p>
              <a href="/api/login">
                <Button 
                  size="lg"
                  className="bg-coral/80 backdrop-blur-sm text-white hover:bg-coral rounded-full px-8 py-3 text-lg font-medium shadow-lg touch-target"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Get Started
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      {isAuthenticated && (
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
      )}
    </div>
  );
}
