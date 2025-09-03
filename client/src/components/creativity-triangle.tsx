import React, { useState, useRef, useEffect } from 'react';

interface CreativityTriangleProps {
  onWeightsChange: (weights: { wild: number; actionable: number; deep: number }) => void;
  className?: string;
}

export const CreativityTriangle = ({ onWeightsChange, className = "" }: CreativityTriangleProps) => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const triangleRef = useRef<HTMLDivElement>(null);

  // Calculate weights based on position
  const calculateWeights = (pos: { x: number; y: number }) => {
    // Triangle vertices (as percentages)
    const vertices = {
      wild: { x: 50, y: 15 },      // Top: Wild Inspiration
      actionable: { x: 15, y: 85 }, // Bottom left: Daily Tasks
      deep: { x: 85, y: 85 }        // Bottom right: Deep Projects
    };

    // Calculate distances from each vertex
    const distances = {
      wild: Math.sqrt(Math.pow(pos.x - vertices.wild.x, 2) + Math.pow(pos.y - vertices.wild.y, 2)),
      actionable: Math.sqrt(Math.pow(pos.x - vertices.actionable.x, 2) + Math.pow(pos.y - vertices.actionable.y, 2)),
      deep: Math.sqrt(Math.pow(pos.x - vertices.deep.x, 2) + Math.pow(pos.y - vertices.deep.y, 2))
    };

    // Convert distances to weights (closer = higher weight)
    const maxDistance = 100;
    const weights = {
      wild: Math.max(0, maxDistance - distances.wild) / maxDistance,
      actionable: Math.max(0, maxDistance - distances.actionable) / maxDistance,
      deep: Math.max(0, maxDistance - distances.deep) / maxDistance
    };

    // Normalize weights
    const total = weights.wild + weights.actionable + weights.deep;
    return {
      wild: weights.wild / total,
      actionable: weights.actionable / total,
      deep: weights.deep / total
    };
  };

  const weights = calculateWeights(position);

  // Notify parent of weight changes
  useEffect(() => {
    onWeightsChange(weights);
  }, [position, onWeightsChange]);

  const isPointInTriangle = (x: number, y: number) => {
    // Triangle vertices in percentage coordinates
    const x1 = 50, y1 = 20; // Top
    const x2 = 20, y2 = 80; // Bottom left
    const x3 = 80, y3 = 80; // Bottom right
    
    // Calculate barycentric coordinates
    const denom = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
    const a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / denom;
    const b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / denom;
    const c = 1 - a - b;
    
    return a >= 0 && b >= 0 && c >= 0;
  };

  const constrainToTriangle = (x: number, y: number) => {
    if (isPointInTriangle(x, y)) {
      return { x, y };
    }
    
    // If outside triangle, find closest point on triangle boundary
    const vertices = [
      { x: 50, y: 20 }, // Top
      { x: 20, y: 80 }, // Bottom left
      { x: 80, y: 80 }  // Bottom right
    ];
    
    let minDist = Infinity;
    let closestPoint = { x, y };
    
    // Check each edge of the triangle
    for (let i = 0; i < 3; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % 3];
      
      // Find closest point on this edge
      const A = x - v1.x;
      const B = y - v1.y;
      const C = v2.x - v1.x;
      const D = v2.y - v1.y;
      
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;
      
      if (lenSq !== 0) {
        param = dot / lenSq;
      }
      
      let xx, yy;
      if (param < 0) {
        xx = v1.x;
        yy = v1.y;
      } else if (param > 1) {
        xx = v2.x;
        yy = v2.y;
      } else {
        xx = v1.x + param * C;
        yy = v1.y + param * D;
      }
      
      const dx = x - xx;
      const dy = y - yy;
      const dist = dx * dx + dy * dy;
      
      if (dist < minDist) {
        minDist = dist;
        closestPoint = { x: xx, y: yy };
      }
    }
    
    return closestPoint;
  };

  const updatePosition = (e: MouseEvent | Touch) => {
    if (!triangleRef.current) return;
    
    const rect = triangleRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;
    
    const constrainedPos = constrainToTriangle(rawX, rawY);
    setPosition(constrainedPos);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updatePosition(e.nativeEvent);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updatePosition(e.touches[0]);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        updatePosition(e);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
        const touch = e.touches[0];
        updatePosition(touch);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMove, { passive: false });
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-light text-gray-800 mb-1">
          Creativity Blend
        </h3>
        <p className="text-gray-500 text-sm">Drag to set your creative style</p>
      </div>

      {/* Triangle Container */}
      <div 
        ref={triangleRef}
        className="relative w-64 h-64 mx-auto mb-4 cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{ touchAction: 'none' }}
      >
        {/* Triangle Background */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="triangleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ddd6fe" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#e0f2fe" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#dcfce7" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path 
            d="M 50 20 L 80 80 L 20 80 Z" 
            fill="url(#triangleGrad)" 
            stroke="#9ca3af" 
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>

        {/* Corner Labels */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3">
          <div className="text-center">
            <div className="w-2 h-2 bg-purple-400 rounded-full mx-auto mb-1"></div>
            <span className="text-xs font-medium text-gray-700">Wild</span>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-4 transform -translate-x-1/2 translate-y-3">
          <div className="text-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mb-1"></div>
            <span className="text-xs font-medium text-gray-700">Actionable</span>
          </div>
        </div>
        
        <div className="absolute bottom-0 right-4 transform translate-x-1/2 translate-y-3">
          <div className="text-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full mx-auto mb-1"></div>
            <span className="text-xs font-medium text-gray-700">Deep</span>
          </div>
        </div>

        {/* Draggable Dot */}
        <div 
          className={`absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 cursor-grab ${
            isDragging ? 'scale-125 shadow-xl cursor-grabbing' : 'shadow-lg hover:scale-110 hover:shadow-xl'
          }`}
          style={{ 
            left: `${position.x}%`, 
            top: `${position.y}%`,
            background: `linear-gradient(135deg, 
              rgba(147, 197, 253, ${weights.wild}), 
              rgba(134, 239, 172, ${weights.actionable}), 
              rgba(196, 181, 253, ${weights.deep}))`
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="w-full h-full bg-white rounded-full border-2 border-white shadow-inner"></div>
        </div>
      </div>

      {/* Weight Display */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <div className="text-lg font-normal text-purple-500">{Math.round(weights.wild * 100)}%</div>
          <div className="text-xs text-gray-600">Wild</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-normal text-green-500">{Math.round(weights.actionable * 100)}%</div>
          <div className="text-xs text-gray-600">Actionable</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-normal text-blue-500">{Math.round(weights.deep * 100)}%</div>
          <div className="text-xs text-gray-600">Deep</div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex justify-center gap-2">
        <button 
          onClick={() => setPosition({ x: 50, y: 15 })}
          className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-xs hover:bg-purple-200 transition-colors"
        >
          Wild
        </button>
        <button 
          onClick={() => setPosition({ x: 15, y: 85 })}
          className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs hover:bg-green-200 transition-colors"
        >
          Quick
        </button>
        <button 
          onClick={() => setPosition({ x: 85, y: 85 })}
          className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs hover:bg-blue-200 transition-colors"
        >
          Deep
        </button>
        <button 
          onClick={() => setPosition({ x: 50, y: 50 })}
          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition-colors"
        >
          Mix
        </button>
      </div>
    </div>
  );
};