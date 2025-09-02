import { ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Bookmark, Settings, History, LogOut, LogIn } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import logoImage from "@/assets/logo.png";
import spiralLogoImage from "@/assets/spiral-logo.png";

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
      <div className="min-h-screen bg-card-plum flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-card-plum border-t-transparent rounded-full animate-spin"></div>
          <p className="text-card-plum">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-foreground flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-header-footer shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* FizzBit Brand */}
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer hover-lift transition-all duration-300 p-1 rounded-lg hover:bg-accent/10">
                <img src={spiralLogoImage} alt="FizzBit Logo" className="h-8 w-8 object-contain" />
                <h1 className="text-lg font-poppins-bold text-gray-800">
                  FizzBit
                </h1>
              </div>
            </Link>
            
            {/* Auth Button */}
            {isAuthenticated ? (
              <a href="/api/logout">
                <Button
                  size="sm"
                  className="bg-header-footer-button border border-gray-300 hover:bg-header-footer-button/80 hover-lift text-gray-700 transition-all duration-300 px-4 py-2 shadow-sm font-medium"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </a>
            ) : (
              <a href="/api/login">
                <Button
                  size="sm"
                  className="bg-header-footer-button border border-gray-300 hover:bg-header-footer-button/80 hover-lift text-gray-700 transition-all duration-300 px-4 py-2 shadow-sm font-medium"
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
        <div className={`fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-header-footer transition-transform duration-300 z-50 ${
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
                          ? "bg-header-footer-button border border-gray-300 shadow-sm font-semibold"
                          : "hover:text-gray-700 hover:bg-header-footer-button/20 hover-lift font-medium"
                      }`}
                    >
                      <Icon className="h-5 w-5 text-gray-600" />
                      <span className="text-xs font-medium text-gray-600">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-header-footer-button border border-gray-300 text-gray-700 text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
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