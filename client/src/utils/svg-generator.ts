function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateAbstractSVG(prompt: string, width: number = 300, height: number = 150, color: number | null = null): string {
  // Use only the prompt for deterministic generation (no timestamp/random for stability)
  const seed = hashString(prompt);
  
  // Use provided color or generate a random hue
  const hue = color !== null ? color : (seed % 360);
  
  // Generate parameters for modern geometric design
  const numElements = (seed % 3) + 1; // 1-3 elements for clean modern look
  const style = seed % 12; // 12 different modern geometric styles
  
  let content = "";
  
  // Generate modern geometric elements
  for (let i = 0; i < numElements; i++) {
    const elementSeed = seed + (i * 347); // Prime number for better distribution
    const x = (elementSeed % (width - 120)) + 60; // Keep shapes centered
    const y = ((elementSeed >> 4) % (height - 80)) + 40;
    const size = ((elementSeed >> 8) % 50) + 30; // Modern sized elements
    
    // Create different modern geometric elements
    switch(style % 12) {
      case 0: // Modern geometric squares
        content += `
          <g>
            <rect x="${x - size/2}" y="${y - size/2}" width="${size}" height="${size}" 
              fill="hsl(${hue},70%,60%)" rx="8" opacity="0.9">
            </rect>
            <rect x="${x - size/4}" y="${y - size/4}" width="${size/2}" height="${size/2}" 
              fill="hsl(${(hue + 60) % 360},70%,70%)" rx="4" opacity="0.8">
            </rect>
          </g>`;
        break;
        
      case 1: // Overlapping circles
        content += `
          <g>
            <circle cx="${x - 15}" cy="${y}" r="${size * 0.4}" 
              fill="hsl(${hue},80%,65%)" opacity="0.8">
            </circle>
            <circle cx="${x + 15}" cy="${y}" r="${size * 0.4}" 
              fill="hsl(${(hue + 120) % 360},80%,65%)" opacity="0.8">
            </circle>
            <circle cx="${x}" cy="${y - 20}" r="${size * 0.3}" 
              fill="hsl(${(hue + 240) % 360},80%,65%)" opacity="0.8">
            </circle>
          </g>`;
        break;
        
      case 2: // Modern triangular composition
        content += `
          <g>
            <polygon points="${x},${y - size/2} ${x - size/2},${y + size/2} ${x + size/2},${y + size/2}" 
              fill="hsl(${hue},75%,60%)" opacity="0.9">
            </polygon>
            <polygon points="${x},${y - size/4} ${x - size/4},${y + size/4} ${x + size/4},${y + size/4}" 
              fill="hsl(${(hue + 180) % 360},75%,70%)" opacity="0.8">
            </polygon>
          </g>`;
        break;
        
      case 3: // Abstract flowing shapes
        const curve1X = x + (elementSeed % 40) - 20;
        const curve1Y = y + ((elementSeed >> 6) % 40) - 20;
        const curve2X = x + ((elementSeed >> 12) % 40) - 20;
        const curve2Y = y + ((elementSeed >> 18) % 40) - 20;
        content += `
          <g>
            <path d="M${x - size/2} ${y} Q${curve1X} ${curve1Y} ${x + size/2} ${y} Q${curve2X} ${curve2Y} ${x - size/2} ${y}" 
              fill="hsl(${hue},70%,65%)" opacity="0.85">
            </path>
          </g>`;
        break;
        
      case 4: // Geometric grid pattern
        content += `
          <g>
            <rect x="${x - size/2}" y="${y - size/2}" width="${size/3}" height="${size/3}" 
              fill="hsl(${hue},80%,60%)" opacity="0.9">
            </rect>
            <rect x="${x - size/6}" y="${y - size/2}" width="${size/3}" height="${size/3}" 
              fill="hsl(${(hue + 60) % 360},80%,60%)" opacity="0.9">
            </rect>
            <rect x="${x + size/6}" y="${y - size/2}" width="${size/3}" height="${size/3}" 
              fill="hsl(${(hue + 120) % 360},80%,60%)" opacity="0.9">
            </rect>
            <rect x="${x - size/2}" y="${y - size/6}" width="${size/3}" height="${size/3}" 
              fill="hsl(${(hue + 180) % 360},80%,60%)" opacity="0.9">
            </rect>
            <rect x="${x + size/6}" y="${y - size/6}" width="${size/3}" height="${size/3}" 
              fill="hsl(${(hue + 240) % 360},80%,60%)" opacity="0.9">
            </rect>
          </g>`;
        break;
        
      case 5: // Modern hexagon cluster
        content += `
          <g>
            <polygon points="${generateHexagonPoints(x, y, size * 0.4)}" 
              fill="hsl(${hue},75%,65%)" opacity="0.9">
            </polygon>
            <polygon points="${generateHexagonPoints(x - 25, y + 15, size * 0.3)}" 
              fill="hsl(${(hue + 60) % 360},75%,65%)" opacity="0.8">
            </polygon>
            <polygon points="${generateHexagonPoints(x + 25, y + 15, size * 0.3)}" 
              fill="hsl(${(hue + 120) % 360},75%,65%)" opacity="0.8">
            </polygon>
          </g>`;
        break;
        
      case 6: // Abstract wave forms
        content += `
          <g>
            <path d="M${x - size/2} ${y} Q${x - size/4} ${y - size/3} ${x} ${y} Q${x + size/4} ${y + size/3} ${x + size/2} ${y}" 
              fill="none" stroke="hsl(${hue},80%,60%)" stroke-width="12" stroke-linecap="round" opacity="0.9">
            </path>
            <path d="M${x - size/2} ${y + 20} Q${x - size/4} ${y - size/3 + 20} ${x} ${y + 20} Q${x + size/4} ${y + size/3 + 20} ${x + size/2} ${y + 20}" 
              fill="none" stroke="hsl(${(hue + 180) % 360},80%,60%)" stroke-width="8" stroke-linecap="round" opacity="0.7">
            </path>
          </g>`;
        break;
        
      case 7: // Modern diamond pattern
        content += `
          <g>
            <polygon points="${x},${y - size/2} ${x + size/2},${y} ${x},${y + size/2} ${x - size/2},${y}" 
              fill="hsl(${hue},75%,60%)" opacity="0.9">
            </polygon>
            <polygon points="${x},${y - size/4} ${x + size/4},${y} ${x},${y + size/4} ${x - size/4},${y}" 
              fill="hsl(${(hue + 120) % 360},75%,70%)" opacity="0.8">
            </polygon>
          </g>`;
        break;
        
      case 8: // Circular segments
        content += `
          <g>
            <path d="M${x} ${y - size/2} A${size/2} ${size/2} 0 0 1 ${x + size/2} ${y} Z" 
              fill="hsl(${hue},80%,65%)" opacity="0.9">
            </path>
            <path d="M${x + size/2} ${y} A${size/2} ${size/2} 0 0 1 ${x} ${y + size/2} Z" 
              fill="hsl(${(hue + 90) % 360},80%,65%)" opacity="0.9">
            </path>
            <path d="M${x} ${y + size/2} A${size/2} ${size/2} 0 0 1 ${x - size/2} ${y} Z" 
              fill="hsl(${(hue + 180) % 360},80%,65%)" opacity="0.9">
            </path>
          </g>`;
        break;
        
      case 9: // Modern abstract blob
        content += `
          <g>
            <ellipse cx="${x}" cy="${y}" rx="${size * 0.6}" ry="${size * 0.4}" 
              fill="hsl(${hue},75%,65%)" opacity="0.85" transform="rotate(${elementSeed % 360} ${x} ${y})">
            </ellipse>
            <circle cx="${x + 15}" cy="${y - 15}" r="${size * 0.2}" 
              fill="hsl(${(hue + 60) % 360},80%,70%)" opacity="0.9">
            </circle>
          </g>`;
        break;
        
      case 10: // Geometric mountains
        content += `
          <g>
            <polygon points="${x - size/2},${y + size/3} ${x - size/4},${y - size/3} ${x},${y} ${x + size/4},${y - size/2} ${x + size/2},${y + size/3}" 
              fill="hsl(${hue},70%,60%)" opacity="0.9">
            </polygon>
            <polygon points="${x - size/3},${y + size/3} ${x - size/6},${y - size/6} ${x + size/6},${y + size/6} ${x + size/3},${y + size/3}" 
              fill="hsl(${(hue + 120) % 360},70%,65%)" opacity="0.8">
            </polygon>
          </g>`;
        break;
        
      case 11: // Modern spiral forms
        content += `
          <g>
            <circle cx="${x}" cy="${y}" r="${size * 0.4}" 
              fill="none" stroke="hsl(${hue},80%,60%)" stroke-width="8" opacity="0.9">
            </circle>
            <circle cx="${x}" cy="${y}" r="${size * 0.25}" 
              fill="none" stroke="hsl(${(hue + 120) % 360},80%,60%)" stroke-width="6" opacity="0.8">
            </circle>
            <circle cx="${x}" cy="${y}" r="${size * 0.1}" 
              fill="hsl(${(hue + 240) % 360},80%,70%)" opacity="0.9">
            </circle>
          </g>`;
        break;
    }
  }
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 ${width} ${height}"
         width="${width}" height="${height}">
      ${content}
    </svg>
  `;
}

function generateHexagonPoints(cx: number, cy: number, radius: number): string {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
}

function generateStarPoints(cx: number, cy: number, size: number, numPoints: number): string {
  const points = [];
  const outerRadius = size;
  const innerRadius = size * 0.4;
  
  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (i * Math.PI) / numPoints;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + radius * Math.cos(angle - Math.PI / 2);
    const y = cy + radius * Math.sin(angle - Math.PI / 2);
    points.push(`${x},${y}`);
  }
  
  return points.join(' ');
}

function generatePolygonPoints(cx: number, cy: number, radius: number, sides: number): string {
  const points = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
}