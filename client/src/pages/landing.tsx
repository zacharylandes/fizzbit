import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Image, ArrowRight, Heart, Eye, Lightbulb } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-coral via-teal to-sky-500">
      {/* Header */}
      <div className="relative pt-8 pb-4 px-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-yellow-400/30 rounded-full mr-4">
              <Lightbulb className="h-10 w-10 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <h1 className="text-5xl font-bold text-white">
              SWIVL
            </h1>
          </div>
          <p className="text-white/90 text-lg mb-8">
            Generate endless creative ideas from your photos and thoughts
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="px-4 pb-8">
        <div className="space-y-4 max-w-md mx-auto">
          <Card className="bg-black/20 backdrop-blur-sm border border-white/30 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-coral/20 rounded-lg">
                  <Image className="h-5 w-5 text-coral" />
                </div>
                <CardTitle className="text-lg text-white font-semibold">Photo Magic</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/90">
                Upload any photo and get 10 creative ideas inspired by what you see. Colors, objects, moods - all become inspiration!
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-sm border border-white/30 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <Sparkles className="h-5 w-5 text-teal-500" />
                </div>
                <CardTitle className="text-lg text-white font-semibold">Text Prompts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/90">
                Describe your interests and get 10 personalized creative ideas. From hobbies to home decor - endless possibilities!
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-sm border border-white/30 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-sky-500/20 rounded-lg">
                  <Eye className="h-5 w-5 text-sky-500" />
                </div>
                <CardTitle className="text-lg text-white font-semibold">Explore & Chain</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/90">
                Love an idea? Swipe up to explore variations that blend your original inspiration with that specific concept!
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-sm border border-white/30 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <Heart className="h-5 w-5 text-pink-500" />
                </div>
                <CardTitle className="text-lg text-white font-semibold">Save & Organize</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/90">
                Build your personal collection of favorite ideas. Swipe right to save, swipe left to dismiss, swipe up to explore more!
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Login Button */}
        <div className="text-center mt-8">
          <a href="/api/login">
            <Button 
              size="lg"
              className="bg-coral text-white hover:bg-coral/80 rounded-full px-8 py-4 text-lg font-medium shadow-lg touch-target border-2 border-white/30"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
          <p className="text-white/70 text-sm mt-4">
            Sign in with your Replit account to start creating
          </p>
        </div>
      </div>
    </div>
  );
}