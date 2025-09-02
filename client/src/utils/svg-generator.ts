function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Generate random offset for sketchy hand-drawn effect
function sketchyOffset(seed: number, index: number, range: number = 2): number {
  const pseudoRandom = Math.sin(seed * 9.549 + index * 7.317) * 10000;
  return (pseudoRandom - Math.floor(pseudoRandom)) * range - range/2;
}

// Create slightly wavy line for hand-drawn effect
function sketchyLine(x1: number, y1: number, x2: number, y2: number, seed: number, strokeColor: string, strokeWidth: string = "2"): string {
  const midX = (x1 + x2) / 2 + sketchyOffset(seed, 1, 3);
  const midY = (y1 + y2) / 2 + sketchyOffset(seed, 2, 3);
  return `<path d="M ${x1 + sketchyOffset(seed, 3, 1)} ${y1 + sketchyOffset(seed, 4, 1)} Q ${midX} ${midY} ${x2 + sketchyOffset(seed, 5, 1)} ${y2 + sketchyOffset(seed, 6, 1)}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`;
}

// Create sketchy circle with slight imperfections
function sketchyCircle(cx: number, cy: number, r: number, seed: number, strokeColor: string, strokeWidth: string = "2", fill: string = "none"): string {
  const points = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * 2 * Math.PI;
    const radius = r + sketchyOffset(seed, i, r * 0.1);
    const x = cx + Math.cos(angle) * radius + sketchyOffset(seed, i + 10, 1);
    const y = cy + Math.sin(angle) * radius + sketchyOffset(seed, i + 20, 1);
    points.push(`${x},${y}`);
  }
  return `<polygon points="${points.join(' ')}" fill="${fill}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

export function generateAbstractSVG(prompt: string, width: number = 300, height: number = 150, color: number | null = null): string {
  // Use only the prompt for deterministic generation (no timestamp/random for stability)
  const seed = hashString(prompt);
  
  // Use provided color or generate a muted hue
  const hue = color !== null ? color : (seed % 360);
  
  // Generate parameters for people illustrations
  const style = seed % 6; // 6 different people activity styles
  
  let content = "";
  
  // Create people illustrations like the reference examples
  const x = width / 2;
  const y = height / 2;
  const strokeColor = "#333";
  const strokeWidth = "2";
  
  switch(style % 6) {
    case 0: // Person reading/studying 
      content += `
        <g>
          <!-- Person sitting with book -->
          ${sketchyCircle(x - 20, y - 40, 8, seed + 100, strokeColor, "2.5")}
          <!-- Smiling face -->
          <circle cx="${x - 22 + sketchyOffset(seed, 10, 0.5)}" cy="${y - 43 + sketchyOffset(seed, 11, 0.5)}" r="1.2" fill="${strokeColor}"/>
          <circle cx="${x - 18 + sketchyOffset(seed, 12, 0.5)}" cy="${y - 43 + sketchyOffset(seed, 13, 0.5)}" r="1.2" fill="${strokeColor}"/>
          <path d="M ${x - 23 + sketchyOffset(seed, 14, 1)} ${y - 38 + sketchyOffset(seed, 15, 1)} Q ${x - 20} ${y - 35} ${x - 17 + sketchyOffset(seed, 16, 1)} ${y - 38 + sketchyOffset(seed, 17, 1)}" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round"/>
          <!-- Body with sketchy edges -->
          ${sketchyLine(x - 25, y - 32, x - 25, y - 12, seed + 200, strokeColor, "2.5")}
          ${sketchyLine(x - 25, y - 12, x - 15, y - 12, seed + 201, strokeColor, "2.5")}
          ${sketchyLine(x - 15, y - 12, x - 15, y - 32, seed + 202, strokeColor, "2.5")}
          ${sketchyLine(x - 15, y - 32, x - 25, y - 32, seed + 203, strokeColor, "2.5")}
          <!-- Arms holding book -->
          ${sketchyLine(x - 25, y - 25, x - 35, y - 20, seed + 300, strokeColor, "2")}
          ${sketchyLine(x - 15, y - 25, x - 5, y - 20, seed + 301, strokeColor, "2")}
          <!-- Book with sketchy details -->
          ${sketchyLine(x - 30, y - 25, x - 30, y - 10, seed + 400, strokeColor, "2")}
          ${sketchyLine(x - 30, y - 10, x - 10, y - 10, seed + 401, strokeColor, "2")}
          ${sketchyLine(x - 10, y - 10, x - 10, y - 25, seed + 402, strokeColor, "2")}
          ${sketchyLine(x - 10, y - 25, x - 30, y - 25, seed + 403, strokeColor, "2")}
          ${sketchyLine(x - 20, y - 25, x - 20, y - 10, seed + 404, strokeColor, "1")}
          <!-- Legs -->
          ${sketchyLine(x - 22, y - 12, x - 22, y + 5, seed + 500, strokeColor, "2.5")}
          ${sketchyLine(x - 18, y - 12, x - 18, y + 5, seed + 501, strokeColor, "2.5")}
          <!-- Artistic shading dots -->
          <circle cx="${x - 30 + sketchyOffset(seed, 30, 2)}" cy="${y - 15 + sketchyOffset(seed, 31, 2)}" r="0.8" fill="${strokeColor}" opacity="0.3"/>
          <circle cx="${x - 12 + sketchyOffset(seed, 32, 2)}" cy="${y - 8 + sketchyOffset(seed, 33, 2)}" r="0.6" fill="${strokeColor}" opacity="0.3"/>
        </g>`;
      break;
      
    case 1: // Person with clock (time management)
      content += `
        <g>
          <!-- Large sketchy clock -->
          ${sketchyCircle(x, y - 5, 35, seed + 1000, strokeColor, "2.5")}
          <!-- Clock marks with artistic variation -->
          ${sketchyLine(x, y - 35, x, y - 30, seed + 1100, strokeColor, "2")}
          ${sketchyLine(x + 30, y - 5, x + 25, y - 5, seed + 1101, strokeColor, "2")}
          ${sketchyLine(x, y + 25, x, y + 20, seed + 1102, strokeColor, "2")}
          ${sketchyLine(x - 30, y - 5, x - 25, y - 5, seed + 1103, strokeColor, "2")}
          <!-- Expressive clock hands -->
          ${sketchyLine(x, y - 5, x - 8, y - 15, seed + 1200, strokeColor, "3")}
          ${sketchyLine(x, y - 5, x + 12, y - 5, seed + 1201, strokeColor, "3")}
          <!-- Person 1 (left) with character -->
          ${sketchyCircle(x - 50, y - 20, 6, seed + 1300, strokeColor, "2")}
          <circle cx="${x - 52 + sketchyOffset(seed, 40, 0.8)}" cy="${y - 22 + sketchyOffset(seed, 41, 0.8)}" r="1" fill="${strokeColor}"/>
          <circle cx="${x - 48 + sketchyOffset(seed, 42, 0.8)}" cy="${y - 22 + sketchyOffset(seed, 43, 0.8)}" r="1" fill="${strokeColor}"/>
          <path d="M ${x - 52 + sketchyOffset(seed, 44, 1)} ${y - 18 + sketchyOffset(seed, 45, 1)} Q ${x - 50} ${y - 16} ${x - 48 + sketchyOffset(seed, 46, 1)} ${y - 18 + sketchyOffset(seed, 47, 1)}" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round"/>
          ${sketchyLine(x - 50, y - 14, x - 50, y + 5, seed + 1400, strokeColor, "2")}
          ${sketchyLine(x - 50, y - 10, x - 40, y - 15, seed + 1401, strokeColor, "2")}
          <!-- Person 2 (right) with character -->
          ${sketchyCircle(x + 50, y - 20, 6, seed + 1500, strokeColor, "2")}
          <circle cx="${x + 48 + sketchyOffset(seed, 50, 0.8)}" cy="${y - 22 + sketchyOffset(seed, 51, 0.8)}" r="1" fill="${strokeColor}"/>
          <circle cx="${x + 52 + sketchyOffset(seed, 52, 0.8)}" cy="${y - 22 + sketchyOffset(seed, 53, 0.8)}" r="1" fill="${strokeColor}"/>
          <path d="M ${x + 48 + sketchyOffset(seed, 54, 1)} ${y - 18 + sketchyOffset(seed, 55, 1)} Q ${x + 50} ${y - 16} ${x + 52 + sketchyOffset(seed, 56, 1)} ${y - 18 + sketchyOffset(seed, 57, 1)}" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round"/>
          ${sketchyLine(x + 50, y - 14, x + 50, y + 5, seed + 1600, strokeColor, "2")}
          ${sketchyLine(x + 50, y - 10, x + 40, y - 15, seed + 1601, strokeColor, "2")}
          <!-- Artistic detail lines around clock -->
          <circle cx="${x - 15 + sketchyOffset(seed, 60, 3)}" cy="${y - 35 + sketchyOffset(seed, 61, 3)}" r="1" fill="${strokeColor}" opacity="0.4"/>
          <circle cx="${x + 20 + sketchyOffset(seed, 62, 3)}" cy="${y + 15 + sketchyOffset(seed, 63, 3)}" r="0.8" fill="${strokeColor}" opacity="0.4"/>
        </g>`;
      break;
      
    case 2: // Person with pencil (writing/creating)
      content += `
        <g>
          <!-- Large artistic pencil -->
          ${sketchyLine(x - 5, y - 45, x - 5, y + 15, seed + 2000, strokeColor, "2.5")}
          ${sketchyLine(x + 5, y - 45, x + 5, y + 15, seed + 2001, strokeColor, "2.5")}
          ${sketchyLine(x - 5, y - 45, x + 5, y - 45, seed + 2002, strokeColor, "2.5")}
          ${sketchyLine(x - 5, y + 15, x, y + 25, seed + 2003, strokeColor, "2.5")}
          ${sketchyLine(x, y + 25, x + 5, y + 15, seed + 2004, strokeColor, "2.5")}
          <!-- Pencil eraser -->
          ${sketchyLine(x - 6, y - 50, x - 6, y - 42, seed + 2100, strokeColor, "2")}
          ${sketchyLine(x - 6, y - 42, x + 6, y - 42, seed + 2101, strokeColor, "2")}
          ${sketchyLine(x + 6, y - 42, x + 6, y - 50, seed + 2102, strokeColor, "2")}
          ${sketchyLine(x + 6, y - 50, x - 6, y - 50, seed + 2103, strokeColor, "2")}
          <!-- Pencil details with character -->
          ${sketchyLine(x - 5, y - 30, x + 5, y - 30, seed + 2200, strokeColor, "1.5")}
          ${sketchyLine(x - 5, y - 20, x + 5, y - 20, seed + 2201, strokeColor, "1.5")}
          <!-- Expressive person -->
          ${sketchyCircle(x - 25, y - 15, 6, seed + 2300, strokeColor, "2")}
          <circle cx="${x - 27 + sketchyOffset(seed, 70, 0.5)}" cy="${y - 17 + sketchyOffset(seed, 71, 0.5)}" r="1" fill="${strokeColor}"/>
          <circle cx="${x - 23 + sketchyOffset(seed, 72, 0.5)}" cy="${y - 17 + sketchyOffset(seed, 73, 0.5)}" r="1" fill="${strokeColor}"/>
          <path d="M ${x - 27 + sketchyOffset(seed, 74, 1)} ${y - 13 + sketchyOffset(seed, 75, 1)} Q ${x - 25} ${y - 11} ${x - 23 + sketchyOffset(seed, 76, 1)} ${y - 13 + sketchyOffset(seed, 77, 1)}" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round"/>
          ${sketchyLine(x - 25, y - 9, x - 25, y + 8, seed + 2400, strokeColor, "2")}
          ${sketchyLine(x - 25, y - 5, x - 15, y - 10, seed + 2401, strokeColor, "2")}
          <!-- Artistic paper with creative scribbles -->
          ${sketchyLine(x + 15, y - 10, x + 15, y + 10, seed + 2500, strokeColor, "1.5")}
          ${sketchyLine(x + 15, y + 10, x + 40, y + 10, seed + 2501, strokeColor, "1.5")}
          ${sketchyLine(x + 40, y + 10, x + 40, y - 10, seed + 2502, strokeColor, "1.5")}
          ${sketchyLine(x + 40, y - 10, x + 15, y - 10, seed + 2503, strokeColor, "1.5")}
          <!-- Creative wavy text lines -->
          <path d="M ${x + 18} ${y - 6} Q ${x + 26} ${y - 5} ${x + 35} ${y - 6}" fill="none" stroke="${strokeColor}" stroke-width="1.2" stroke-linecap="round"/>
          <path d="M ${x + 18} ${y - 2} Q ${x + 24} ${y - 3} ${x + 32} ${y - 2}" fill="none" stroke="${strokeColor}" stroke-width="1.2" stroke-linecap="round"/>
          <path d="M ${x + 18} ${y + 2} Q ${x + 28} ${y + 1} ${x + 38} ${y + 2}" fill="none" stroke="${strokeColor}" stroke-width="1.2" stroke-linecap="round"/>
          <!-- Creative sparkles -->
          <circle cx="${x - 8 + sketchyOffset(seed, 80, 2)}" cy="${y - 35 + sketchyOffset(seed, 81, 2)}" r="0.8" fill="${strokeColor}" opacity="0.5"/>
          <circle cx="${x + 25 + sketchyOffset(seed, 82, 2)}" cy="${y - 20 + sketchyOffset(seed, 83, 2)}" r="0.6" fill="${strokeColor}" opacity="0.5"/>
        </g>`;
      break;
      
    case 3: // Person speaking/presenting 
      content += `
        <g>
          <!-- Expressive person -->
          ${sketchyCircle(x - 30, y - 25, 8, seed + 3000, strokeColor, "2")}
          <circle cx="${x - 32 + sketchyOffset(seed, 90, 0.5)}" cy="${y - 27 + sketchyOffset(seed, 91, 0.5)}" r="1" fill="${strokeColor}"/>
          <circle cx="${x - 28 + sketchyOffset(seed, 92, 0.5)}" cy="${y - 27 + sketchyOffset(seed, 93, 0.5)}" r="1" fill="${strokeColor}"/>
          <path d="M ${x - 33 + sketchyOffset(seed, 94, 1)} ${y - 23 + sketchyOffset(seed, 95, 1)} Q ${x - 30} ${y - 20} ${x - 27 + sketchyOffset(seed, 96, 1)} ${y - 23 + sketchyOffset(seed, 97, 1)}" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round"/>
          ${sketchyLine(x - 30, y - 17, x - 30, y + 5, seed + 3100, strokeColor, "2")}
          <!-- Dynamic pointing arm -->
          ${sketchyLine(x - 30, y - 10, x - 10, y - 20, seed + 3200, strokeColor, "2.5")}
          <!-- Artistic speech bubble -->
          ${sketchyCircle(x + 10, y - 30, 20, seed + 3300, strokeColor, "2")}
          ${sketchyLine(x - 8, y - 25, x - 5, y - 20, seed + 3400, strokeColor, "1.5")}
          ${sketchyLine(x - 5, y - 20, x - 12, y - 22, seed + 3401, strokeColor, "1.5")}
          ${sketchyLine(x - 12, y - 22, x - 8, y - 25, seed + 3402, strokeColor, "1.5")}
          <!-- Expressive text lines -->
          <path d="M ${x - 5} ${y - 33} Q ${x + 5} ${y - 32} ${x + 15} ${y - 33}" fill="none" stroke="${strokeColor}" stroke-width="1.2" stroke-linecap="round"/>
          <path d="M ${x + 5} ${y - 30} Q ${x + 15} ${y - 31} ${x + 25} ${y - 30}" fill="none" stroke="${strokeColor}" stroke-width="1.2" stroke-linecap="round"/>
          <path d="M ${x - 2} ${y - 27} Q ${x + 8} ${y - 26} ${x + 18} ${y - 27}" fill="none" stroke="${strokeColor}" stroke-width="1.2" stroke-linecap="round"/>
          <!-- Energy lines -->
          <circle cx="${x + 35 + sketchyOffset(seed, 100, 2)}" cy="${y - 35 + sketchyOffset(seed, 101, 2)}" r="0.8" fill="${strokeColor}" opacity="0.4"/>
          <circle cx="${x - 15 + sketchyOffset(seed, 102, 2)}" cy="${y - 40 + sketchyOffset(seed, 103, 2)}" r="0.6" fill="${strokeColor}" opacity="0.4"/>
        </g>`;
      break;
      
    case 4: // Person hiking/walking 
      content += `
        <g>
          <!-- Adventurous person -->
          ${sketchyCircle(x - 10, y - 35, 6, seed + 4000, strokeColor, "2")}
          <circle cx="${x - 12 + sketchyOffset(seed, 110, 0.5)}" cy="${y - 37 + sketchyOffset(seed, 111, 0.5)}" r="0.8" fill="${strokeColor}"/>
          <circle cx="${x - 8 + sketchyOffset(seed, 112, 0.5)}" cy="${y - 37 + sketchyOffset(seed, 113, 0.5)}" r="0.8" fill="${strokeColor}"/>
          <path d="M ${x - 12 + sketchyOffset(seed, 114, 1)} ${y - 33 + sketchyOffset(seed, 115, 1)} Q ${x - 10} ${y - 31} ${x - 8 + sketchyOffset(seed, 116, 1)} ${y - 33 + sketchyOffset(seed, 117, 1)}" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round"/>
          ${sketchyLine(x - 10, y - 29, x - 10, y - 10, seed + 4100, strokeColor, "2")}
          <!-- Dynamic walking stick -->
          ${sketchyLine(x - 10, y - 20, x - 25, y + 5, seed + 4200, strokeColor, "3")}
          <!-- Artistic backpack -->
          ${sketchyLine(x - 7, y - 25, x - 7, y - 17, seed + 4300, strokeColor, "1.5")}
          ${sketchyLine(x - 7, y - 17, x - 1, y - 17, seed + 4301, strokeColor, "1.5")}
          ${sketchyLine(x - 1, y - 17, x - 1, y - 25, seed + 4302, strokeColor, "1.5")}
          ${sketchyLine(x - 1, y - 25, x - 7, y - 25, seed + 4303, strokeColor, "1.5")}
          <!-- Dynamic walking legs -->
          ${sketchyLine(x - 12, y - 10, x - 12, y + 5, seed + 4400, strokeColor, "2")}
          ${sketchyLine(x - 8, y - 10, x - 5, y + 5, seed + 4401, strokeColor, "2")}
          <!-- Artistic mountains with character -->
          ${sketchyLine(x + 10, y + 10, x + 25, y - 15, seed + 4500, strokeColor, "1.5")}
          ${sketchyLine(x + 25, y - 15, x + 40, y + 10, seed + 4501, strokeColor, "1.5")}
          ${sketchyLine(x + 20, y + 10, x + 35, y - 25, seed + 4502, strokeColor, "1.5")}
          ${sketchyLine(x + 35, y - 25, x + 50, y + 10, seed + 4503, strokeColor, "1.5")}
          <!-- Nature details -->
          <circle cx="${x + 5 + sketchyOffset(seed, 120, 3)}" cy="${y - 5 + sketchyOffset(seed, 121, 3)}" r="0.8" fill="${strokeColor}" opacity="0.3"/>
          <circle cx="${x + 45 + sketchyOffset(seed, 122, 3)}" cy="${y - 10 + sketchyOffset(seed, 123, 3)}" r="0.6" fill="${strokeColor}" opacity="0.3"/>
        </g>`;
      break;
      
    case 5: // Person celebrating/happy 
      content += `
        <g>
          <!-- Joyful person -->
          ${sketchyCircle(x, y - 30, 8, seed + 5000, strokeColor, "2.5")}
          <circle cx="${x - 2 + sketchyOffset(seed, 130, 0.5)}" cy="${y - 32 + sketchyOffset(seed, 131, 0.5)}" r="1" fill="${strokeColor}"/>
          <circle cx="${x + 2 + sketchyOffset(seed, 132, 0.5)}" cy="${y - 32 + sketchyOffset(seed, 133, 0.5)}" r="1" fill="${strokeColor}"/>
          <path d="M ${x - 3 + sketchyOffset(seed, 134, 1)} ${y - 28 + sketchyOffset(seed, 135, 1)} Q ${x} ${y - 25} ${x + 3 + sketchyOffset(seed, 136, 1)} ${y - 28 + sketchyOffset(seed, 137, 1)}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round"/>
          ${sketchyLine(x, y - 22, x, y + 5, seed + 5100, strokeColor, "2.5")}
          <!-- Dynamic celebration arms -->
          ${sketchyLine(x, y - 15, x - 20, y - 35, seed + 5200, strokeColor, "3")}
          ${sketchyLine(x, y - 15, x + 20, y - 35, seed + 5201, strokeColor, "3")}
          <!-- Energetic legs -->
          ${sketchyLine(x - 3, y + 5, x - 8, y + 20, seed + 5300, strokeColor, "2.5")}
          ${sketchyLine(x + 3, y + 5, x + 8, y + 20, seed + 5301, strokeColor, "2.5")}
          <!-- Artistic celebration elements -->
          ${sketchyCircle(x - 25, y - 40, 2, seed + 5400, strokeColor, "1.5")}
          ${sketchyCircle(x + 25, y - 40, 2, seed + 5401, strokeColor, "1.5")}
          ${sketchyLine(x - 15, y - 45, x - 18, y - 40, seed + 5500, strokeColor, "1.5")}
          ${sketchyLine(x + 15, y - 45, x + 18, y - 40, seed + 5501, strokeColor, "1.5")}
          <!-- Joy sparkles -->
          <circle cx="${x - 30 + sketchyOffset(seed, 140, 3)}" cy="${y - 25 + sketchyOffset(seed, 141, 3)}" r="1" fill="${strokeColor}" opacity="0.6"/>
          <circle cx="${x + 32 + sketchyOffset(seed, 142, 3)}" cy="${y - 30 + sketchyOffset(seed, 143, 3)}" r="0.8" fill="${strokeColor}" opacity="0.6"/>
          <circle cx="${x - 10 + sketchyOffset(seed, 144, 2)}" cy="${y - 50 + sketchyOffset(seed, 145, 2)}" r="0.6" fill="${strokeColor}" opacity="0.6"/>
          <circle cx="${x + 15 + sketchyOffset(seed, 146, 2)}" cy="${y - 48 + sketchyOffset(seed, 147, 2)}" r="0.8" fill="${strokeColor}" opacity="0.6"/>
        </g>`;
      break;
  }
  
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
    ${content}
  </svg>`;
}