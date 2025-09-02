// Generate a seeded random number for consistent illustrations
function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed * 9.549 + index * 7.317) * 10000;
  return x - Math.floor(x);
}

// Add slight hand-drawn variation to coordinates
function handDrawnOffset(seed: number, index: number, range: number = 2): number {
  return (seededRandom(seed, index) - 0.5) * range;
}

// Create sketchy SVG line with Processing-style imperfections
function processingSvgLine(x1: number, y1: number, x2: number, y2: number, seed: number, offset: number = 0): string {
  const midX = (x1 + x2) / 2 + handDrawnOffset(seed, offset + 1, 3);
  const midY = (y1 + y2) / 2 + handDrawnOffset(seed, offset + 2, 3);
  
  return `<path d="M ${x1 + handDrawnOffset(seed, offset + 3, 1)} ${y1 + handDrawnOffset(seed, offset + 4, 1)} Q ${midX} ${midY} ${x2 + handDrawnOffset(seed, offset + 5, 1)} ${y2 + handDrawnOffset(seed, offset + 6, 1)}" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round"/>`;
}

// Create sketchy SVG circle with Processing-style imperfections
function processingSvgCircle(cx: number, cy: number, r: number, seed: number, offset: number = 0, fill: string = "none"): string {
  const points = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * 2 * Math.PI;
    const radius = r + handDrawnOffset(seed, offset + i, r * 0.08);
    const x = cx + Math.cos(angle) * radius + handDrawnOffset(seed, offset + i + 20, 1.5);
    const y = cy + Math.sin(angle) * radius + handDrawnOffset(seed, offset + i + 40, 1.5);
    points.push(`${x},${y}`);
  }
  return `<polygon points="${points.join(' ')}" fill="${fill}" stroke="#000" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`;
}

export function createPersonReadingSketch(seed: number): string {
  const centerX = 150;
  const centerY = 75;
  
  return `
    <svg width="300" height="150" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="150" fill="#f5f5f5"/>
      
      <!-- Person's head -->
      ${processingSvgCircle(centerX, centerY - 30, 18, seed, 0)}
      
      <!-- Big glasses frames -->
      ${processingSvgCircle(centerX - 15, centerY - 32, 10, seed, 100)}
      ${processingSvgCircle(centerX + 15, centerY - 32, 10, seed, 110)}
      <!-- Glasses bridge -->
      ${processingSvgLine(centerX - 5, centerY - 32, centerX + 5, centerY - 32, seed, 120)}
      
      <!-- Eyes behind glasses -->
      <circle cx="${centerX - 15 + handDrawnOffset(seed, 200, 1)}" cy="${centerY - 32 + handDrawnOffset(seed, 201, 1)}" r="2.5" fill="#000"/>
      <circle cx="${centerX + 15 + handDrawnOffset(seed, 202, 1)}" cy="${centerY - 32 + handDrawnOffset(seed, 203, 1)}" r="2.5" fill="#000"/>
      
      <!-- Content smile -->
      <path d="M ${centerX - 8 + handDrawnOffset(seed, 210, 1)} ${centerY - 24 + handDrawnOffset(seed, 211, 1)} Q ${centerX} ${centerY - 20} ${centerX + 8 + handDrawnOffset(seed, 212, 1)} ${centerY - 24 + handDrawnOffset(seed, 213, 1)}" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round"/>
      
      <!-- Body -->
      ${processingSvgLine(centerX, centerY - 12, centerX, centerY + 20, seed, 300)}
      ${processingSvgLine(centerX - 18, centerY - 5, centerX + 18, centerY - 5, seed, 310)}
      ${processingSvgLine(centerX - 18, centerY - 5, centerX - 18, centerY + 20, seed, 320)}
      ${processingSvgLine(centerX + 18, centerY - 5, centerX + 18, centerY + 20, seed, 330)}
      
      <!-- Arms holding book -->
      ${processingSvgLine(centerX - 18, centerY + 2, centerX - 40, centerY + 8, seed, 400)}
      ${processingSvgLine(centerX + 18, centerY + 2, centerX + 40, centerY + 8, seed, 410)}
      
      <!-- Large book -->
      ${processingSvgLine(centerX - 35, centerY + 8, centerX - 35, centerY + 30, seed, 500)}
      ${processingSvgLine(centerX - 35, centerY + 30, centerX + 35, centerY + 30, seed, 510)}
      ${processingSvgLine(centerX + 35, centerY + 30, centerX + 35, centerY + 8, seed, 520)}
      ${processingSvgLine(centerX + 35, centerY + 8, centerX - 35, centerY + 8, seed, 530)}
      <!-- Book spine -->
      ${processingSvgLine(centerX, centerY + 8, centerX, centerY + 30, seed, 540)}
      
      <!-- Legs -->
      ${processingSvgLine(centerX - 10, centerY + 20, centerX - 10, centerY + 45, seed, 600)}
      ${processingSvgLine(centerX + 10, centerY + 20, centerX + 10, centerY + 45, seed, 610)}
      
      <!-- Artistic details -->
      <circle cx="${centerX - 45 + handDrawnOffset(seed, 300, 3)}" cy="${centerY - 15 + handDrawnOffset(seed, 301, 3)}" r="1.5" fill="#000" opacity="0.3"/>
      <circle cx="${centerX + 45 + handDrawnOffset(seed, 302, 3)}" cy="${centerY - 10 + handDrawnOffset(seed, 303, 3)}" r="1" fill="#000" opacity="0.3"/>
    </svg>`;
}

