import { ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Bookmark, Settings, History, LogOut, LogIn } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [showFooter, setShowFooter] = useState(true);
  const [lastTouchY, setLastTouchY] = useState(0);
  const [swipeStartY, setSwipeStartY] = useState(0);

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
    <div className="min-h-screen bg-background text-foreground flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* SWIVL Brand */}
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer hover-lift transition-all duration-300">
                <div className="p-2 bg-card-light-blue-bg border border-card-light-blue/40 rounded-lg card-shadow">
                  <svg className="h-6 w-6" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="47" stroke="#1e293b" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="44" stroke="#1e293b" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="41" stroke="#1e293b" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="38" stroke="#334155" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="35" stroke="#334155" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="32" stroke="#334155" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="29" stroke="#475569" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="26.5" stroke="#475569" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="24" stroke="#475569" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="21.5" stroke="#64748b" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="19.2" stroke="#64748b" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="17" stroke="#64748b" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="14.8" stroke="#64748b" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="12.8" stroke="#64748b" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="10.9" stroke="#64748b" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="9.2" stroke="#64748b" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="7.6" stroke="#64748b" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="6.2" stroke="#64748b" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="4.9" stroke="#64748b" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="3.8" stroke="#64748b" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="2.8" stroke="#64748b" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="2" stroke="#64748b" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="1.3" stroke="#64748b" strokeWidth="1" fill="none"/>
                    <circle cx="50" cy="50" r="0.8" fill="#1e293b"/>
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Crimson Text, serif' }}>
                  SWIVL
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
          showFooter ? 'translate-y-0' : 'translate-y-full'
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