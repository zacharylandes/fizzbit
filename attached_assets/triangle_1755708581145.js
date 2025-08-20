import React, { useState, useRef, useEffect } from 'react';

const CreativityTriangleSlider = () => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const triangleRef = useRef(null);

  // In your triangle component, update the generatePrompt function:
const generatePrompt = () => {
  return generateBlendedPrompt(weights.wild, weights.actionable, weights.deep, 5);
};
  // Calculate weights based on position
  const calculateWeights = (pos) => {
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

  // Generate prompt based on weights
  const generatePrompt = () => {
    const dominant = Object.keys(weights).reduce((a, b) => weights[a] > weights[b] ? a : b);
    
    let styleGuide = "";
    let formatGuide = "";
    
    if (dominant === 'wild') {
      styleGuide = "Be experimental, surreal, and boundary-pushing. Think avant-garde art, impossible scenarios, and mind-bending concepts.";
      formatGuide = "Focus on imaginative leaps and unexpected connections.";
    } else if (dominant === 'actionable') {
      styleGuide = "Be practical, immediate, and doable. Think micro-habits, quick wins, and things that can be started today.";
      formatGuide = "Each idea should be completable in 5-30 minutes or be a simple daily practice.";
    } else {
      styleGuide = "Be substantial, meaningful, and project-oriented. Think long-term creative endeavors, skill development, and meaningful goals.";
      formatGuide = "Each idea should be a weeks-to-months commitment with clear development potential.";
    }

    return `Generate ${5} compelling creative ideas with this creative direction:

STYLE: ${styleGuide}
FORMAT: ${formatGuide}

Blend levels: ${Math.round(weights.wild * 100)}% Wild Inspiration + ${Math.round(weights.actionable * 100)}% Daily Actionable + ${Math.round(weights.deep * 100)}% Deep Projects

Always make the ideas directly about the user input - be imaginative but clear and actionable.

Format each as:
1. TITLE: [2-4 intriguing words]
IDEA: [One clear sentence that directly explores the user input]
HOOK: [What makes this interesting/doable/wild based on the current blend]`;
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updatePosition(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      e.preventDefault();
      updatePosition(e);
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      e.preventDefault();
      const touch = e.touches[0];
      updatePosition(touch);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const isPointInTriangle = (x, y) => {
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

  const constrainToTriangle = (x, y) => {
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

  const updatePosition = (e) => {
    if (!triangleRef.current) return;
    
    const rect = triangleRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;
    
    const constrainedPos = constrainToTriangle(rawX, rawY);
    setPosition(constrainedPos);
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (isDragging) {
        e.preventDefault();
        updatePosition(e);
      }
    };

    const handleTouchMove = (e) => {
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
    <div className="w-full max-w-2xl mx-auto p-8 bg-gray-50 rounded-3xl shadow-lg border border-gray-200">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-medium text-gray-800 mb-2">
          Creativity Triangle
        </h2>
        <p className="text-gray-500 text-sm">Drag the dot to blend your creative style</p>
      </div>

      {/* Triangle Container */}
      <div 
        ref={triangleRef}
        className="relative w-96 h-96 mx-auto mb-8 cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
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
            rx="8"
          />
        </svg>

        {/* Corner Labels */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
          <div className="text-center">
            <div className="w-3 h-3 bg-purple-400 rounded-full mx-auto mb-1"></div>
            <span className="text-xs font-medium text-gray-700">Wild Inspiration</span>
            <div className="text-xs text-gray-500">Surreal • Experimental</div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-8 transform -translate-x-1/2 translate-y-4">
          <div className="text-center">
            <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-1"></div>
            <span className="text-xs font-medium text-gray-700">Daily Tasks</span>
            <div className="text-xs text-gray-500">Quick • Practical</div>
          </div>
        </div>
        
        <div className="absolute bottom-0 right-8 transform translate-x-1/2 translate-y-4">
          <div className="text-center">
            <div className="w-3 h-3 bg-blue-400 rounded-full mx-auto mb-1"></div>
            <span className="text-xs font-medium text-gray-700">Deep Projects</span>
            <div className="text-xs text-gray-500">Substantial • Long-term</div>
          </div>
        </div>

        {/* Draggable Dot */}
        <div 
          className={`absolute w-6 h-6 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 cursor-grab ${
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
          onTouchStart={handleMouseDown}
        >
          <div className="w-full h-full bg-white rounded-full border-2 border-white shadow-inner"></div>
        </div>
      </div>

      {/* Weight Display */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-semibold text-blue-500">{Math.round(weights.wild * 100)}%</div>
          <div className="text-xs text-gray-600">Wild</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-green-500">{Math.round(weights.actionable * 100)}%</div>
          <div className="text-xs text-gray-600">Actionable</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-purple-500">{Math.round(weights.deep * 100)}%</div>
          <div className="text-xs text-gray-600">Deep</div>
        </div>
      </div>

      {/* Generated Prompt Preview */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
        <h3 className="font-medium text-gray-700 mb-3 text-sm">Generated Prompt:</h3>
        <div className="text-xs text-gray-600 bg-white rounded-xl p-4 font-mono leading-relaxed border border-gray-100">
          {generatePrompt()}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="mt-6 flex justify-center gap-3">
        <button 
          onClick={() => setPosition({ x: 50, y: 15 })}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition-colors border border-gray-200"
        >
          Pure Wild
        </button>
        <button 
          onClick={() => setPosition({ x: 15, y: 85 })}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition-colors border border-gray-200"
        >
          Pure Tasks
        </button>
        <button 
          onClick={() => setPosition({ x: 85, y: 85 })}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition-colors border border-gray-200"
        >
          Pure Deep
        </button>
        <button 
          onClick={() => setPosition({ x: 50, y: 50 })}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition-colors border border-gray-200"
        >
          Balanced
        </button>
      </div>
    </div>
  );
};

export default CreativityTriangleSlider;