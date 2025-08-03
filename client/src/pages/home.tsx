import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardStack } from "@/components/card-stack";
import { InputSection } from "@/components/input-section";
import { type Idea } from "@shared/schema";
import { Bookmark, Home, History, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function HomePage() {
  const [currentIdeas, setCurrentIdeas] = useState<Idea[]>([]);

  // Fetch saved ideas count for the bookmark badge
  const { data: savedIdeasData } = useQuery({
    queryKey: ["/api/ideas/saved"],
  }) as { data: { ideas: any[] } | undefined };

  const handleIdeasGenerated = (ideas: Idea[]) => {
    setCurrentIdeas(ideas);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral via-teal to-sky-500">
      {/* Header Section */}
      <div className="relative pt-4 pb-2 px-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-3xl font-bold text-white">Inspire Me</h1>
          <Button
            size="sm"
            className="bg-white/20 backdrop-blur-sm rounded-full p-3 text-white touch-target hover:bg-white/30"
          >
            <Bookmark className="h-5 w-5" />
            {savedIdeasData?.ideas?.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-coral text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {savedIdeasData.ideas.length}
              </span>
            )}
          </Button>
        </div>
        
        <p className="text-white/90 text-base font-medium mb-4">
          Get creative ideas from your images or prompts
        </p>
      </div>

      {/* Input Section */}
      <InputSection onIdeasGenerated={handleIdeasGenerated} />

      {/* Cards Section */}
      <div className="px-4 pb-20 mt-4">
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
          
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center space-y-1 touch-target text-gray-400 hover:text-gray-600"
          >
            <Bookmark className="h-5 w-5" />
            <span className="text-xs">Saved</span>
          </Button>
          
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