export function createKidSkateboardSketch(seed: number): string {
  const centerX = 150;
  const centerY = 75;
  
  return `
    <svg width="300" height="150" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="150" fill="#fff8dc"/>
      
      <!-- Kid's head - smaller and youthful -->
      ${processingSvgCircle(centerX, centerY - 25, 15, seed, 0)}
      
      <!-- Happy wide eyes -->
      <circle cx="${centerX - 8 + handDrawnOffset(seed, 10, 1)}" cy="${centerY - 27 + handDrawnOffset(seed, 11, 1)}" r="2" fill="#000"/>
      <circle cx="${centerX + 8 + handDrawnOffset(seed, 12, 1)}" cy="${centerY - 27 + handDrawnOffset(seed, 13, 1)}" r="2" fill="#000"/>
      
      <!-- Big excited smile -->
      <path d="M ${centerX - 10 + handDrawnOffset(seed, 20, 1)} ${centerY - 20 + handDrawnOffset(seed, 21, 1)} Q ${centerX} ${centerY - 15} ${centerX + 10 + handDrawnOffset(seed, 22, 1)} ${centerY - 20 + handDrawnOffset(seed, 23, 1)}" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round"/>
      
      <!-- Body in motion - leaning forward -->
      ${processingSvgLine(centerX, centerY - 10, centerX + 8, centerY + 15, seed, 100)}
      
      <!-- Arms for balance while skating -->
      ${processingSvgLine(centerX + 3, centerY - 2, centerX - 25, centerY - 8, seed, 200)}
      ${processingSvgLine(centerX + 3, centerY - 2, centerX + 30, centerY - 12, seed, 210)}
      
      <!-- Legs positioned on skateboard -->
      ${processingSvgLine(centerX + 3, centerY + 15, centerX - 12, centerY + 32, seed, 300)}
      ${processingSvgLine(centerX + 8, centerY + 15, centerX + 25, centerY + 32, seed, 310)}
      
      <!-- Skateboard deck -->
      ${processingSvgLine(centerX - 20, centerY + 35, centerX + 30, centerY + 35, seed, 400)}
      ${processingSvgLine(centerX - 18, centerY + 32, centerX + 28, centerY + 32, seed, 410)}
      ${processingSvgLine(centerX - 18, centerY + 32, centerX - 20, centerY + 35, seed, 420)}
      ${processingSvgLine(centerX + 28, centerY + 32, centerX + 30, centerY + 35, seed, 430)}
      
      <!-- Skateboard wheels -->
      ${processingSvgCircle(centerX - 15, centerY + 40, 4, seed, 500, "#333")}
      ${processingSvgCircle(centerX + 25, centerY + 40, 4, seed, 510, "#333")}
      
      <!-- Motion lines for speed -->
      ${processingSvgLine(centerX - 60, centerY + 20, centerX - 35, centerY + 20, seed, 600)}
      ${processingSvgLine(centerX - 65, centerY + 25, centerX - 40, centerY + 25, seed, 610)}
      ${processingSvgLine(centerX - 70, centerY + 30, centerX - 45, centerY + 30, seed, 620)}
      
      <!-- Excitement sparkles -->
      <circle cx="${centerX - 40 + handDrawnOffset(seed, 400, 4)}" cy="${centerY - 35 + handDrawnOffset(seed, 401, 4)}" r="1.5" fill="#000" opacity="0.4"/>
      <circle cx="${centerX + 40 + handDrawnOffset(seed, 402, 4)}" cy="${centerY - 30 + handDrawnOffset(seed, 403, 4)}" r="1" fill="#000" opacity="0.4"/>
    </svg>`;
}

