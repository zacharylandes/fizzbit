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
    switch(style % 20) {
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
        
      case 10: // Concentric waves
        const waveRadius = size * 0.3;
        for (let j = 0; j < 4; j++) {
          const currentRadius = waveRadius + (j * 15);
          content += `
            <circle cx="${x}" cy="${y}" r="${currentRadius}" 
              fill="none" stroke="hsl(${hue},70%,50%)" stroke-width="${strokeWidth}" opacity="${0.8 - j * 0.15}">
              <animate attributeName="r" from="${currentRadius - 5}" to="${currentRadius + 8}" dur="${2.5 + j * 0.5}s" 
                repeatCount="indefinite" direction="alternate"/>
            </circle>`;
        }
        break;
        
      case 11: // Lightning zigzags
        const zigzagPoints = [];
        const segments = (elementSeed % 6) + 4;
        let zigX = x - size/2;
        let zigY = y;
        for (let j = 0; j < segments; j++) {
          zigX += size / segments;
          zigY = y + (j % 2 === 0 ? -size/3 : size/3) + ((elementSeed >> (j*3)) % 20) - 10;
          zigzagPoints.push(`${zigX},${zigY}`);
        }
        content += `
          <polyline points="${zigzagPoints.join(' ')}" 
            fill="none" stroke="hsl(${hue},70%,50%)" stroke-width="${strokeWidth + 1}">
            <animate attributeName="stroke-width" from="${strokeWidth}" to="${strokeWidth + 3}" dur="${3 + i}s" 
              repeatCount="indefinite" direction="alternate"/>
          </polyline>`;
        break;
        
      case 12: // Morphing blobs
        const blobRadius = size * 0.4;
        content += `
          <ellipse cx="${x}" cy="${y}" rx="${blobRadius}" ry="${blobRadius * 0.7}" 
            fill="hsla(${hue},70%,50%,0.4)" stroke="hsl(${hue},70%,50%)" stroke-width="${strokeWidth}">
            <animate attributeName="rx" from="${blobRadius * 0.8}" to="${blobRadius * 1.3}" dur="${4 + i}s" 
              repeatCount="indefinite" direction="alternate"/>
            <animate attributeName="ry" from="${blobRadius * 1.2}" to="${blobRadius * 0.5}" dur="${3.5 + i}s" 
              repeatCount="indefinite" direction="alternate"/>
          </ellipse>`;
        break;
        
      case 13: // Orbital paths
        const orbitRadius = size * 0.6;
        const numOrbits = (elementSeed % 3) + 2;
        for (let j = 0; j < numOrbits; j++) {
          const currentOrbitRadius = orbitRadius - (j * 15);
          const orbitSpeed = 3 + (j * 2);
          content += `
            <circle cx="${x}" cy="${y}" r="${currentOrbitRadius}" 
              fill="none" stroke="hsl(${(hue + j * 60) % 360},70%,50%)" stroke-width="${strokeWidth}" 
              stroke-dasharray="10,5" opacity="0.7">
              <animateTransform attributeName="transform" type="rotate"
                from="0 ${x} ${y}" to="360 ${x} ${y}" dur="${orbitSpeed}s" repeatCount="indefinite"/>
            </circle>`;
        }
        break;
        
      case 14: // Crystal formations
        const crystalSize = size * 0.8;
        const crystalSides = (elementSeed % 4) + 5;
        for (let j = 0; j < 3; j++) {
          const crystalX = x + ((elementSeed >> (j*4)) % 30) - 15;
          const crystalY = y + ((elementSeed >> (j*4 + 2)) % 30) - 15;
          const currentSize = crystalSize - (j * 10);
          content += `
            <polygon points="${generatePolygonPoints(crystalX, crystalY, currentSize/2, crystalSides)}" 
              fill="hsla(${(hue + j * 30) % 360},70%,50%,0.2)" stroke="hsl(${(hue + j * 30) % 360},70%,50%)" stroke-width="${strokeWidth}">
              <animate attributeName="opacity" from="0.2" to="0.8" dur="${4 + j}s" 
                repeatCount="indefinite" direction="alternate"/>
            </polygon>`;
        }
        break;
        
      case 15: // Flowing streams
        const streamPath = `M${x - size/2} ${y} Q${x} ${y - size/2} ${x + size/2} ${y} Q${x} ${y + size/2} ${x - size/2} ${y}`;
        content += `
          <path d="${streamPath}" fill="none" stroke="hsl(${hue},70%,50%)" stroke-width="${strokeWidth + 1}" opacity="0.6">
            <animate attributeName="stroke-dasharray" from="0,100" to="50,50" dur="${5 + i}s" 
              repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.3" to="0.9" dur="${3 + i}s" 
              repeatCount="indefinite" direction="alternate"/>
          </path>`;
        break;
        
      case 16: // Pulsing diamonds
        const diamondSize = size * 0.6;
        const diamondPoints = `${x},${y - diamondSize/2} ${x + diamondSize/2},${y} ${x},${y + diamondSize/2} ${x - diamondSize/2},${y}`;
        content += `
          <polygon points="${diamondPoints}" 
            fill="hsla(${hue},70%,50%,0.3)" stroke="hsl(${hue},70%,50%)" stroke-width="${strokeWidth}">
            <animateTransform attributeName="transform" type="scale"
              from="0.8" to="1.4" dur="${3.5 + i}s" repeatCount="indefinite" direction="alternate"/>
            <animate attributeName="fill-opacity" from="0.1" to="0.5" dur="${4 + i}s" 
              repeatCount="indefinite" direction="alternate"/>
          </polygon>`;
        break;
        
      case 17: // Swirling vortex
        const vortexRadius = size * 0.5;
        const spiralTurns = (elementSeed % 3) + 2;
        let spiralPath = `M${x} ${y}`;
        for (let j = 0; j < spiralTurns * 10; j++) {
          const spiralAngle = (j / 10) * 2 * Math.PI;
          const currentRadius = (vortexRadius * j) / (spiralTurns * 10);
          const spiralX = x + currentRadius * Math.cos(spiralAngle);
          const spiralY = y + currentRadius * Math.sin(spiralAngle);
          spiralPath += ` L${spiralX} ${spiralY}`;
        }
        content += `
          <path d="${spiralPath}" fill="none" stroke="hsl(${hue},70%,50%)" stroke-width="${strokeWidth}">
            <animate attributeName="stroke-dasharray" from="5,5" to="15,3" dur="${4 + i}s" 
              repeatCount="indefinite" direction="alternate"/>
          </path>`;
        break;
        
      case 18: // Fractal branches
        const branchDepth = 3;
        const drawBranch = (startX: number, startY: number, endX: number, endY: number, depth: number): string => {
          if (depth <= 0) return '';
          const midX = (startX + endX) / 2 + ((elementSeed >> depth) % 20) - 10;
          const midY = (startY + endY) / 2 + ((elementSeed >> (depth + 2)) % 20) - 10;
          const leftEndX = midX + ((elementSeed >> (depth + 4)) % 30) - 15;
          const leftEndY = midY + ((elementSeed >> (depth + 6)) % 30) - 15;
          const rightEndX = midX + ((elementSeed >> (depth + 8)) % 30) - 15;
          const rightEndY = midY + ((elementSeed >> (depth + 10)) % 30) - 15;
          
          return `
            <line x1="${startX}" y1="${startY}" x2="${midX}" y2="${midY}" 
              stroke="hsl(${hue},70%,50%)" stroke-width="${strokeWidth}" opacity="${0.8 - (3-depth) * 0.2}">
              <animate attributeName="opacity" from="0.3" to="0.9" dur="${2 + depth}s" 
                repeatCount="indefinite" direction="alternate"/>
            </line>` +
            drawBranch(midX, midY, leftEndX, leftEndY, depth - 1) +
            drawBranch(midX, midY, rightEndX, rightEndY, depth - 1);
        };
        content += drawBranch(x, y + size/2, x, y - size/2, branchDepth);
        break;
        
      case 19: // Particle clusters
        const numParticles = (elementSeed % 8) + 6;
        const clusterRadius = size * 0.4;
        for (let j = 0; j < numParticles; j++) {
          const particleAngle = (j * 360 / numParticles) + (elementSeed % 360);
          const particleDistance = (elementSeed >> (j*2)) % clusterRadius;
          const particleX = x + particleDistance * Math.cos(particleAngle * Math.PI / 180);
          const particleY = y + particleDistance * Math.sin(particleAngle * Math.PI / 180);
          const particleSize = ((elementSeed >> (j*3)) % 4) + 2;
          content += `
            <circle cx="${particleX}" cy="${particleY}" r="${particleSize}" 
              fill="hsl(${(hue + j * 20) % 360},70%,50%)" opacity="0.7">
              <animate attributeName="r" from="${particleSize}" to="${particleSize + 2}" dur="${2 + j * 0.3}s" 
                repeatCount="indefinite" direction="alternate"/>
              <animate attributeName="opacity" from="0.4" to="1" dur="${3 + j * 0.2}s" 
                repeatCount="indefinite" direction="alternate"/>
            </circle>`;
        }
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