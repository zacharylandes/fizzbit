import { ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Bookmark, Settings, History, LogOut, LogIn } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import logoImage from "@/assets/logo.png";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [showFooter, setShowFooter] = useState(true);
  const [lastTouchY, setLastTouchY] = useState(0);
  const [swipeStartY, setSwipeStartY] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Fetch saved ideas count for the bookmark badge
  const { data: savedIdeasData } = useQuery({
    queryKey: ["/api/ideas/saved"],
    enabled: isAuthenticated,
  }) as { data: { ideas: any[] } | undefined };

  // Handle swipe down gesture to show footer
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      setSwipeStartY(touch.clientY);
      setLastTouchY(touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const currentY = touch.clientY;
      
      // Check if user is swiping down from the top third of screen
      if (swipeStartY < window.innerHeight / 3) {
        const swipeDistance = currentY - swipeStartY;
        
        // If swiping down more than 50px, show footer
        if (swipeDistance > 50) {
          setShowFooter(true);
        }
      }
      
      setLastTouchY(currentY);
    };

    const handleTouchEnd = () => {
      setSwipeStartY(0);
      setLastTouchY(0);
    };

    // Add touch event listeners
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [swipeStartY]);

  // Detect keyboard open/close to hide footer
  useEffect(() => {
    let initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const heightDifference = initialViewportHeight - currentHeight;
        // Consider keyboard open if viewport height decreased by more than 150px
        const keyboardOpen = heightDifference > 150;
        setIsKeyboardOpen(keyboardOpen);
        
        // Hide footer when keyboard is open
        if (keyboardOpen) {
          setShowFooter(false);
        }
      }
    };

    // Fallback for browsers without visualViewport support
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      const keyboardOpen = heightDifference > 150;
      setIsKeyboardOpen(keyboardOpen);
      
      // Hide footer when keyboard is open
      if (keyboardOpen) {
        setShowFooter(false);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const navItems = [
    { href: "/", icon: Home, label: "Home", badge: null },
    { href: "/saved", icon: Bookmark, label: "Saved", badge: savedIdeasData?.ideas?.length || 0 },
    { href: "/history", icon: History, label: "History", badge: null },
    { href: "/settings", icon: Settings, label: "Settings", badge: null },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-foreground flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="border-b border-border bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* FizzBit Brand */}
            <Link href="/">
              <div className="flex items-center space-x-4 cursor-pointer hover-lift transition-all duration-300 p-1 rounded-lg hover:bg-accent/10">
                <img src="/src/assets/logo.png" alt="FizzBit Logo" className="h-20 w-20 object-contain" />
                <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Crimson Text, serif' }}>
                  FizzBit
                </h1>
              </div>
            </Link>
            
            {/* Auth Button */}
            {isAuthenticated ? (
              <a href="/api/logout">
                <Button
                  size="sm"
                  className="bg-card-purple-gray-bg border-card-purple-gray/40 hover:bg-card-purple-gray-bg/90 hover-lift text-card-purple-gray transition-all duration-300 px-4 py-2 card-shadow font-medium"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </a>
            ) : (
              <a href="/api/login">
                <Button
                  size="sm"
                  className="bg-card-blue-gray-bg border-card-blue-gray/40 hover:bg-card-blue-gray-bg/90 hover-lift text-card-blue-gray transition-all duration-300 px-4 py-2 card-shadow font-medium"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Footer Navigation */}
      {isAuthenticated && (
        <div className={`fixed bottom-0 left-0 right-0 border-t border-border bg-background transition-transform duration-300 z-50 ${
          showFooter && !isKeyboardOpen ? 'translate-y-0' : 'translate-y-full'
        }`}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <nav className="flex items-center justify-center space-x-8">
              {navItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`flex flex-col items-center space-y-1 p-3 h-auto transition-all duration-300 relative rounded-lg ${
                        isActive
                          ? "bg-card-sage-bg border border-card-sage/30 card-shadow font-semibold"
                          : "hover:text-card-sage hover:bg-card-sage-bg hover-lift font-medium"
                      }`}
                    >
                      <Icon className="h-5 w-5 text-card-sage" />
                      <span className="text-xs font-medium text-card-sage">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-card-sage-bg border border-card-sage/40 text-card-sage text-xs rounded-full h-5 w-5 flex items-center justify-center card-shadow">
                          {item.badge}
                        </span>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Swipe indicator */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
            <div className="w-8 h-1 bg-muted-foreground/30 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}