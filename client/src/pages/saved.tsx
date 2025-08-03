import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Heart, Image, Type } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { type Idea } from "@shared/schema";

export default function SavedPage() {
  // Fetch saved ideas
  const { data: savedIdeasData, isLoading } = useQuery({
    queryKey: ["/api/ideas/saved"],
  }) as { data: { ideas: Idea[] } | undefined; isLoading: boolean };

  const savedIdeas = savedIdeasData?.ideas || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral via-teal to-sky-500">
      {/* Header */}
      <div className="relative pt-4 pb-2 px-4">
        <div className="flex items-center mb-4">
          <Link href="/">
            <Button
              size="sm"
              className="bg-white/20 backdrop-blur-sm rounded-full p-3 text-white touch-target hover:bg-white/30 mr-3"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Saved Ideas</h1>
            <p className="text-white/80 text-sm">
              {savedIdeas.length} {savedIdeas.length === 1 ? 'idea' : 'ideas'} saved
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white/80">Loading your saved ideas...</p>
            </div>
          </div>
        ) : savedIdeas.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto mb-4 text-white/60" />
            <h2 className="text-xl font-semibold text-white mb-2">No saved ideas yet</h2>
            <p className="text-white/80 mb-6">
              Swipe right or up on ideas you love to save them here!
            </p>
            <Link href="/">
              <Button className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30">
                Start Exploring Ideas
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedIdeas.map((idea, index) => (
              <Card key={idea.id} className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight mb-2">
                        {idea.title}
                      </CardTitle>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
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
                          <span className="text-purple-600">• Explored idea</span>
                        )}
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ml-3 ${
                      index % 3 === 0 
                        ? 'bg-coral' 
                        : index % 3 === 1 
                        ? 'bg-teal-500' 
                        : 'bg-sky-500'
                    }`} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-gray-700 leading-relaxed">
                    {idea.description}
                  </CardDescription>
                  {idea.sourceContent && idea.sourceContent !== "uploaded_image" && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium mb-1">Original inspiration:</p>
                      <p className="text-xs text-gray-700 italic">"{idea.sourceContent}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}