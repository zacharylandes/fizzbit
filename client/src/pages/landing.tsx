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
            <div className="p-2 bg-gradient-electric rounded-lg glow-electric-blue">
              <Lightbulb className="h-6 w-6 text-white animate-pulse" />
            </div>
          </div>
          <a href="/api/login">
            <button className="bg-gradient-neon text-white px-6 py-2 rounded-lg font-medium hover:scale-105 hover-glow transition-all duration-300">
              Sign In
            </button>
          </a>
        </nav>
        
        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Large SWIVL Logo */}
            <div className="mb-8">
              <h1 className="text-8xl md:text-9xl font-bold mb-4 drop-shadow-2xl glow-electric-pink" style={{ 
                fontFamily: 'Cherry Bomb One, cursive',
                background: 'linear-gradient(135deg, hsl(330, 100%, 70%), hsl(200, 100%, 60%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                SWIVL
              </h1>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-electric-cyan to-electric-blue bg-clip-text text-transparent">Make creative inspiration</span>
              <span className="block bg-gradient-to-r from-electric-pink to-electric-purple bg-clip-text text-transparent"> easy way</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Generate endless creative ideas from your photos and thoughts with AI-powered inspiration that adapts to your unique style.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/api/login">
                <button className="bg-gradient-aurora text-white px-8 py-3 rounded-lg font-medium hover:scale-105 glow-electric-purple transition-all duration-300">
                  Get Started
                </button>
              </a>
              <button className="glass border border-electric-blue/30 text-electric-blue px-8 py-3 rounded-lg font-medium hover:bg-electric-blue/10 hover:border-electric-blue transition-all duration-300">
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
          <div className="text-center group">
            <div className="bg-gradient-electric rounded-2xl p-6 mb-4 glow-electric-blue group-hover:scale-105 transition-all duration-300">
              <Image className="h-8 w-8 text-white mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-electric-blue">Photo Magic</h3>
            <p className="text-muted-foreground">
              Upload any photo and get creative ideas inspired by what you see.
            </p>
          </div>
          
          <div className="text-center group">
            <div className="bg-gradient-neon rounded-2xl p-6 mb-4 glow-electric-pink group-hover:scale-105 transition-all duration-300">
              <Sparkles className="h-8 w-8 text-white mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-electric-pink">Text Prompts</h3>
            <p className="text-muted-foreground">
              Describe your interests and get personalized creative ideas.
            </p>
          </div>
          
          <div className="text-center group">
            <div className="bg-gradient-cyber rounded-2xl p-6 mb-4 glow-electric-purple group-hover:scale-105 transition-all duration-300">
              <Eye className="h-8 w-8 text-white mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-electric-cyan">Explore & Chain</h3>
            <p className="text-muted-foreground">
              Discover variations that blend your inspiration with new concepts.
            </p>
          </div>
          
          <div className="text-center group">
            <div className="bg-gradient-sunset rounded-2xl p-6 mb-4 glow-electric-blue group-hover:scale-105 transition-all duration-300">
              <Heart className="h-8 w-8 text-white mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-electric-orange">Save & Organize</h3>
            <p className="text-muted-foreground">
              Build your personal collection of favorite creative ideas.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="glass border border-electric-blue/20 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-aurora opacity-10 animate-pulse"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-electric-purple to-electric-cyan bg-clip-text text-transparent">
                Start your creative journey today
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of creators who use SWIVL to unlock their creative potential.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/api/login">
                <button className="bg-gradient-electric text-white px-8 py-3 rounded-lg font-medium hover:scale-105 glow-electric-blue transition-all duration-300">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 inline" />
                </button>
              </a>
            </div>
            <p className="text-electric-blue/80 text-sm mt-6">
              Sign in with your Replit account to start creating
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-electric-blue/20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-electric rounded-lg glow-electric-blue">
                <Lightbulb className="h-5 w-5 text-white animate-pulse" />
              </div>
              <span className="text-lg font-bold text-white">SWIVL</span>
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