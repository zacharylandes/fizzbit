import { useState, useRef, useEffect, useCallback } from "react";
import { Heart, Image, Type, Trash2, Move, ZoomIn, ZoomOut, Pencil, Eraser, Palette, GripVertical, Menu, Edit2, Check } from "lucide-react";
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
  
  // Sidebar state
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [selectedColorGroup, setSelectedColorGroup] = useState<number | null>(null);
  const [groupTitles, setGroupTitles] = useState<{ [colorIndex: number]: string }>({});
  const [editingGroup, setEditingGroup] = useState<number | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [swipeState, setSwipeState] = useState<{
    ideaId: string | null;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isDragging: boolean;
    isVerticalDrag: boolean;
    dragIndex: number | null;
    isDeleting: boolean;
    holdTimer: NodeJS.Timeout | null;
    canDrag: boolean;
    startTime: number;
  }>({
    ideaId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
    isVerticalDrag: false,
    dragIndex: null,
    isDeleting: false,
    holdTimer: null,
    canDrag: false,
    startTime: 0,
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

  // Detect keyboard open/close on mobile
  useEffect(() => {
    if (!isMobile) return;

    let initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const heightDifference = initialViewportHeight - currentHeight;
        // Consider keyboard open if viewport height decreased by more than 150px
        setIsKeyboardOpen(heightDifference > 150);
      }
    };

    // Fallback for browsers without visualViewport support
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      setIsKeyboardOpen(heightDifference > 150);
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
  }, [isMobile]);

  // Global event listeners for mobile interactions
  useEffect(() => {
    if (!isMobile || !swipeState.isDragging) return;

    const handleGlobalMove = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const deltaX = clientX - swipeState.startX;
      const deltaY = clientY - swipeState.startY;
      
      // Determine if this is vertical drag or horizontal swipe (higher threshold for less sensitivity)
      if (!swipeState.isVerticalDrag && Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 25) {
        setSwipeState(prev => ({ ...prev, isVerticalDrag: true }));
      }
      
      setSwipeState(prev => ({
        ...prev,
        currentX: clientX,
        currentY: clientY,
      }));
    };

    const handleGlobalEnd = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      
      const deltaX = swipeState.currentX - swipeState.startX;
      const deltaY = swipeState.currentY - swipeState.startY;
      
      if (swipeState.isVerticalDrag) {
        // Handle vertical reorder
        const cardHeight = 80; // Approximate height of each card
        const moveDistance = Math.round(deltaY / cardHeight);
        if (swipeState.dragIndex !== null && Math.abs(moveDistance) > 0) {
          const newIndex = Math.max(0, Math.min(mobileOrder.length - 1, swipeState.dragIndex + moveDistance));
          if (newIndex !== swipeState.dragIndex) {
            // Using callback to access latest functions
            const currentMobileIdea = moveMobileIdea;
            const currentUnsaveIdea = unsaveIdeaMutation;
            currentMobileIdea(swipeState.dragIndex, newIndex);
          }
        }
      } else if (deltaX < -150) {
        // Handle horizontal swipe to delete - animate slide away before removing (higher threshold)
        if (swipeState.ideaId) {
          // Set state to animate the card sliding away
          setSwipeState(prev => ({
            ...prev,
            currentX: swipeState.startX - 400, // Slide completely off screen
            isDragging: false, // This will enable transition
            isVerticalDrag: false,
            isDeleting: true // Mark as deleting to prevent state reset
          }));
          
          // Remove after animation completes
          setTimeout(() => {
            const currentUnsaveIdea = unsaveIdeaMutation;
            currentUnsaveIdea.mutate(swipeState.ideaId!);
          }, 300); // Wait for slide animation to complete
          return;
        }
      }
      
      // Reset state for non-delete swipes (only if not deleting)
      if (!swipeState.isDeleting) {
        // Clear hold timer if it exists
        if (swipeState.holdTimer) {
          clearTimeout(swipeState.holdTimer);
        }
        setSwipeState({
          ideaId: null,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
          isDragging: false,
          isVerticalDrag: false,
          dragIndex: null,
          isDeleting: false,
          holdTimer: null,
          canDrag: false,
          startTime: 0,
        });
      }
    };

    document.addEventListener('touchmove', handleGlobalMove, { passive: false });
    document.addEventListener('touchend', handleGlobalEnd, { passive: false });
    document.addEventListener('mousemove', handleGlobalMove);
    document.addEventListener('mouseup', handleGlobalEnd);

    return () => {
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('touchend', handleGlobalEnd);
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
    };
  }, [isMobile, swipeState.isDragging, swipeState.startX, swipeState.startY, swipeState.currentX, swipeState.currentY, swipeState.isVerticalDrag, swipeState.dragIndex, swipeState.ideaId, mobileOrder.length]);

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

  // Mobile drag to reorder - declared before useEffect
  const moveMobileIdea = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newOrder = [...mobileOrder];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    setMobileOrder(newOrder);
  }, [mobileOrder]);

  // Unsave idea mutation - declared before useEffect
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
      
      // Update mobile order to remove the deleted item
      if (swipeState.ideaId) {
        setMobileOrder(prev => prev.filter(id => id !== swipeState.ideaId));
      }
      
      // Reset swipe state after successful deletion
      setSwipeState({
        ideaId: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        isDragging: false,
        isVerticalDrag: false,
        dragIndex: null,
        isDeleting: false,
        holdTimer: null,
        canDrag: false,
        startTime: 0,
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
        title: "Error",
        description: "Failed to remove idea. Please try again.",
        variant: "destructive",
      });
    },
  });

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

      // Initialize mobile order - preserve existing order and only add new items
      setMobileOrder(prev => {
        const currentIds = savedIdeas.map(idea => idea.id);
        const filteredOrder = prev.filter(id => currentIds.includes(id));
        
        // Add any new ideas to the end
        currentIds.forEach(id => {
          if (!filteredOrder.includes(id)) {
            filteredOrder.push(id);
          }
        });
        
        return filteredOrder;
      });
    }
  }, [savedIdeas, isMobile]);

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
    console.log('🎨 Changing card color:', { ideaId, colorIndex });
    setCardColors(prev => {
      const newColors = {
        ...prev,
        [ideaId]: colorIndex
      };
      console.log('🎨 New card colors state:', newColors);
      return newColors;
    });
  };

  // Mobile interaction start handler with hold delay
  const handleMobileInteractionStart = (e: React.TouchEvent | React.MouseEvent, ideaId: string, index: number) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startTime = Date.now();
    
    // Clear any existing timer
    if (swipeState.holdTimer) {
      clearTimeout(swipeState.holdTimer);
    }
    
    // Set a timer to enable drag after 500ms hold (longer hold for less accidental activation)
    const holdTimer = setTimeout(() => {
      setSwipeState(prev => ({
        ...prev,
        canDrag: true
      }));
    }, 500);
    
    setSwipeState({
      ideaId,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      isDragging: true,
      isVerticalDrag: false,
      dragIndex: index,
      isDeleting: false,
      holdTimer,
      canDrag: false,
      startTime,
    });
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

  // Get available color groups from saved ideas
  const availableColorGroups = Array.from(new Set(Object.values(cardColors)))
    .sort((a, b) => a - b);
  
  // Get default group title
  const getGroupTitle = (colorIndex: number) => {
    return groupTitles[colorIndex] || `Group ${colorIndex + 1}`;
  };
  
  // Handle group title editing
  const handleEditGroupTitle = (colorIndex: number, newTitle: string) => {
    setGroupTitles(prev => ({
      ...prev,
      [colorIndex]: newTitle
    }));
    setEditingGroup(null);
  };

  // Scroll editing group into view with footer clearance
  useEffect(() => {
    if (editingGroup !== null) {
      // Find the editing group button and scroll it into view
      setTimeout(() => {
        const editingButton = document.querySelector(`[data-group-index="${editingGroup}"]`);
        const sidebar = document.querySelector('.sidebar-container');
        if (editingButton && sidebar) {
          // Get element position and sidebar dimensions
          const buttonRect = editingButton.getBoundingClientRect();
          const sidebarRect = sidebar.getBoundingClientRect();
          
          // Calculate if button is too close to bottom (within footer area)
          const footerHeight = 80; // Approximate footer height
          const viewportHeight = window.innerHeight;
          const isNearBottom = buttonRect.bottom > (viewportHeight - footerHeight);
          
          if (isNearBottom) {
            // Scroll the sidebar to bring the button higher up
            const scrollOffset = buttonRect.bottom - (viewportHeight - footerHeight - 20);
            sidebar.scrollBy({
              top: scrollOffset,
              behavior: 'smooth'
            });
          } else {
            // Standard center scroll
            editingButton.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }
      }, 150);
    }
  }, [editingGroup]);
  
  // Filter ideas by selected color group
  const filteredIdeas = selectedColorGroup !== null 
    ? savedIdeas.filter(idea => cardColors[idea.id] === selectedColorGroup)
    : savedIdeas;

  return (
    <div className="min-h-screen bg-background" data-keyboard-open={isKeyboardOpen}>
      {/* Mobile Overlay */}
      {isMobile && sidebarExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarExpanded(false)}
        />
      )}

      {/* Collapsible Sidebar */}
      <div className={`sidebar-container fixed top-16 left-0 bottom-0 z-40 bg-background border-r border-border transition-all duration-300 ease-in-out ${
        sidebarExpanded ? 'w-1/2 max-w-sm' : isMobile ? 'w-0' : 'w-16'
      }`} style={{ 
        visibility: sidebarExpanded || !isMobile ? 'visible' : 'hidden'
      }}>
        <div className="p-4 h-full overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Sidebar Header */}
          <div className="flex items-center justify-center mb-6">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="h-8 w-8 p-0 bg-card-sage hover:bg-card-sage/90 mx-auto"
            >
              <Menu className="h-4 w-4 text-green-700" />
            </Button>
          </div>
          
          {/* Color Groups */}
          {sidebarExpanded && (
            <div className="space-y-3">
              {/* All Ideas Option */}
              <button
                onClick={() => setSelectedColorGroup(null)}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  selectedColorGroup === null 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-card border-border hover:bg-accent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 border border-gray-200" />
                  <span className="text-sm font-medium">All Ideas</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {savedIdeas.length}
                  </span>
                </div>
              </button>
              
              {/* Color Group Options */}
              {availableColorGroups.map(colorIndex => {
                const ideaCount = savedIdeas.filter(idea => cardColors[idea.id] === colorIndex).length;
                if (ideaCount === 0) return null;
                
                const cardStyles = [
                  "bg-card-sage border-card-sage/40",
                  "bg-card-blue border-card-blue/40", 
                  "bg-card-cream border-card-cream/40",
                  "bg-card-lightblue border-card-lightblue/40",
                  "bg-card-purple border-card-purple/40",
                  "bg-card-peach border-card-peach/40",
                  "bg-card-lavender border-card-lavender/40",
                  "bg-card-mint border-card-mint/40"
                ];

                const colorCircles = [
                  "bg-green-200",
                  "bg-blue-200", 
                  "bg-yellow-100",
                  "bg-sky-200",
                  "bg-purple-200",
                  "bg-orange-200",
                  "bg-violet-200",
                  "bg-emerald-200"
                ];
                
                return (
                  <button
                    key={colorIndex}
                    data-group-index={colorIndex}
                    onClick={() => setSelectedColorGroup(colorIndex)}
                    onDoubleClick={() => {
                      setSelectedColorGroup(colorIndex);
                      setSidebarExpanded(false);
                    }}
                    className={`group w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedColorGroup === colorIndex 
                        ? `${cardStyles[colorIndex]} border-2` 
                        : 'bg-card border-border hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border border-gray-300 ${colorCircles[colorIndex] || 'bg-gray-300'}`} />
                      <div className="flex-1 min-w-0">
                        {editingGroup === colorIndex ? (
                          <input
                            type="text"
                            defaultValue={getGroupTitle(colorIndex)}
                            className="w-full text-sm font-medium bg-transparent border-none outline-none"
                            onBlur={(e) => handleEditGroupTitle(colorIndex, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEditGroupTitle(colorIndex, e.currentTarget.value);
                              } else if (e.key === 'Escape') {
                                setEditingGroup(null);
                              }
                            }}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-sm font-medium truncate">
                            {getGroupTitle(colorIndex)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">{ideaCount}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGroup(colorIndex);
                          }}
                          className="h-6 w-6 p-0 opacity-70 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Page Title Section - Full width below main header */}
      <div className={`relative bg-background border-b border-border ${isMobile ? 'h-16' : 'h-16'} ${
        !isMobile && sidebarExpanded ? 'ml-80' : !isMobile ? 'ml-16' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3 h-full">
          <div className="flex items-center gap-3 h-full">
            {/* Mobile Hamburger Menu */}
            {isMobile && !sidebarExpanded && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSidebarExpanded(true)}
                className="h-8 w-8 p-0 bg-card-sage hover:bg-card-sage/90 rounded-lg"
              >
                <Menu className="h-4 w-4 text-green-700" />
              </Button>
            )}
            
            {/* Header Text */}
            <div className="flex-1">
              <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-crimson font-semibold text-foreground`}>
                {selectedColorGroup !== null 
                  ? `${getGroupTitle(selectedColorGroup)} (${filteredIdeas.length})`
                  : `Saved Ideas (${filteredIdeas.length})`
                }
              </h1>
            </div>
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
      <div className={`flex-1 relative overflow-hidden ${
        !isMobile && sidebarExpanded ? 'ml-80' : !isMobile ? 'ml-16' : ''
      }`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Loading your saved ideas...</p>
            </div>
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="bg-card border border-card-sage/30 rounded-2xl p-8 max-w-sm mx-auto shadow-sm">
                <Heart className="h-12 w-12 mx-auto mb-4 text-card-sage" />
                <h2 className="text-xl font-crimson font-semibold text-foreground mb-2">
                  {selectedColorGroup !== null ? 'No ideas in this group' : 'No saved ideas yet'}
                </h2>
                <p className="text-muted-foreground mb-6 font-inter text-sm">
                  {selectedColorGroup !== null 
                    ? 'Save more ideas and assign them to this group!'
                    : 'Swipe right or up on ideas you love to save them here!'
                  }
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
          <div className="h-full overflow-y-auto px-4 pt-4 pb-24">
            <div className="space-y-3">
              {mobileOrder
                .map(ideaId => savedIdeas.find(idea => idea.id === ideaId))
                .filter((idea): idea is Idea => Boolean(idea))
                .filter(idea => selectedColorGroup === null || cardColors[idea.id] === selectedColorGroup)
                .map((idea, index) => {
                  const colorIndex = cardColors[idea.id] ?? index % 8;
                  console.log('🎨 Mobile card render:', { ideaId: idea.id, colorIndex, cardColorsState: cardColors[idea.id] });
                  const isBeingInteracted = swipeState.ideaId === idea.id;
                  const isDeleting = isBeingInteracted && swipeState.isDeleting;
                  const isDragging = isBeingInteracted && swipeState.isDragging;
                  const swipeOffsetX = isBeingInteracted && !swipeState.isVerticalDrag ? swipeState.currentX - swipeState.startX : 0;
                  const swipeOffsetY = isBeingInteracted && swipeState.isVerticalDrag ? swipeState.currentY - swipeState.startY : 0;
                  
                  // Calculate smooth reordering offset for other cards
                  let reorderOffsetY = 0;
                  if (swipeState.isDragging && swipeState.isVerticalDrag && swipeState.dragIndex !== null && !isBeingInteracted) {
                    const draggedIndex = swipeState.dragIndex;
                    const draggedY = swipeState.currentY - swipeState.startY;
                    const cardHeight = 80; // Height of each card including spacing
                    const newPosition = Math.round(draggedY / cardHeight);
                    const targetIndex = Math.max(0, Math.min(mobileOrder.length - 1, draggedIndex + newPosition));
                    
                    if (draggedIndex < targetIndex && index > draggedIndex && index <= targetIndex) {
                      reorderOffsetY = -cardHeight; // Move up
                    } else if (draggedIndex > targetIndex && index >= targetIndex && index < draggedIndex) {
                      reorderOffsetY = cardHeight; // Move down
                    }
                  }
                  
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
                      key={`${idea.id}-${colorIndex}`}
                      className="relative"
                      style={{
                        transform: `translate(${swipeOffsetX}px, ${swipeOffsetY + reorderOffsetY}px)`,
                        transition: isDragging && isBeingInteracted ? 'none' : 'transform 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.15s ease',
                        zIndex: isBeingInteracted ? 10 : 1,
                        opacity: isDeleting ? 0 : 1,
                      }}
                    >
                      {/* Delete indicator when swiping left */}
                      {swipeOffsetX < -50 && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500 z-10">
                          <Trash2 className="h-6 w-6" />
                        </div>
                      )}
                      
                      <Card 
                        key={`card-${idea.id}-${colorIndex}`}
                        className={`${cardStyles[colorIndex]} border-2 card-shadow transition-all duration-200 ${
                          swipeOffsetX < -50 ? 'bg-red-50 dark:bg-red-900/20' : ''
                        } ${isBeingInteracted ? 'shadow-lg scale-[1.02] ring-2 ring-primary/20' : ''}`}
                        onTouchStart={(e) => handleMobileInteractionStart(e, idea.id, index)}
                        onMouseDown={(e) => handleMobileInteractionStart(e, idea.id, index)}
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
                          <div 
                            className="flex-shrink-0 flex flex-col items-center gap-1"
                            onTouchStart={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            {/* Color Picker */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 touch-manipulation"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Palette className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                {cardStyles.map((style, idx) => (
                                  <DropdownMenuItem
                                    key={idx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      changeCardColor(idea.id, idx);
                                    }}
                                    className="flex items-center gap-3 py-3 px-3 touch-manipulation cursor-pointer hover:bg-accent"
                                  >
                                    <div className={`w-4 h-4 rounded-full ${style.replace(/bg-card-(\w+)/, 'bg-card-$1').replace(/border-card-(\w+)\/40/, '')} border border-gray-300`} />
                                    <span className="text-sm">{colorNames[idx]}</span>
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
                              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 text-gray-400 touch-manipulation"
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
            {filteredIdeas.map((idea, index) => {
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
                              className="h-4 w-4 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Palette className="h-2 w-2" />
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
                                <div className={`w-3 h-3 rounded-full ${style.replace(/bg-card-(\w+)/, 'bg-card-$1').replace(/border-card-(\w+)\/40/, '')}`} />
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