export function createWomanHikingSketch(seed: number): string {
  const centerX = 120; // Offset to show hill better
  const centerY = 80;
  
  return `
    <svg width="300" height="150" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="150" fill="#e6ffe6"/>
      
      <!-- Woman's head -->
      ${processingSvgCircle(centerX, centerY - 35, 16, seed, 0)}
      
      <!-- Determined eyes -->
      <circle cx="${centerX - 8 + handDrawnOffset(seed, 10, 1)}" cy="${centerY - 37 + handDrawnOffset(seed, 11, 1)}" r="2" fill="#000"/>
      <circle cx="${centerX + 8 + handDrawnOffset(seed, 12, 1)}" cy="${centerY - 37 + handDrawnOffset(seed, 13, 1)}" r="2" fill="#000"/>
      
      <!-- Focused, determined expression -->
      ${processingSvgLine(centerX - 3, centerY - 30, centerX + 3, centerY - 30, seed, 20)}
      
      <!-- Body leaning forward uphill -->
      ${processingSvgLine(centerX, centerY - 19, centerX + 12, centerY + 8, seed, 100)}
      
      <!-- Arms - one with hiking pole -->
      ${processingSvgLine(centerX + 5, centerY - 8, centerX - 18, centerY - 2, seed, 200)}
      ${processingSvgLine(centerX + 5, centerY - 8, centerX + 35, centerY + 12, seed, 210)}
      
      <!-- Hiking pole -->
      ${processingSvgLine(centerX + 35, centerY + 12, centerX + 42, centerY + 45, seed, 250)}
      
      <!-- Backpack -->
      ${processingSvgCircle(centerX + 15, centerY - 5, 12, seed, 300)}
      
      <!-- Legs climbing uphill -->
      ${processingSvgLine(centerX + 5, centerY + 8, centerX - 8, centerY + 28, seed, 400)}
      ${processingSvgLine(centerX + 12, centerY + 8, centerX + 25, centerY + 32, seed, 410)}
      
      <!-- Hill/mountain path -->
      <path d="M 0 ${centerY + 50} Q ${centerX - 30} ${centerY + 40} ${centerX + 30} ${centerY + 28} Q ${centerX + 80} ${centerY + 18} 300 ${centerY + 12}" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round"/>
      
      <!-- Simple trees on hill -->
      ${processingSvgLine(centerX + 70, centerY + 22, centerX + 70, centerY - 8, seed, 500)}
      ${processingSvgCircle(centerX + 70, centerY - 12, 12, seed, 510, "none")}
      
      ${processingSvgLine(centerX + 100, centerY + 18, centerX + 100, centerY - 15, seed, 520)}
      ${processingSvgCircle(centerX + 100, centerY - 18, 14, seed, 530, "none")}
      
      <!-- Trail markers -->
      <circle cx="${centerX - 15 + handDrawnOffset(seed, 60, 3)}" cy="${centerY + 42 + handDrawnOffset(seed, 61, 3)}" r="2" fill="#666" opacity="0.5"/>
      <circle cx="${centerX + 35 + handDrawnOffset(seed, 62, 3)}" cy="${centerY + 30 + handDrawnOffset(seed, 63, 3)}" r="1.5" fill="#666" opacity="0.5"/>
      
      <!-- Small rocks/nature elements -->
      <circle cx="${centerX - 35 + handDrawnOffset(seed, 70, 4)}" cy="${centerY + 35 + handDrawnOffset(seed, 71, 4)}" r="3" fill="none" stroke="#000" stroke-width="2"/>
      <circle cx="${centerX + 50 + handDrawnOffset(seed, 72, 4)}" cy="${centerY + 25 + handDrawnOffset(seed, 73, 4)}" r="2.5" fill="none" stroke="#000" stroke-width="2"/>
    </svg>`;
}

