import { useState, useRef, useEffect, useCallback } from "react";
import { Heart, Image, Type, Trash2, Move, ZoomIn, ZoomOut, Pencil, Eraser, ChevronDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface DrawingState {
  isDrawing: boolean;
  tool: 'pen' | 'eraser';
  color: string;
  size: number;
  paths: Array<{
    id: string;
    points: Array<{ x: number; y: number }>;
    color: string;
    size: number;
  }>;
}

export default function SavedPage() {
  const [positions, setPositions] = useState<{ [ideaId: string]: { x: number; y: number } }>({});
  const [cardColors, setCardColors] = useState<{ [ideaId: string]: number }>({});
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
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    tool: 'pen',
    color: '#3b82f6',
    size: 3,
    paths: [],
  });
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOrder, setMobileOrder] = useState<string[]>([]);
  const [swipeState, setSwipeState] = useState<{
    ideaId: string | null;
    startX: number;
    currentX: number;
    isDragging: boolean;
  }>({
    ideaId: null,
    startX: 0,
    currentX: 0,
    isDragging: false,
  });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Initialize positions and colors for new ideas
  useEffect(() => {
    if (savedIdeas.length > 0) {
      setPositions(prev => {
        const newPositions = { ...prev };
        savedIdeas.forEach((idea, index) => {
          if (!newPositions[idea.id]) {
            // Arrange in a grid pattern initially - responsive for mobile
            const cols = isMobile ? 3 : 4; // 3 columns on mobile, 4 on desktop
            const cardSize = isMobile ? 110 : 160;
            const spacing = isMobile ? 120 : 200;
            
            const col = index % cols;
            const row = Math.floor(index / cols);
            newPositions[idea.id] = {
              x: col * spacing + 20,
              y: row * (cardSize + 20) + 50,
            };
          }
        });
        return newPositions;
      });

      setCardColors(prev => {
        const newColors = { ...prev };
        savedIdeas.forEach((idea, index) => {
          if (newColors[idea.id] === undefined) {
            newColors[idea.id] = index % 8; // Cycle through 8 color options
          }
        });
        return newColors;
      });

      // Initialize mobile order
      setMobileOrder(prev => {
        const currentIds = savedIdeas.map(idea => idea.id);
        const newOrder = [...prev.filter(id => currentIds.includes(id))];
        currentIds.forEach(id => {
          if (!newOrder.includes(id)) {
            newOrder.push(id);
          }
        });
        return newOrder;
      });
    }
  }, [savedIdeas, isMobile]);

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
    // Only start panning if not clicking on a card or other interactive element
    const target = e.target as HTMLElement;
    const isCard = target.closest('[data-card-id]');
    
    if (!isCard) {
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

  // Canvas touch handlers for mobile panning
  const handleCanvasTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const isCard = target.closest('[data-card-id]');
    
    if (!isCard && e.touches.length === 1) {
      const touch = e.touches[0];
      setIsPanning(true);
      setDragState(prev => ({
        ...prev,
        startX: touch.clientX,
        startY: touch.clientY,
        startScrollX: pan.x,
        startScrollY: pan.y,
      }));
    }
  }, [pan]);

  const handleCanvasTouchMove = useCallback((e: React.TouchEvent) => {
    if (isPanning && e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragState.startX;
      const deltaY = touch.clientY - dragState.startY;
      setPan({
        x: dragState.startScrollX + deltaX,
        y: dragState.startScrollY + deltaY,
      });
    }
  }, [isPanning, dragState]);

  const handleCanvasTouchEnd = useCallback(() => {
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

  // Drawing handlers
  const handleDrawingStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode || !svgRef.current) return;
    
    e.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    
    const newPath = {
      id: Date.now().toString(),
      points: [{ x, y }],
      color: drawingState.color,
      size: drawingState.size,
    };
    
    setDrawingState(prev => ({
      ...prev,
      isDrawing: true,
      paths: [...prev.paths, newPath],
    }));
  }, [isDrawingMode, zoom, pan, drawingState.color, drawingState.size]);

  const handleDrawingMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingState.isDrawing || !svgRef.current) return;
    
    e.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    
    setDrawingState(prev => ({
      ...prev,
      paths: prev.paths.map((path, index) => 
        index === prev.paths.length - 1
          ? { ...path, points: [...path.points, { x, y }] }
          : path
      ),
    }));
  }, [drawingState.isDrawing, zoom, pan]);

  const handleDrawingEnd = useCallback(() => {
    setDrawingState(prev => ({ ...prev, isDrawing: false }));
  }, []);

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));

  // Clear all drawings
  const clearDrawings = () => {
    setDrawingState(prev => ({ ...prev, paths: [] }));
  };

  // Change card color
  const changeCardColor = (ideaId: string, colorIndex: number) => {
    setCardColors(prev => ({
      ...prev,
      [ideaId]: colorIndex
    }));
  };

  // Mobile swipe handlers
  const handleMobileSwipeStart = (e: React.TouchEvent | React.MouseEvent, ideaId: string) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setSwipeState({
      ideaId,
      startX: clientX,
      currentX: clientX,
      isDragging: true,
    });
  };

  const handleMobileSwipeMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!swipeState.isDragging || !swipeState.ideaId) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setSwipeState(prev => ({
      ...prev,
      currentX: clientX,
    }));
  };

  const handleMobileSwipeEnd = () => {
    if (!swipeState.isDragging || !swipeState.ideaId) return;
    
    const deltaX = swipeState.currentX - swipeState.startX;
    
    // If swiped left more than 100px, delete the idea
    if (deltaX < -100) {
      unsaveIdeaMutation.mutate(swipeState.ideaId);
    }
    
    setSwipeState({
      ideaId: null,
      startX: 0,
      currentX: 0,
      isDragging: false,
    });
  };

  // Mobile drag to reorder
  const moveMobileIdea = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newOrder = [...mobileOrder];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    setMobileOrder(newOrder);
  };

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
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Header Text - Vertically Aligned Above Toolbar */}
          <div className="mb-3">
            <h1 className="text-xl font-crimson font-semibold text-foreground">Saved Ideas</h1>
            <p className="text-muted-foreground text-sm font-inter">
              {savedIdeas.length} {savedIdeas.length === 1 ? 'idea' : 'ideas'} • Drag to organize
            </p>
          </div>
          
          {/* Drawing and Zoom Controls - Centered Below Header (Desktop Only) */}
          {!isMobile && (
            <div className="flex items-center justify-center gap-2">
            {/* Drawing Mode Toggle */}
            <Button
              size="sm"
              variant={isDrawingMode ? "default" : "outline"}
              onClick={() => setIsDrawingMode(!isDrawingMode)}
              className="h-8 px-3"
            >
              <Pencil className="h-4 w-4 mr-1" />
              <span className="text-xs">Draw</span>
            </Button>
            
            {isDrawingMode && (
              <>
                {/* Color Picker */}
                <div className="flex items-center gap-1">
                  {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#000000'].map(color => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full border-2 ${
                        drawingState.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setDrawingState(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
                
                {/* Clear Drawings */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearDrawings}
                  className="h-8 px-2"
                >
                  <Eraser className="h-3 w-3" />
                </Button>
              </>
            )}
            
            <div className="w-px h-6 bg-border mx-1" />
            
            {/* Zoom Controls */}
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
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-1 ${isMobile ? 'pt-20' : 'pt-24'} relative overflow-hidden`}>
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
        ) : isMobile ? (
          // Mobile: Vertical scrollable list
          <div className="h-full overflow-y-auto px-4 pb-4">
            <div className="space-y-3">
              {mobileOrder
                .map(ideaId => savedIdeas.find(idea => idea.id === ideaId))
                .filter((idea): idea is Idea => Boolean(idea))
                .map((idea, index) => {
                  const colorIndex = cardColors[idea.id] ?? index % 8;
                  const isBeingSwiped = swipeState.ideaId === idea.id;
                  const swipeOffset = isBeingSwiped ? swipeState.currentX - swipeState.startX : 0;
                  
                  const cardStyles = [
                    "bg-card-sage border-card-sage/40",
                    "bg-card-blue-gray border-card-blue-gray/40", 
                    "bg-card-cream border-card-cream/40",
                    "bg-card-light-blue border-card-light-blue/40",
                    "bg-card-purple-gray border-card-purple-gray/40",
                    "bg-card-peach border-card-peach/40",
                    "bg-card-lavender border-card-lavender/40",
                    "bg-card-mint border-card-mint/40"
                  ];
                  
                  const colorNames = [
                    "Sage Green", "Blue Gray", "Cream", "Light Blue",
                    "Purple Gray", "Peach", "Lavender", "Mint"
                  ];

                  return (
                    <div
                      key={idea.id}
                      className="relative"
                      style={{
                        transform: `translateX(${swipeOffset}px)`,
                        transition: isBeingSwiped ? 'none' : 'transform 0.2s ease-out',
                      }}
                    >
                      {/* Delete indicator when swiping left */}
                      {swipeOffset < -50 && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500 z-10">
                          <Trash2 className="h-6 w-6" />
                        </div>
                      )}
                      
                      <Card 
                        className={`${cardStyles[colorIndex]} border-2 card-shadow transition-all duration-200 ${
                          swipeOffset < -50 ? 'bg-red-50' : ''
                        }`}
                        onTouchStart={(e) => handleMobileSwipeStart(e, idea.id)}
                        onTouchMove={handleMobileSwipeMove}
                        onTouchEnd={handleMobileSwipeEnd}
                        onMouseDown={(e) => handleMobileSwipeStart(e, idea.id)}
                        onMouseMove={handleMobileSwipeMove}
                        onMouseUp={handleMobileSwipeEnd}
                      >
                        <div className="p-3 flex items-center gap-3">
                          {/* Drag Handle */}
                          <div className="flex-shrink-0">
                            <GripVertical className="h-5 w-5 text-gray-400" />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate mb-1">
                              {idea.title}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                              {idea.description}
                            </p>
                          </div>
                          
                          {/* Controls */}
                          <div className="flex-shrink-0 flex items-center gap-2">
                            {/* Color Picker */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-gray-200"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-32">
                                {cardStyles.map((style, idx) => (
                                  <DropdownMenuItem
                                    key={idx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      changeCardColor(idea.id, idx);
                                    }}
                                    className="flex items-center gap-2"
                                  >
                                    <div className={`w-3 h-3 rounded-full ${style}`} />
                                    <span className="text-xs">{colorNames[idx]}</span>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            
                            {/* Delete Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                unsaveIdeaMutation.mutate(idea.id);
                              }}
                              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 text-gray-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          // Desktop: Infinite canvas
          <div
            ref={canvasRef}
            className={`w-full h-full relative select-none ${
              isDrawingMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
            }`}
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: '0 0',
              minHeight: '200vh',
              minWidth: '200vw',
            }}
            onMouseDown={isDrawingMode ? handleDrawingStart : handleCanvasMouseDown}
            onMouseMove={isDrawingMode ? handleDrawingMove : handleCanvasMouseMove}
            onMouseUp={isDrawingMode ? handleDrawingEnd : handleCanvasMouseUp}
            onTouchStart={isDrawingMode ? handleDrawingStart : handleCanvasTouchStart}
            onTouchMove={isDrawingMode ? handleDrawingMove : handleCanvasTouchMove}
            onTouchEnd={isDrawingMode ? handleDrawingEnd : handleCanvasTouchEnd}
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

            {/* Drawing SVG Layer */}
            <svg
              ref={svgRef}
              className="absolute inset-0 pointer-events-none"
              style={{
                width: '100%',
                height: '100%',
                overflow: 'visible',
              }}
            >
              {drawingState.paths.map((path) => (
                <path
                  key={path.id}
                  d={`M ${path.points.map(p => `${p.x},${p.y}`).join(' L ')}`}
                  stroke={path.color}
                  strokeWidth={path.size}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}
            </svg>

            {/* Draggable Cards */}
            {savedIdeas.map((idea, index) => {
              const position = positions[idea.id] || { x: 0, y: 0 };
              const isDragging = dragState.dragId === idea.id;
              const colorIndex = cardColors[idea.id] ?? index % 5;
              
              // Card styles with all pastel colors
              const cardStyles = [
                "bg-card-sage border-card-sage/40",
                "bg-card-blue-gray border-card-blue-gray/40", 
                "bg-card-cream border-card-cream/40",
                "bg-card-light-blue border-card-light-blue/40",
                "bg-card-purple-gray border-card-purple-gray/40",
                "bg-card-peach border-card-peach/40",
                "bg-card-lavender border-card-lavender/40",
                "bg-card-mint border-card-mint/40"
              ];
              
              const colorNames = [
                "Sage Green",
                "Blue Gray", 
                "Cream",
                "Light Blue",
                "Purple Gray",
                "Peach",
                "Lavender",
                "Mint"
              ];

              return (
                <div
                  key={idea.id}
                  data-card-id={idea.id}
                  className={`absolute cursor-move select-none transition-shadow duration-200 ${
                    isDragging ? 'shadow-2xl scale-105 z-50' : 'shadow-lg hover:shadow-xl z-10'
                  }`}
                  style={{
                    left: position.x,
                    top: position.y,
                    width: isMobile ? '110px' : '160px', // Smaller on mobile for 3 across
                    height: isMobile ? '110px' : '160px',
                  }}
                  onMouseDown={(e) => !isDrawingMode && handleMouseDown(e, idea.id)}
                  onTouchStart={(e) => !isDrawingMode && handleTouchStart(e, idea.id)}
                  onTouchMove={!isDrawingMode ? handleTouchMove : undefined}
                  onTouchEnd={!isDrawingMode ? handleTouchEnd : undefined}
                >
                  <Card className={`${cardStyles[colorIndex]} w-full h-full border-2 card-shadow hover-lift transition-all duration-300 flex flex-col`}>
                    {/* Drag Handle - Even Smaller */}
                    <div className="flex-shrink-0 p-1 border-b border-gray-400/30 bg-gray-100/50 dark:bg-gray-800/50 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        {/* Color Picker Dropdown - Left Side */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 hover:bg-gray-200 text-gray-400 dark:text-gray-500"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ChevronDown className="h-2 w-2" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-32">
                            {cardStyles.map((style, idx) => (
                              <DropdownMenuItem
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changeCardColor(idea.id, idx);
                                }}
                                className="flex items-center gap-2"
                              >
                                <div className={`w-3 h-3 rounded-full ${style}`} />
                                <span className="text-xs">{colorNames[idx]}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        {/* Delete Button - Right Side */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            unsaveIdeaMutation.mutate(idea.id);
                          }}
                          className="h-4 w-4 p-0 hover:bg-red-100 hover:text-red-600 text-gray-400 dark:text-gray-500"
                        >
                          <Trash2 className="h-2 w-2" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-2 flex flex-col overflow-hidden">
                      {/* Title - Much Larger and Centered */}
                      <h3 className="font-bold text-base leading-tight mb-2 text-gray-800 dark:text-gray-100 line-clamp-2 text-center overflow-hidden">
                        {idea.title}
                      </h3>
                      
                      {/* Description - Smaller with strict overflow handling */}
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs text-gray-600 dark:text-gray-300 text-center leading-relaxed overflow-hidden break-words h-full">
                          <span className="line-clamp-3">
                            {idea.description}
                          </span>
                        </p>
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