import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Image, ArrowRight, Heart, Eye } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: 'Crimson Text, serif' }}>
      {/* Hero Section */}
      <div className="relative">
        {/* Navigation */}
        <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-card-sage-bg rounded-lg shadow-sm">
              <svg className="h-6 w-6 text-card-sage" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22C12 22 16 18 16 12C16 6 12 2 12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.7"
                />
                <path
                  d="M2 12C2 12 6 8 12 8C18 8 22 12 22 12C22 12 18 16 12 16C6 16 2 12 2 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.4"
                />
                <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.8" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Crimson Text, serif' }}>
              SWIVL
            </h1>
          </div>
          <a href="/api/login">
            <Button className="bg-card-blue-gray hover:bg-card-blue-gray/90 text-white border-0 shadow-sm">
              Sign In
            </Button>
          </a>
        </nav>
        
        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block bg-card-sage/20 border border-card-sage/30 rounded-full px-4 py-2 mb-8">
              <span className="text-sm text-card-sage font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                ✨ AI-Powered Creative Inspiration
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-foreground" style={{ fontFamily: 'Crimson Text, serif' }}>
              Your Creative Partner <br />
              for Digital Inspiration
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              Transform your ideas, photos, and sketches into endless creative possibilities with AI-powered inspiration that understands your vision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/api/login">
                <Button className="bg-foreground hover:bg-foreground/90 text-background px-8 py-3 text-base font-medium shadow-sm">
                  Get Started →
                </Button>
              </a>
              <Button variant="outline" className="border-border hover:bg-muted text-foreground px-8 py-3 text-base font-medium">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground" style={{ fontFamily: 'Crimson Text, serif' }}>
            Enhance Your Creativity
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
            Unlock endless creative potential with AI-powered inspiration tools designed for modern creators.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center group">
            <div className="bg-card-sage rounded-2xl p-6 mb-4 shadow-sm border border-card-sage/30 group-hover:shadow-md transition-all duration-300">
              <Image className="h-8 w-8 text-card-sage mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground" style={{ fontFamily: 'Crimson Text, serif' }}>Photo Magic</h3>
            <p className="text-muted-foreground text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Upload any photo and get creative ideas inspired by what you see.
            </p>
          </div>
          
          <div className="text-center group">
            <div className="bg-card-blue-gray rounded-2xl p-6 mb-4 shadow-sm border border-card-blue-gray/30 group-hover:shadow-md transition-all duration-300">
              <Sparkles className="h-8 w-8 text-card-blue-gray mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground" style={{ fontFamily: 'Crimson Text, serif' }}>Text Prompts</h3>
            <p className="text-muted-foreground text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Describe your interests and get personalized creative ideas.
            </p>
          </div>
          
          <div className="text-center group">
            <div className="bg-card-purple-gray rounded-2xl p-6 mb-4 shadow-sm border border-card-purple-gray/30 group-hover:shadow-md transition-all duration-300">
              <Eye className="h-8 w-8 text-card-purple-gray mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground" style={{ fontFamily: 'Crimson Text, serif' }}>Explore & Chain</h3>
            <p className="text-muted-foreground text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Discover variations that blend your inspiration with new concepts.
            </p>
          </div>
          
          <div className="text-center group">
            <div className="bg-card-light-blue rounded-2xl p-6 mb-4 shadow-sm border border-card-light-blue/30 group-hover:shadow-md transition-all duration-300">
              <Heart className="h-8 w-8 text-card-light-blue mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground" style={{ fontFamily: 'Crimson Text, serif' }}>Save & Organize</h3>
            <p className="text-muted-foreground text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Build your personal collection of favorite creative ideas.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-sm">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground" style={{ fontFamily: 'Crimson Text, serif' }}>
            Start your creative journey today
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
            Join thousands of creators who use SWIVL to unlock their creative potential.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/api/login">
              <Button className="bg-foreground hover:bg-foreground/90 text-background px-8 py-3 text-base font-medium shadow-sm">
                Get Started →
              </Button>
            </a>
          </div>
          <p className="text-muted-foreground text-sm mt-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            Sign in with your account to start creating
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-card-sage-bg rounded-lg shadow-sm">
                <svg className="h-5 w-5 text-card-sage" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22C12 22 16 18 16 12C16 6 12 2 12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.7"
                  />
                  <path
                    d="M2 12C2 12 6 8 12 8C18 8 22 12 22 12C22 12 18 16 12 16C6 16 2 12 2 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.4"
                  />
                  <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.8" />
                </svg>
              </div>
              <span className="text-lg font-bold text-foreground" style={{ fontFamily: 'Crimson Text, serif' }}>SWIVL</span>
            </div>
            <p className="text-muted-foreground text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              © 2025 SWIVL. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}