export function createRocketSketch(seed: number): string {
  const centerX = 150;
  const centerY = 75;
  
  return `
    <svg width="300" height="150" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="150" fill="#f0f8ff"/>
      
      <!-- Animated rocket container -->
      <g class="rocket-animation">
        <!-- Rocket body -->
        ${processingSvgLine(centerX - 15, centerY - 20, centerX - 15, centerY + 25, seed, 0)}
        ${processingSvgLine(centerX + 15, centerY - 20, centerX + 15, centerY + 25, seed, 10)}
        ${processingSvgLine(centerX - 15, centerY + 25, centerX + 15, centerY + 25, seed, 20)}
        
        <!-- Rocket nose cone -->
        ${processingSvgLine(centerX - 15, centerY - 20, centerX, centerY - 35, seed, 100)}
        ${processingSvgLine(centerX, centerY - 35, centerX + 15, centerY - 20, seed, 110)}
        
        <!-- Rocket fins -->
        ${processingSvgLine(centerX - 15, centerY + 15, centerX - 25, centerY + 30, seed, 200)}
        ${processingSvgLine(centerX - 25, centerY + 30, centerX - 15, centerY + 25, seed, 210)}
        ${processingSvgLine(centerX + 15, centerY + 15, centerX + 25, centerY + 30, seed, 220)}
        ${processingSvgLine(centerX + 25, centerY + 30, centerX + 15, centerY + 25, seed, 230)}
        
        <!-- Friendly rocket window -->
        ${processingSvgCircle(centerX, centerY - 5, 12, seed, 300)}
        
        <!-- Happy rocket face -->
        <circle cx="${centerX - 4 + handDrawnOffset(seed, 40, 0.5)}" cy="${centerY - 8 + handDrawnOffset(seed, 41, 0.5)}" r="2" fill="#000"/>
        <circle cx="${centerX + 4 + handDrawnOffset(seed, 42, 0.5)}" cy="${centerY - 8 + handDrawnOffset(seed, 43, 0.5)}" r="2" fill="#000"/>
        <path d="M ${centerX - 5 + handDrawnOffset(seed, 44, 1)} ${centerY - 2 + handDrawnOffset(seed, 45, 1)} Q ${centerX} ${centerY + 2} ${centerX + 5 + handDrawnOffset(seed, 46, 1)} ${centerY - 2 + handDrawnOffset(seed, 47, 1)}" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"/>
        
        <!-- Rocket shading -->
        <line x1="${centerX - 10}" y1="${centerY - 15}" x2="${centerX - 10}" y2="${centerY + 20}" stroke="#666" stroke-width="2" opacity="0.3"/>
        <line x1="${centerX + 10}" y1="${centerY - 15}" x2="${centerX + 10}" y2="${centerY + 20}" stroke="#666" stroke-width="2" opacity="0.3"/>
        
        <!-- Flame/exhaust -->
        <path d="M ${centerX - 8} ${centerY + 25} Q ${centerX - 12} ${centerY + 35} ${centerX - 6} ${centerY + 40} Q ${centerX} ${centerY + 45} ${centerX + 6} ${centerY + 40} Q ${centerX + 12} ${centerY + 35} ${centerX + 8} ${centerY + 25}" fill="#ff6b35" stroke="#000" stroke-width="3" opacity="0.8"/>
        
        <!-- Stars in background -->
        <circle cx="${centerX - 60 + handDrawnOffset(seed, 60, 5)}" cy="${centerY - 40 + handDrawnOffset(seed, 61, 5)}" r="1.5" fill="#000" opacity="0.4"/>
        <circle cx="${centerX + 70 + handDrawnOffset(seed, 62, 5)}" cy="${centerY - 30 + handDrawnOffset(seed, 63, 5)}" r="1" fill="#000" opacity="0.4"/>
        <circle cx="${centerX - 80 + handDrawnOffset(seed, 64, 5)}" cy="${centerY + 10 + handDrawnOffset(seed, 65, 5)}" r="1.2" fill="#000" opacity="0.4"/>
        <circle cx="${centerX + 90 + handDrawnOffset(seed, 66, 5)}" cy="${centerY + 20 + handDrawnOffset(seed, 67, 5)}" r="0.8" fill="#000" opacity="0.4"/>
      </g>
    </svg>`;
}

// Function to generate Processing-style SVG illustrations
export function generateProcessingIllustration(type: 'reading' | 'skateboard' | 'hiking' | 'rocket', prompt: string): string {
  const seed = hashString(prompt);
  
  switch (type) {
    case 'reading':
      return createPersonReadingSketch(seed);
    case 'skateboard':
      return createKidSkateboardSketch(seed);
    case 'hiking':
      return createWomanHikingSketch(seed);
    case 'rocket':
      return createRocketSketch(seed);
    default:
      return createPersonReadingSketch(seed);
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}