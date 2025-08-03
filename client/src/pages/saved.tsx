import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Heart, Image, Type, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { type Idea } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function SavedPage() {
  const [animatingCards, setAnimatingCards] = useState<{ [key: string]: boolean }>({});
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch saved ideas
  const { data: savedIdeasData, isLoading } = useQuery({
    queryKey: ["/api/ideas/saved"],
    enabled: isAuthenticated, // Only fetch if authenticated
  }) as { data: { ideas: Idea[] } | undefined; isLoading: boolean };

  const savedIdeas = savedIdeasData?.ideas || [];

  // Unsave idea mutation
  const unsaveIdeaMutation = useMutation({
    mutationFn: async (ideaId: string) => {
      const response = await apiRequest("DELETE", `/api/ideas/${ideaId}/save`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/saved"] });
      toast({
        title: "Idea Removed",
        description: "Moved to trash 🗑️",
        duration: 2000,
        variant: "info",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Oops!",
        description: "Couldn't remove that idea. Try again?",
        variant: "destructive",
        duration: 2000,
      });
    },
  });

  const handleSwipeLeft = (ideaId: string) => {
    // Start animation
    setAnimatingCards(prev => ({ ...prev, [ideaId]: true }));
    
    // After animation, remove the idea
    setTimeout(() => {
      unsaveIdeaMutation.mutate(ideaId);
      setAnimatingCards(prev => {
        const newState = { ...prev };
        delete newState[ideaId];
        return newState;
      });
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent, ideaId: string) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent, ideaId: string) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Only process quick swipes
    if (deltaTime > 500) {
      touchStartRef.current = null;
      return;
    }

    const threshold = 80;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Check for left swipe
    if (deltaX < -threshold && absX > absY) {
      handleSwipeLeft(ideaId);
    }

    touchStartRef.current = null;
  };

  if (authLoading) {
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
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Saved Ideas</h1>
                <p className="text-muted-foreground text-sm">
                  {savedIdeas.length} {savedIdeas.length === 1 ? 'idea' : 'ideas'} saved
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Loading your saved ideas...</p>
            </div>
          </div>
        ) : savedIdeas.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-secondary/30 rounded-2xl p-12 max-w-md mx-auto">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No saved ideas yet</h2>
              <p className="text-muted-foreground mb-6">
                Swipe right or up on ideas you love to save them here!
              </p>
              <Link href="/">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Start Exploring Ideas
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {savedIdeas.map((idea, index) => {
              const isAnimating = animatingCards[idea.id];
              
              return (
                <div
                  key={idea.id}
                  className={`transition-all duration-300 ${
                    isAnimating ? 'animate-slide-out-left opacity-0' : ''
                  }`}
                  onTouchStart={(e) => handleTouchStart(e, idea.id)}
                  onTouchEnd={(e) => handleTouchEnd(e, idea.id)}
                  style={{ touchAction: 'pan-y' }}
                >
                  <Card className="bg-card border border-border shadow-sm relative overflow-hidden hover:shadow-md transition-shadow">
                    {/* Swipe hint overlay */}
                    <div className="absolute inset-0 bg-destructive/10 flex items-center justify-end pr-6 opacity-0 transition-opacity duration-200 hover:opacity-30">
                      <Trash2 className="h-6 w-6 text-destructive" />
                    </div>
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg leading-tight mb-2 text-foreground">
                            {idea.title}
                          </CardTitle>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            {idea.source === 'image' ? (
                              <div className="flex items-center space-x-1">
                                <Image className="h-3 w-3" />
                                <span>From image</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <Type className="h-3 w-3" />
                                <span>From text</span>
                              </div>
                            )}
                            {idea.parentIdeaId && (
                              <span className="text-primary">• Explored idea</span>
                            )}
                          </div>
                        </div>
                        <div className="w-3 h-3 rounded-full flex-shrink-0 ml-3 bg-primary" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-muted-foreground leading-relaxed">
                        {idea.description}
                      </CardDescription>
                      {idea.sourceContent && idea.sourceContent !== "uploaded_image" && (
                        <div className="mt-3 p-3 bg-secondary/30 rounded-lg">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Original inspiration:</p>
                          <p className="text-xs text-foreground italic">"{idea.sourceContent}"</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}