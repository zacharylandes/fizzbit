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
  const strokeWidth = ((seed >> 3) % 3) + 1;
  
  // Generate multiple varied parameters from the seed
  const numElements = (seed % 8) + 3; // 3-10 elements
  const style = seed % 20; // 20 different style variations
  const animationType = (seed >> 5) % 4; // 4 animation types
  const layoutType = (seed >> 7) % 3; // 3 layout types
  
  let content = "";
  
  // Generate varied elements based on style
  for (let i = 0; i < numElements; i++) {
    const elementSeed = seed + (i * 347); // Prime number for better distribution
    const x = (elementSeed % width);
    const y = ((elementSeed >> 4) % height);
    const size = ((elementSeed >> 8) % 50) + 10;
    const angle = (elementSeed >> 12) % 360;
    
    // Create different element types based on style variation
    switch(style % 10) {
      case 0: // Flowing curves
        const cx1 = x + ((elementSeed >> 16) % 60) - 30;
        const cy1 = y + ((elementSeed >> 20) % 60) - 30;
        const cx2 = x + ((elementSeed >> 24) % 80) - 40;
        const cy2 = y + ((elementSeed >> 28) % 80) - 40;
        content += `
          <path d="M${x} ${y} C${cx1} ${cy1} ${cx2} ${cy2} ${x + size} ${y + size/2}" 
            fill="none" stroke="hsl(${hue},70%,50%)" stroke-width="${strokeWidth}" opacity="0.7">
            <animateTransform attributeName="transform" type="rotate"
              from="0 ${x} ${y}" to="${angle}" dur="${3 + i}s" repeatCount="indefinite"/>
          </path>`;
        break;
        
      case 1: // Organic blobs
        const r1 = size * 0.6;
        const r2 = size * 0.8;
        content += `
          <ellipse cx="${x}" cy="${y}" rx="${r1}" ry="${r2}" 
            fill="hsla(${hue},70%,50%,0.3)" stroke="hsl(${hue},70%,50%)" stroke-width="${strokeWidth}">
            <animateTransform attributeName="transform" type="rotate"
              from="0 ${x} ${y}" to="360 ${x} ${y}" dur="${4 + (i % 3)}s" repeatCount="indefinite"/>
          </ellipse>`;
        break;
        
      case 2: // Jagged lines
        const points = [];
        const numPoints = (elementSeed % 6) + 3;
        for (let j = 0; j < numPoints; j++) {
          const px = x + ((elementSeed >> (j*4)) % size) - size/2;
          const py = y + ((elementSeed >> (j*4 + 2)) % size) - size/2;
          points.push(`${px},${py}`);
        }
        content += `
          <polyline points="${points.join(' ')}" 
            fill="none" stroke="hsl(${hue},70%,50%)" stroke-width="${strokeWidth}">
            <animate attributeName="opacity" from="0.4" to="1" dur="${2 + i}s" 
              repeatCount="indefinite" direction="alternate"/>
          </polyline>`;
        break;
        
      case 3: // Spiraling dots
        const numDots = (elementSeed % 5) + 2;
        for (let j = 0; j < numDots; j++) {
          const spiralRadius = j * 8 + 5;
          const spiralAngle = j * 45 + (elementSeed % 360);
          const dotX = x + spiralRadius * Math.cos(spiralAngle * Math.PI / 180);
          const dotY = y + spiralRadius * Math.sin(spiralAngle * Math.PI / 180);
          content += `
            <circle cx="${dotX}" cy="${dotY}" r="${2 + j}" 
              fill="hsl(${hue},70%,50%)" opacity="0.6">
              <animate attributeName="r" from="${2 + j}" to="${4 + j}" dur="${3 + j}s" 
                repeatCount="indefinite" direction="alternate"/>
            </circle>`;
        }
        break;
        
      case 4: // Intersecting arcs
        const arcRadius = size * 0.7;
        content += `
          <path d="M${x - arcRadius} ${y} A${arcRadius} ${arcRadius} 0 0 1 ${x + arcRadius} ${y}" 
            fill="none" stroke="hsl(${hue},70%,50%)" stroke-width="${strokeWidth}">
            <animateTransform attributeName="transform" type="scale"
              from="1" to="1.3" dur="${3 + i}s" repeatCount="indefinite" direction="alternate"/>
          </path>
          <path d="M${x} ${y - arcRadius} A${arcRadius} ${arcRadius} 0 0 1 ${x} ${y + arcRadius}" 
            fill="none" stroke="hsl(${(hue + 30) % 360},70%,50%)" stroke-width="${strokeWidth}">
            <animateTransform attributeName="transform" type="scale"
              from="1.2" to="0.8" dur="${4 + i}s" repeatCount="indefinite" direction="alternate"/>
          </path>`;
        break;
        
      case 5: // Branching paths
        const branchLength = size * 0.8;
        const numBranches = (elementSeed % 4) + 2;
        for (let j = 0; j < numBranches; j++) {
          const branchAngle = (j * 360 / numBranches) + (elementSeed % 60);
          const endX = x + branchLength * Math.cos(branchAngle * Math.PI / 180);
          const endY = y + branchLength * Math.sin(branchAngle * Math.PI / 180);
          content += `
            <path d="M${x} ${y} L${endX} ${endY}" 
              stroke="hsl(${hue},70%,50%)" stroke-width="${strokeWidth}" opacity="0.8">
              <animate attributeName="stroke-dasharray" from="0,100" to="100,0" dur="${2 + j}s" 
                repeatCount="indefinite" direction="alternate"/>
            </path>`;
        }
        break;
        
      case 6: // Wobbly rectangles
        const rectWidth = size * 0.6;
        const rectHeight = size * 0.4;
        content += `
          <rect x="${x - rectWidth/2}" y="${y - rectHeight/2}" width="${rectWidth}" height="${rectHeight}" 
            fill="hsla(${hue},70%,50%,0.2)" stroke="hsl(${hue},70%,50%)" stroke-width="${strokeWidth}" 
            rx="${(elementSeed % 10) + 5}">
            <animateTransform attributeName="transform" type="skewX"
              from="-5" to="5" dur="${3 + i}s" repeatCount="indefinite" direction="alternate"/>
          </rect>`;
        break;
        
      case 7: // Flowing ribbons
        const ribbonPoints = [];
        for (let j = 0; j < 8; j++) {
          const ribbonX = x + (j * size / 8) + ((elementSeed >> (j*2)) % 20) - 10;
          const ribbonY = y + Math.sin(j * 0.5) * (size/4) + ((elementSeed >> (j*2 + 1)) % 15) - 7;
          ribbonPoints.push(`${ribbonX},${ribbonY}`);
        }
        content += `
          <polyline points="${ribbonPoints.join(' ')}" 
            fill="none" stroke="hsl(${hue},70%,50%)" stroke-width="${strokeWidth + 1}">
            <animate attributeName="stroke-dasharray" from="5,5" to="10,2" dur="${4 + i}s" 
              repeatCount="indefinite" direction="alternate"/>
          </polyline>`;
        break;
        
      case 8: // Radiating spokes
        const spokeLength = size * 0.9;
        const numSpokes = (elementSeed % 6) + 4;
        for (let j = 0; j < numSpokes; j++) {
          const spokeAngle = (j * 360 / numSpokes) + (elementSeed % 45);
          const spokeEndX = x + spokeLength * Math.cos(spokeAngle * Math.PI / 180);
          const spokeEndY = y + spokeLength * Math.sin(spokeAngle * Math.PI / 180);
          content += `
            <line x1="${x}" y1="${y}" x2="${spokeEndX}" y2="${spokeEndY}" 
              stroke="hsl(${hue},70%,50%)" stroke-width="${strokeWidth}" opacity="0.6">
              <animate attributeName="opacity" from="0.2" to="0.9" dur="${2 + j * 0.3}s" 
                repeatCount="indefinite" direction="alternate"/>
            </line>`;
        }
        break;
        
      case 9: // Nested shapes
        const outerSize = size;
        const innerSize = size * 0.6;
        content += `
          <circle cx="${x}" cy="${y}" r="${outerSize/2}" 
            fill="none" stroke="hsl(${hue},70%,50%)" stroke-width="${strokeWidth}" opacity="0.5">
            <animate attributeName="r" from="${outerSize/2}" to="${outerSize/2 + 10}" dur="${4 + i}s" 
              repeatCount="indefinite" direction="alternate"/>
          </circle>
          <polygon points="${generatePolygonPoints(x, y, innerSize/2, (elementSeed % 5) + 3)}" 
            fill="hsla(${(hue + 120) % 360},70%,50%,0.3)" stroke="hsl(${(hue + 120) % 360},70%,50%)" stroke-width="${strokeWidth}">
            <animateTransform attributeName="transform" type="rotate"
              from="0 ${x} ${y}" to="360 ${x} ${y}" dur="${5 + i}s" repeatCount="indefinite"/>
          </polygon>`;
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