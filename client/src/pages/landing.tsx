import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Image, ArrowRight, Heart, Eye } from "lucide-react";
import spiralLogoImage from "@/assets/spiral-logo.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Hero Section */}
      <div className="relative">
        {/* Navigation */}
        <nav className="border-b border-gray-200 bg-header-footer shadow-sm">
          <div className="flex items-center justify-between p-6 max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <img src={spiralLogoImage} alt="FizzBit Logo" className="h-12 w-12 object-contain" />
            <h1 className="text-2xl font-poppins text-foreground">
              FizzBit
            </h1>
          </div>
          <a href="/api/login">
            <Button className="bg-header-footer-button hover:bg-header-footer-button/80 text-gray-700 border border-gray-300 shadow-sm font-medium">
              Sign In
            </Button>
          </a>
          </div>
        </nav>
        
        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block bg-card-sage/20 border border-card-sage/30 rounded-full px-4 py-2 mb-8">
              <span className="text-sm text-card-sage font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                ✨ AI-Powered Creative Inspiration
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-poppins mb-6 leading-tight text-foreground">
              Swipe Right on <br />
              Endless Creativity
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              Transform your ideas, photos, and sketches into endless creative possibilities with AI-powered inspiration that understands your vision.
            </p>
            <div className="flex justify-center">
              <a href="/api/login">
                <Button className="bg-button-custom hover:bg-button-custom/90 text-gray-700 border border-gray-300 px-8 py-3 text-base font-medium shadow-sm">
                  Get Started →
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-poppins mb-4 text-gray-800 bg-header-footer px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
            Enhance Your Creativity
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
            Unlock endless creative potential with AI-powered inspiration tools designed for modern creators.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center group">
            <div className="bg-card-mint card-shadow hover-lift rounded-2xl p-6 mb-4 border border-gray-200 group-hover:shadow-md transition-all duration-300">
              <Image className="h-8 w-8 text-card-mint mx-auto" />
            </div>
            <h3 className="text-lg font-poppins mb-2 text-foreground">Photo Magic</h3>
            <p className="text-muted-foreground text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Upload any photo and get creative ideas inspired by what you see.
            </p>
          </div>
          
          <div className="text-center group">
            <div className="bg-card-lavender card-shadow hover-lift rounded-2xl p-6 mb-4 border border-gray-200 group-hover:shadow-md transition-all duration-300">
              <Sparkles className="h-8 w-8 text-card-lavender mx-auto" />
            </div>
            <h3 className="text-lg font-poppins mb-2 text-foreground">Text Prompts</h3>
            <p className="text-muted-foreground text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Describe your interests and get personalized creative ideas.
            </p>
          </div>
          
          <div className="text-center group">
            <div className="bg-card-peach card-shadow hover-lift rounded-2xl p-6 mb-4 border border-gray-200 group-hover:shadow-md transition-all duration-300">
              <Eye className="h-8 w-8 text-card-peach mx-auto" />
            </div>
            <h3 className="text-lg font-poppins mb-2 text-foreground">Explore & Chain</h3>
            <p className="text-muted-foreground text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Discover variations that blend your inspiration with new concepts.
            </p>
          </div>
          
          <div className="text-center group">
            <div className="bg-card-rose card-shadow hover-lift rounded-2xl p-6 mb-4 border border-gray-200 group-hover:shadow-md transition-all duration-300">
              <Heart className="h-8 w-8 text-card-rose mx-auto" />
            </div>
            <h3 className="text-lg font-poppins mb-2 text-foreground">Save & Organize</h3>
            <p className="text-muted-foreground text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Build your personal collection of favorite creative ideas.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-sm">
          <h2 className="text-3xl md:text-4xl font-poppins mb-4 text-foreground">
            Start your creative journey today
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
            Join thousands of creators who use FizzBit to unlock their creative potential.
          </p>
          <div className="flex justify-center">
            <a href="/api/login">
              <Button className="bg-button-custom hover:bg-button-custom/90 text-gray-700 border border-gray-300 px-8 py-3 text-base font-medium shadow-sm">
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
      <footer className="border-t border-gray-200 bg-header-footer">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <img src={spiralLogoImage} alt="FizzBit Logo" className="h-5 w-5 object-contain" />
              </div>
              <span className="text-lg font-poppins text-foreground">FizzBit</span>
            </div>
            <p className="text-muted-foreground text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              © 2025 FizzBit. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}