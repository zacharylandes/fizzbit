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
          <circle cx="${x - 20}" cy="${y - 40}" r="8" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <!-- Smiling face -->
          <circle cx="${x - 22}" cy="${y - 43}" r="1" fill="${strokeColor}"/>
          <circle cx="${x - 18}" cy="${y - 43}" r="1" fill="${strokeColor}"/>
          <path d="M ${x - 23} ${y - 38} Q ${x - 20} ${y - 35} ${x - 17} ${y - 38}" fill="none" stroke="${strokeColor}" stroke-width="1"/>
          <!-- Body -->
          <rect x="${x - 25}" y="${y - 32}" width="10" height="20" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" rx="2"/>
          <!-- Arms holding book -->
          <line x1="${x - 25}" y1="${y - 25}" x2="${x - 35}" y2="${y - 20}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <line x1="${x - 15}" y1="${y - 25}" x2="${x - 5}" y2="${y - 20}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <!-- Book -->
          <rect x="${x - 30}" y="${y - 25}" width="20" height="15" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" rx="2"/>
          <line x1="${x - 20}" y1="${y - 25}" x2="${x - 20}" y2="${y - 10}" stroke="${strokeColor}" stroke-width="1"/>
          <!-- Legs -->
          <line x1="${x - 22}" y1="${y - 12}" x2="${x - 22}" y2="${y + 5}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <line x1="${x - 18}" y1="${y - 12}" x2="${x - 18}" y2="${y + 5}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        </g>`;
      break;
      
    case 1: // Person with clock (time management)
      content += `
        <g>
          <!-- Large clock -->
          <circle cx="${x}" cy="${y - 5}" r="35" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <line x1="${x}" y1="${y - 35}" x2="${x}" y2="${y - 30}" stroke="${strokeColor}" stroke-width="2"/>
          <line x1="${x + 30}" y1="${y - 5}" x2="${x + 25}" y2="${y - 5}" stroke="${strokeColor}" stroke-width="2"/>
          <line x1="${x}" y1="${y + 25}" x2="${x}" y2="${y + 20}" stroke="${strokeColor}" stroke-width="2"/>
          <line x1="${x - 30}" y1="${y - 5}" x2="${x - 25}" y2="${y - 5}" stroke="${strokeColor}" stroke-width="2"/>
          <!-- Clock hands -->
          <line x1="${x}" y1="${y - 5}" x2="${x - 8}" y2="${y - 15}" stroke="${strokeColor}" stroke-width="2"/>
          <line x1="${x}" y1="${y - 5}" x2="${x + 12}" y2="${y - 5}" stroke="${strokeColor}" stroke-width="2"/>
          <!-- Person 1 (left) -->
          <circle cx="${x - 50}" cy="${y - 20}" r="6" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <circle cx="${x - 52}" cy="${y - 22}" r="0.8" fill="${strokeColor}"/>
          <circle cx="${x - 48}" cy="${y - 22}" r="0.8" fill="${strokeColor}"/>
          <path d="M ${x - 52} ${y - 18} Q ${x - 50} ${y - 16} ${x - 48} ${y - 18}" fill="none" stroke="${strokeColor}" stroke-width="1"/>
          <line x1="${x - 50}" y1="${y - 14}" x2="${x - 50}" y2="${y + 5}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <line x1="${x - 50}" y1="${y - 10}" x2="${x - 40}" y2="${y - 15}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <!-- Person 2 (right) -->
          <circle cx="${x + 50}" cy="${y - 20}" r="6" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <circle cx="${x + 48}" cy="${y - 22}" r="0.8" fill="${strokeColor}"/>
          <circle cx="${x + 52}" cy="${y - 22}" r="0.8" fill="${strokeColor}"/>
          <path d="M ${x + 48} ${y - 18} Q ${x + 50} ${y - 16} ${x + 52} ${y - 18}" fill="none" stroke="${strokeColor}" stroke-width="1"/>
          <line x1="${x + 50}" y1="${y - 14}" x2="${x + 50}" y2="${y + 5}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <line x1="${x + 50}" y1="${y - 10}" x2="${x + 40}" y2="${y - 15}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        </g>`;
      break;
      
    case 2: // Person with pencil (writing/creating)
      content += `
        <g>
          <!-- Large pencil -->
          <rect x="${x - 5}" y="${y - 45}" width="10" height="60" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" rx="2"/>
          <polygon points="${x - 5},${y + 15} ${x},${y + 25} ${x + 5},${y + 15}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <rect x="${x - 6}" y="${y - 50}" width="12" height="8" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <!-- Pencil details -->
          <line x1="${x - 5}" y1="${y - 30}" x2="${x + 5}" y2="${y - 30}" stroke="${strokeColor}" stroke-width="1"/>
          <line x1="${x - 5}" y1="${y - 20}" x2="${x + 5}" y2="${y - 20}" stroke="${strokeColor}" stroke-width="1"/>
          <!-- Person holding pencil -->
          <circle cx="${x - 25}" cy="${y - 15}" r="6" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <circle cx="${x - 27}" cy="${y - 17}" r="0.8" fill="${strokeColor}"/>
          <circle cx="${x - 23}" cy="${y - 17}" r="0.8" fill="${strokeColor}"/>
          <path d="M ${x - 27} ${y - 13} Q ${x - 25} ${y - 11} ${x - 23} ${y - 13}" fill="none" stroke="${strokeColor}" stroke-width="1"/>
          <line x1="${x - 25}" y1="${y - 9}" x2="${x - 25}" y2="${y + 8}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <line x1="${x - 25}" y1="${y - 5}" x2="${x - 15}" y2="${y - 10}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <!-- Paper with scribbles -->
          <rect x="${x + 15}" y="${y - 10}" width="25" height="20" fill="none" stroke="${strokeColor}" stroke-width="1" rx="2"/>
          <line x1="${x + 18}" y1="${y - 6}" x2="${x + 35}" y2="${y - 6}" stroke="${strokeColor}" stroke-width="0.8"/>
          <line x1="${x + 18}" y1="${y - 2}" x2="${x + 32}" y2="${y - 2}" stroke="${strokeColor}" stroke-width="0.8"/>
          <line x1="${x + 18}" y1="${y + 2}" x2="${x + 38}" y2="${y + 2}" stroke="${strokeColor}" stroke-width="0.8"/>
        </g>`;
      break;
      
    case 3: // Person speaking/presenting 
      content += `
        <g>
          <!-- Person -->
          <circle cx="${x - 30}" cy="${y - 25}" r="8" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <circle cx="${x - 32}" cy="${y - 27}" r="1" fill="${strokeColor}"/>
          <circle cx="${x - 28}" cy="${y - 27}" r="1" fill="${strokeColor}"/>
          <path d="M ${x - 33} ${y - 23} Q ${x - 30} ${y - 20} ${x - 27} ${y - 23}" fill="none" stroke="${strokeColor}" stroke-width="1"/>
          <line x1="${x - 30}" y1="${y - 17}" x2="${x - 30}" y2="${y + 5}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <!-- Arm pointing -->
          <line x1="${x - 30}" y1="${y - 10}" x2="${x - 10}" y2="${y - 20}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <!-- Speech bubble -->
          <ellipse cx="${x + 10}" cy="${y - 30}" rx="20" ry="12" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <polygon points="${x - 8},${y - 25} ${x - 5},${y - 20} ${x - 12},${y - 22}" fill="none" stroke="${strokeColor}" stroke-width="1"/>
          <!-- Text lines in bubble -->
          <line x1="${x - 5}" y1="${y - 33}" x2="${x + 15}" y2="${y - 33}" stroke="${strokeColor}" stroke-width="1"/>
          <line x1="${x + 5}" y1="${y - 30}" x2="${x + 25}" y2="${y - 30}" stroke="${strokeColor}" stroke-width="1"/>
          <line x1="${x - 2}" y1="${y - 27}" x2="${x + 18}" y2="${y - 27}" stroke="${strokeColor}" stroke-width="1"/>
        </g>`;
      break;
      
    case 4: // Person hiking/walking 
      content += `
        <g>
          <!-- Person walking -->
          <circle cx="${x - 10}" cy="${y - 35}" r="6" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <circle cx="${x - 12}" cy="${y - 37}" r="0.8" fill="${strokeColor}"/>
          <circle cx="${x - 8}" cy="${y - 37}" r="0.8" fill="${strokeColor}"/>
          <path d="M ${x - 12} ${y - 33} Q ${x - 10} ${y - 31} ${x - 8} ${y - 33}" fill="none" stroke="${strokeColor}" stroke-width="1"/>
          <line x1="${x - 10}" y1="${y - 29}" x2="${x - 10}" y2="${y - 10}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <!-- Walking stick -->
          <line x1="${x - 10}" y1="${y - 20}" x2="${x - 25}" y2="${y + 5}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <!-- Backpack -->
          <rect x="${x - 7}" y="${y - 25}" width="6" height="8" fill="none" stroke="${strokeColor}" stroke-width="1" rx="1"/>
          <!-- Legs in walking position -->
          <line x1="${x - 12}" y1="${y - 10}" x2="${x - 12}" y2="${y + 5}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <line x1="${x - 8}" y1="${y - 10}" x2="${x - 5}" y2="${y + 5}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <!-- Simple mountain/hills in background -->
          <polygon points="${x + 10},${y + 10} ${x + 25},${y - 15} ${x + 40},${y + 10}" fill="none" stroke="${strokeColor}" stroke-width="1"/>
          <polygon points="${x + 20},${y + 10} ${x + 35},${y - 25} ${x + 50},${y + 10}" fill="none" stroke="${strokeColor}" stroke-width="1"/>
        </g>`;
      break;
      
    case 5: // Person celebrating/happy 
      content += `
        <g>
          <!-- Person with raised arms -->
          <circle cx="${x}" cy="${y - 30}" r="8" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <circle cx="${x - 2}" cy="${y - 32}" r="1" fill="${strokeColor}"/>
          <circle cx="${x + 2}" cy="${y - 32}" r="1" fill="${strokeColor}"/>
          <path d="M ${x - 3} ${y - 28} Q ${x} ${y - 25} ${x + 3} ${y - 28}" fill="none" stroke="${strokeColor}" stroke-width="1"/>
          <line x1="${x}" y1="${y - 22}" x2="${x}" y2="${y + 5}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <!-- Arms raised in celebration -->
          <line x1="${x}" y1="${y - 15}" x2="${x - 20}" y2="${y - 35}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <line x1="${x}" y1="${y - 15}" x2="${x + 20}" y2="${y - 35}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <!-- Legs -->
          <line x1="${x - 3}" y1="${y + 5}" x2="${x - 8}" y2="${y + 20}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <line x1="${x + 3}" y1="${y + 5}" x2="${x + 8}" y2="${y + 20}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <!-- Celebration elements -->
          <circle cx="${x - 25}" cy="${y - 40}" r="2" fill="none" stroke="${strokeColor}" stroke-width="1"/>
          <circle cx="${x + 25}" cy="${y - 40}" r="2" fill="none" stroke="${strokeColor}" stroke-width="1"/>
          <line x1="${x - 15}" y1="${y - 45}" x2="${x - 18}" y2="${y - 40}" stroke="${strokeColor}" stroke-width="1"/>
          <line x1="${x + 15}" y1="${y - 45}" x2="${x + 18}" y2="${y - 40}" stroke="${strokeColor}" stroke-width="1"/>
        </g>`;
      break;
  }
  
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
    ${content}
  </svg>`;
}