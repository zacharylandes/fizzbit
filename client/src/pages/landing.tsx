import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Image, ArrowRight, Heart, Eye, Lightbulb } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Hero Section */}
      <div className="relative">
        {/* Navigation */}
        <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-primary">SWIVL</span>
          </div>
          <a href="/api/login">
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Sign In
            </button>
          </a>
        </nav>
        
        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Make creative inspiration
              <span className="text-muted-foreground"> easy way</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Generate endless creative ideas from your photos and thoughts with AI-powered inspiration that adapts to your unique style.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/api/login">
                <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  Get Started
                </button>
              </a>
              <button className="border border-border text-foreground px-8 py-3 rounded-lg font-medium hover:bg-secondary transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Enhance Your Creativity</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock endless creative potential with AI-powered inspiration tools designed for modern creators.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-secondary/50 rounded-2xl p-6 mb-4">
              <Image className="h-8 w-8 text-primary mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Photo Magic</h3>
            <p className="text-muted-foreground">
              Upload any photo and get creative ideas inspired by what you see.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-secondary/50 rounded-2xl p-6 mb-4">
              <Sparkles className="h-8 w-8 text-primary mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Text Prompts</h3>
            <p className="text-muted-foreground">
              Describe your interests and get personalized creative ideas.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-secondary/50 rounded-2xl p-6 mb-4">
              <Eye className="h-8 w-8 text-primary mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Explore & Chain</h3>
            <p className="text-muted-foreground">
              Discover variations that blend your inspiration with new concepts.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-secondary/50 rounded-2xl p-6 mb-4">
              <Heart className="h-8 w-8 text-primary mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Save & Organize</h3>
            <p className="text-muted-foreground">
              Build your personal collection of favorite creative ideas.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-secondary/30 rounded-3xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start your creative journey today
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of creators who use SWIVL to unlock their creative potential.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/api/login">
              <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 inline" />
              </button>
            </a>
          </div>
          <p className="text-muted-foreground text-sm mt-6">
            Sign in with your Replit account to start creating
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-primary">SWIVL</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 SWIVL. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}