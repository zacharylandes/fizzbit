import { useState, useRef, useEffect, useCallback } from "react";
import { Heart, Image, Type, Trash2, Move, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { type Idea } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

interface SavedIdeaPosition {
  ideaId: string;
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  dragId: string | null;
  startX: number;
  startY: number;
  startScrollX: number;
  startScrollY: number;
  offsetX: number;
  offsetY: number;
}

export default function SavedPage() {
  const [positions, setPositions] = useState<{ [ideaId: string]: { x: number; y: number } }>({});
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragId: null,
    startX: 0,
    startY: 0,
    startScrollX: 0,
    startScrollY: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch saved ideas
  const { data: savedIdeasData, isLoading } = useQuery({
    queryKey: ["/api/ideas/saved"],
    enabled: isAuthenticated,
  }) as { data: { ideas: Idea[] } | undefined; isLoading: boolean };

  const savedIdeas = savedIdeasData?.ideas || [];

  // Initialize positions for new ideas
  useEffect(() => {
    if (savedIdeas.length > 0) {
      setPositions(prev => {
        const newPositions = { ...prev };
        savedIdeas.forEach((idea, index) => {
          if (!newPositions[idea.id]) {
            // Arrange in a grid pattern initially
            const col = index % 4;
            const row = Math.floor(index / 4);
            newPositions[idea.id] = {
              x: col * 200 + 50,
              y: row * 180 + 50,
            };
          }
        });
        return newPositions;
      });
    }
  }, [savedIdeas]);

  // Unsave idea mutation
  const unsaveIdeaMutation = useMutation({
    mutationFn: async (ideaId: string) => {
      const response = await apiRequest("DELETE", `/api/ideas/${ideaId}/save`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/saved"] });
      toast({
        title: "Idea Removed",
        description: "Moved to trash 🗑️",
        duration: 2000,
        variant: "info",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Oops!",
        description: "Couldn't remove that idea. Try again?",
        variant: "destructive",
        duration: 2000,
      });
    },
  });

  // Mouse/Touch handlers for dragging cards
  const handleMouseDown = useCallback((e: React.MouseEvent, ideaId: string) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragState({
      isDragging: true,
      dragId: ideaId,
      startX: e.clientX,
      startY: e.clientY,
      startScrollX: pan.x,
      startScrollY: pan.y,
      offsetX: e.clientX - rect.left - (positions[ideaId]?.x || 0) * zoom - pan.x,
      offsetY: e.clientY - rect.top - (positions[ideaId]?.y || 0) * zoom - pan.y,
    });
  }, [positions, zoom, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragState.isDragging && dragState.dragId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = (e.clientX - rect.left - dragState.offsetX - pan.x) / zoom;
      const newY = (e.clientY - rect.top - dragState.offsetY - pan.y) / zoom;

      setPositions(prev => ({
        ...prev,
        [dragState.dragId!]: { x: newX, y: newY }
      }));
    }
  }, [dragState, zoom, pan]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      dragId: null,
      startX: 0,
      startY: 0,
      startScrollX: 0,
      startScrollY: 0,
      offsetX: 0,
      offsetY: 0,
    });
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent, ideaId: string) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragState({
      isDragging: true,
      dragId: ideaId,
      startX: touch.clientX,
      startY: touch.clientY,
      startScrollX: pan.x,
      startScrollY: pan.y,
      offsetX: touch.clientX - rect.left - (positions[ideaId]?.x || 0) * zoom - pan.x,
      offsetY: touch.clientY - rect.top - (positions[ideaId]?.y || 0) * zoom - pan.y,
    });
  }, [positions, zoom, pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragState.isDragging && dragState.dragId && canvasRef.current) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = (touch.clientX - rect.left - dragState.offsetX - pan.x) / zoom;
      const newY = (touch.clientY - rect.top - dragState.offsetY - pan.y) / zoom;

      setPositions(prev => ({
        ...prev,
        [dragState.dragId!]: { x: newX, y: newY }
      }));
    }
  }, [dragState, zoom, pan]);

  const handleTouchEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      dragId: null,
      startX: 0,
      startY: 0,
      startScrollX: 0,
      startScrollY: 0,
      offsetX: 0,
      offsetY: 0,
    });
  }, []);

  // Canvas panning
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setIsPanning(true);
      setDragState(prev => ({
        ...prev,
        startX: e.clientX,
        startY: e.clientY,
        startScrollX: pan.x,
        startScrollY: pan.y,
      }));
    }
  }, [pan]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;
      setPan({
        x: dragState.startScrollX + deltaX,
        y: dragState.startScrollY + deltaY,
      });
    }
  }, [isPanning, dragState]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Global mouse event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragState.isDragging && dragState.dragId && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const newX = (e.clientX - rect.left - dragState.offsetX - pan.x) / zoom;
        const newY = (e.clientY - rect.top - dragState.offsetY - pan.y) / zoom;

        setPositions(prev => ({
          ...prev,
          [dragState.dragId!]: { x: newX, y: newY }
        }));
      } else if (isPanning) {
        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;
        setPan({
          x: dragState.startScrollX + deltaX,
          y: dragState.startScrollY + deltaY,
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setDragState({
        isDragging: false,
        dragId: null,
        startX: 0,
        startY: 0,
        startScrollX: 0,
        startScrollY: 0,
        offsetX: 0,
        offsetY: 0,
      });
      setIsPanning(false);
    };

    if (dragState.isDragging || isPanning) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragState, isPanning, zoom, pan]);

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-background">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-crimson font-semibold text-foreground">Saved Ideas</h1>
            <p className="text-muted-foreground text-sm font-inter">
              {savedIdeas.length} {savedIdeas.length === 1 ? 'idea' : 'ideas'} • Drag to organize
            </p>
          </div>
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Infinite Canvas */}
      <div className="flex-1 pt-20 relative overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Loading your saved ideas...</p>
            </div>
          </div>
        ) : savedIdeas.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="bg-card border border-card-sage/30 rounded-2xl p-8 max-w-sm mx-auto shadow-sm">
                <Heart className="h-12 w-12 mx-auto mb-4 text-card-sage" />
                <h2 className="text-xl font-crimson font-semibold text-foreground mb-2">No saved ideas yet</h2>
                <p className="text-muted-foreground mb-6 font-inter text-sm">
                  Swipe right or up on ideas you love to save them here!
                </p>
                <Link href="/">
                  <Button className="bg-card-sage text-white hover:bg-card-sage/90 shadow-sm">
                    Start Exploring Ideas
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div
            ref={canvasRef}
            className="w-full h-full relative cursor-grab active:cursor-grabbing select-none"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: '0 0',
              minHeight: '200vh',
              minWidth: '200vw',
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          >
            {/* Grid Background */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                backgroundPosition: `${pan.x}px ${pan.y}px`,
              }}
            />

            {/* Draggable Cards */}
            {savedIdeas.map((idea, index) => {
              const position = positions[idea.id] || { x: 0, y: 0 };
              const isDragging = dragState.dragId === idea.id;
              
              // Card styles with mobile-friendly sizing
              const cardStyles = [
                "bg-card-sage border-card-sage/40",
                "bg-card-blue-gray border-card-blue-gray/40", 
                "bg-card-cream border-card-cream/40",
                "bg-card-light-blue border-card-light-blue/40",
                "bg-card-purple-gray border-card-purple-gray/40"
              ];

              return (
                <div
                  key={idea.id}
                  className={`absolute cursor-move select-none transition-shadow duration-200 ${
                    isDragging ? 'shadow-2xl scale-105 z-50' : 'shadow-lg hover:shadow-xl z-10'
                  }`}
                  style={{
                    left: position.x,
                    top: position.y,
                    width: '160px', // Square blocks, mobile-friendly
                    height: '160px',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, idea.id)}
                  onTouchStart={(e) => handleTouchStart(e, idea.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <Card className={`${cardStyles[index % cardStyles.length]} w-full h-full border-2 card-shadow hover-lift transition-all duration-300 flex flex-col`}>
                    {/* Drag Handle */}
                    <div className="flex-shrink-0 p-2 border-b border-current/20 bg-black/5 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <Move className="h-3 w-3 text-foreground/60" />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            unsaveIdeaMutation.mutate(idea.id);
                          }}
                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-3 flex flex-col">
                      <h3 className="font-medium text-xs leading-tight mb-2 text-foreground line-clamp-2">
                        {idea.title}
                      </h3>
                      
                      <p className="text-xs text-foreground/70 line-clamp-3 flex-1">
                        {idea.description}
                      </p>
                      
                      {/* Source indicator */}
                      <div className="flex items-center justify-center mt-2 pt-2 border-t border-current/20">
                        {idea.source === 'image' ? (
                          <Image className="h-3 w-3 text-foreground/50" />
                        ) : (
                          <Type className="h-3 w-3 text-foreground/50" />
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}