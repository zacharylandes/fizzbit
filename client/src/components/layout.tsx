import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb, Home, Bookmark, Settings, History, LogOut, LogIn } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Fetch saved ideas count for the bookmark badge
  const { data: savedIdeasData } = useQuery({
    queryKey: ["/api/ideas/saved"],
    enabled: isAuthenticated,
  }) as { data: { ideas: any[] } | undefined };

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
                <div className="p-2 bg-primary-blue rounded-lg card-shadow">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-primary">
                  SWIVL
                </h1>
              </div>
            </Link>
            
            {/* Auth Button */}
            {isAuthenticated ? (
              <a href="/api/logout">
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 hover-lift text-primary-foreground transition-all duration-300 px-4 py-2 card-shadow"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </a>
            ) : (
              <a href="/api/login">
                <Button
                  size="sm"
                  className="bg-primary-blue hover:bg-primary-blue/90 hover-lift text-white transition-all duration-300 px-4 py-2 card-shadow"
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
        <div className="border-t border-border bg-card/80 backdrop-blur-sm">
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
                          ? "bg-primary text-primary-foreground card-shadow"
                          : "text-muted-foreground hover:text-primary hover:bg-accent hover-lift"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary-blue text-white text-xs rounded-full h-5 w-5 flex items-center justify-center card-shadow">
                          {item.badge}
                        </span>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}