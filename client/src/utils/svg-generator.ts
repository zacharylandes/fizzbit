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
  
  // Use provided color or generate a muted hue
  const hue = color !== null ? color : (seed % 360);
  
  // Generate parameters for clean, simple design
  const style = seed % 8; // 8 different simple styles
  
  let content = "";
  
  // Create simple, clean illustrations matching the reference style
  const x = width / 2;
  const y = height / 2;
  
  switch(style % 8) {
    case 0: // Simple card/rectangle mockup
      content += `
        <g>
          <rect x="${x - 60}" y="${y - 30}" width="120" height="60" 
            fill="none" stroke="hsl(${hue},40%,50%)" stroke-width="2" rx="8" opacity="0.6">
          </rect>
          <rect x="${x - 50}" y="${y - 20}" width="30" height="4" 
            fill="hsl(${hue},40%,50%)" rx="2" opacity="0.4">
          </rect>
          <rect x="${x - 50}" y="${y - 10}" width="60" height="4" 
            fill="hsl(${hue},40%,50%)" rx="2" opacity="0.3">
          </rect>
          <rect x="${x - 50}" y="${y}" width="40" height="4" 
            fill="hsl(${hue},40%,50%)" rx="2" opacity="0.3">
          </rect>
        </g>`;
      break;
      
    case 1: // Simple chart/graph
      content += `
        <g>
          <rect x="${x - 15}" y="${y + 10}" width="8" height="30" 
            fill="hsl(${hue},50%,60%)" rx="2" opacity="0.7">
          </rect>
          <rect x="${x - 3}" y="${y - 10}" width="8" height="50" 
            fill="hsl(${(hue + 60) % 360},50%,60%)" rx="2" opacity="0.7">
          </rect>
          <rect x="${x + 9}" y="${y}" width="8" height="40" 
            fill="hsl(${(hue + 120) % 360},50%,60%)" rx="2" opacity="0.7">
          </rect>
          <line x1="${x - 40}" y1="${y + 45}" x2="${x + 40}" y2="${y + 45}" 
            stroke="hsl(${hue},30%,50%)" stroke-width="2" opacity="0.4"/>
          <line x1="${x - 40}" y1="${y + 45}" x2="${x - 40}" y2="${y - 30}" 
            stroke="hsl(${hue},30%,50%)" stroke-width="2" opacity="0.4"/>
        </g>`;
      break;
      
    case 2: // Simple circle with dot (like progress indicator)
      content += `
        <g>
          <circle cx="${x}" cy="${y}" r="40" 
            fill="none" stroke="hsl(${hue},50%,60%)" stroke-width="6" opacity="0.3">
          </circle>
          <circle cx="${x}" cy="${y}" r="40" 
            fill="none" stroke="hsl(${hue},60%,50%)" stroke-width="6" stroke-dasharray="40 200" opacity="0.7">
          </circle>
          <circle cx="${x}" cy="${y}" r="8" 
            fill="hsl(${(hue + 180) % 360},70%,60%)" opacity="0.8">
          </circle>
        </g>`;
      break;
      
    case 3: // Simple list items
      content += `
        <g>
          <circle cx="${x - 50}" cy="${y - 20}" r="4" 
            fill="hsl(${hue},60%,50%)" opacity="0.6">
          </circle>
          <rect x="${x - 40}" y="${y - 22}" width="60" height="4" 
            fill="hsl(${hue},40%,50%)" rx="2" opacity="0.4">
          </rect>
          
          <circle cx="${x - 50}" cy="${y}" r="4" 
            fill="hsl(${(hue + 60) % 360},60%,50%)" opacity="0.6">
          </circle>
          <rect x="${x - 40}" y="${y - 2}" width="50" height="4" 
            fill="hsl(${hue},40%,50%)" rx="2" opacity="0.4">
          </rect>
          
          <circle cx="${x - 50}" cy="${y + 20}" r="4" 
            fill="hsl(${(hue + 120) % 360},60%,50%)" opacity="0.6">
          </circle>
          <rect x="${x - 40}" y="${y + 18}" width="40" height="4" 
            fill="hsl(${hue},40%,50%)" rx="2" opacity="0.4">
          </rect>
        </g>`;
      break;
      
    case 4: // Simple device/screen mockup
      content += `
        <g>
          <rect x="${x - 40}" y="${y - 25}" width="80" height="50" 
            fill="none" stroke="hsl(${hue},40%,50%)" stroke-width="3" rx="8" opacity="0.6">
          </rect>
          <rect x="${x - 30}" y="${y - 15}" width="60" height="3" 
            fill="hsl(${hue},50%,60%)" rx="1" opacity="0.5">
          </rect>
          <rect x="${x - 30}" y="${y - 8}" width="25" height="3" 
            fill="hsl(${hue},50%,60%)" rx="1" opacity="0.4">
          </rect>
          <rect x="${x - 30}" y="${y - 1}" width="35" height="3" 
            fill="hsl(${hue},50%,60%)" rx="1" opacity="0.4">
          </rect>
          <circle cx="${x + 20}" cy="${y + 10}" r="8" 
            fill="hsl(${(hue + 120) % 360},60%,60%)" opacity="0.5">
          </circle>
        </g>`;
      break;
      
    case 5: // Simple geometric shape with line
      content += `
        <g>
          <rect x="${x - 25}" y="${y - 25}" width="50" height="50" 
            fill="hsl(${hue},50%,60%)" rx="8" opacity="0.3">
          </rect>
          <line x1="${x - 40}" y1="${y + 40}" x2="${x + 40}" y2="${y - 40}" 
            stroke="hsl(${(hue + 180) % 360},60%,50%)" stroke-width="3" opacity="0.6"/>
          <circle cx="${x + 30}" cy="${y - 30}" r="6" 
            fill="hsl(${(hue + 60) % 360},70%,60%)" opacity="0.7">
          </circle>
        </g>`;
      break;
      
    case 6: // Simple document/page mockup
      content += `
        <g>
          <rect x="${x - 35}" y="${y - 30}" width="70" height="60" 
            fill="none" stroke="hsl(${hue},40%,50%)" stroke-width="2" rx="4" opacity="0.6">
          </rect>
          <rect x="${x - 25}" y="${y - 20}" width="50" height="3" 
            fill="hsl(${hue},50%,60%)" rx="1" opacity="0.5">
          </rect>
          <rect x="${x - 25}" y="${y - 12}" width="40" height="3" 
            fill="hsl(${hue},50%,60%)" rx="1" opacity="0.4">
          </rect>
          <rect x="${x - 25}" y="${y - 4}" width="35" height="3" 
            fill="hsl(${hue},50%,60%)" rx="1" opacity="0.4">
          </rect>
          <rect x="${x - 25}" y="${y + 8}" width="45" height="3" 
            fill="hsl(${hue},50%,60%)" rx="1" opacity="0.4">
          </rect>
        </g>`;
      break;
      
    case 7: // Simple arrow or pointer
      content += `
        <g>
          <circle cx="${x - 20}" cy="${y}" r="15" 
            fill="hsl(${hue},60%,60%)" opacity="0.4">
          </circle>
          <polygon points="${x + 10},${y - 15} ${x + 30},${y} ${x + 10},${y + 15}" 
            fill="hsl(${(hue + 120) % 360},60%,50%)" opacity="0.6">
          </polygon>
          <line x1="${x - 5}" y1="${y}" x2="${x + 15}" y2="${y}" 
            stroke="hsl(${hue},50%,50%)" stroke-width="3" opacity="0.5"/>
        </g>`;
      break;
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