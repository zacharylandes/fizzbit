import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, Type, Clock, RefreshCw, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface PromptHistory {
  id: string;
  type: "text" | "image";
  content: string;
  timestamp: string;
  ideasGenerated: number;
}

export default function HistoryPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  // Get real prompt history from API
  const { data: promptHistoryData, isLoading: historyLoading, error } = useQuery<{prompts: PromptHistory[]}>({
    queryKey: ["/api/prompts/history"],
    enabled: isAuthenticated && !isLoading,
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (error && error.message.includes("401")) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const promptHistory: PromptHistory[] = promptHistoryData?.prompts || [];
  
  const filteredHistory = promptHistory.filter((item: PromptHistory) =>
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePromptClick = (prompt: PromptHistory) => {
    // Store the selected prompt in localStorage so it can be used on the home page
    localStorage.setItem("reusedPrompt", JSON.stringify({
      type: prompt.type,
      content: prompt.content,
    }));
    
    toast({
      title: "Prompt Loaded",
      description: "Your prompt has been loaded. Redirecting to home...",
      variant: "default",
    });
    
    // Navigate to home page
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  if (isLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading your prompt history...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="bg-gradient-to-r from-electric-cyan to-electric-green bg-clip-text text-transparent">
            Prompt History
          </span>
        </h1>
        <p className="text-muted-foreground">Revisit your previous prompts and generate new ideas</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            type="text"
            placeholder="Search your prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass border-electric-blue/30 text-white placeholder:text-white/50 focus:border-electric-blue"
          />
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <Card className="glass border border-electric-purple/30 glow-electric-purple">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-white/50 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchTerm ? "No matching prompts found" : "No prompt history yet"}
              </h3>
              <p className="text-white/70 text-center mb-4">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Start generating ideas to build your prompt history!"
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => window.location.href = "/"}
                  className="bg-gradient-electric text-white hover:scale-105 glow-electric-blue transition-all duration-300"
                >
                  Start Creating Ideas
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredHistory.map((prompt: PromptHistory, index: number) => {
            const cardStyles = [
              "bg-gradient-electric border-electric-blue/30 glow-electric-blue",
              "bg-gradient-neon border-electric-pink/30 glow-electric-pink", 
              "bg-gradient-cyber border-electric-cyan/30 glow-electric-purple",
              "bg-gradient-sunset border-electric-orange/30 glow-electric-orange"
            ];
            
            return (
              <Card 
                key={prompt.id} 
                className={`${cardStyles[index % cardStyles.length]} cursor-pointer hover:scale-[1.02] transition-all duration-300 relative overflow-hidden`}
                onClick={() => handlePromptClick(prompt)}
              >
                <div className="absolute inset-0 bg-gradient-aurora opacity-10 animate-pulse"></div>
                <div className="relative z-10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 glass rounded-lg">
                          {prompt.type === "image" ? (
                            <Image className="h-5 w-5 text-white" />
                          ) : (
                            <Type className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">
                            {prompt.type === "image" ? "Image Upload" : "Text Prompt"}
                          </CardTitle>
                          <div className="flex items-center space-x-2 text-xs text-white/70">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(prompt.timestamp)}</span>
                            <span>•</span>
                            <span>{prompt.ideasGenerated} ideas generated</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="glass border border-white/20 text-white hover:bg-white/10"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reuse
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-white/80">
                      {prompt.type === "image" ? (
                        <span className="italic">Image prompt uploaded</span>
                      ) : (
                        `"${prompt.content}"`
                      )}
                    </CardDescription>
                  </CardContent>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-8 p-4 glass border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400 text-center">
            Failed to load prompt history. Please try refreshing the page.
          </p>
        </div>
      )}
    </div>
  );
}