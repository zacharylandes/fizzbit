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
  
  // Generate multiple varied parameters from the seed
  const numElements = (seed % 4) + 2; // 2-5 elements for less clutter
  const style = seed % 20; // 20 different cartoonish style variations
  const animationType = (seed >> 5) % 4; // 4 animation types
  
  let content = "";
  
  // Add magical sparkly background stars
  const numStars = (seed % 6) + 3;
  for (let i = 0; i < numStars; i++) {
    const starSeed = seed + (i * 123);
    const starX = (starSeed % width);
    const starY = ((starSeed >> 4) % height);
    const starSize = ((starSeed >> 8) % 3) + 2;
    content += `
      <g>
        <polygon points="${generateStarPoints(starX, starY, starSize, 5)}" 
          fill="hsl(45,90%,80%)" opacity="0.8">
          <animateTransform attributeName="transform" type="rotate"
            from="0 ${starX} ${starY}" to="360 ${starX} ${starY}" dur="${4 + i * 2}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.4" to="1" dur="${2 + i}s" 
            repeatCount="indefinite" direction="alternate"/>
        </polygon>
      </g>`;
  }
  
  // Generate cartoonish characters and elements
  for (let i = 0; i < numElements; i++) {
    const elementSeed = seed + (i * 347); // Prime number for better distribution
    const x = (elementSeed % (width - 80)) + 40; // Keep characters away from edges
    const y = ((elementSeed >> 4) % (height - 80)) + 40;
    const size = ((elementSeed >> 8) % 30) + 25; // Bigger characters
    
    // Create different cartoonish elements based on style variation
    switch(style % 20) {
      case 0: // Happy bear
        content += `
          <g>
            <!-- Bear body -->
            <ellipse cx="${x}" cy="${y + 15}" rx="${size * 0.8}" ry="${size * 0.6}" 
              fill="hsl(30,50%,60%)" stroke="hsl(30,50%,40%)" stroke-width="2">
              <animateTransform attributeName="transform" type="scale"
                from="1" to="1.1" dur="${3 + i}s" repeatCount="indefinite" direction="alternate"/>
            </ellipse>
            <!-- Bear head -->
            <circle cx="${x}" cy="${y - 10}" r="${size * 0.5}" 
              fill="hsl(30,50%,65%)" stroke="hsl(30,50%,40%)" stroke-width="2">
              <animate attributeName="cy" from="${y - 10}" to="${y - 12}" dur="${2 + i}s" 
                repeatCount="indefinite" direction="alternate"/>
            </circle>
            <!-- Bear ears -->
            <circle cx="${x - size * 0.3}" cy="${y - 25}" r="${size * 0.15}" fill="hsl(30,50%,60%)"/>
            <circle cx="${x + size * 0.3}" cy="${y - 25}" r="${size * 0.15}" fill="hsl(30,50%,60%)"/>
            <!-- Bear eyes -->
            <circle cx="${x - size * 0.15}" cy="${y - 15}" r="3" fill="black">
              <animate attributeName="r" from="2" to="4" dur="0.5s" repeatCount="indefinite" direction="alternate"/>
            </circle>
            <circle cx="${x + size * 0.15}" cy="${y - 15}" r="3" fill="black">
              <animate attributeName="r" from="2" to="4" dur="0.5s" repeatCount="indefinite" direction="alternate"/>
            </circle>
            <!-- Bear nose -->
            <ellipse cx="${x}" cy="${y - 5}" rx="3" ry="2" fill="hsl(0,50%,30%)"/>
          </g>`;
        break;
        
      case 1: // Bouncing cat
        content += `
          <g>
            <!-- Cat body -->
            <ellipse cx="${x}" cy="${y + 10}" rx="${size * 0.7}" ry="${size * 0.5}" 
              fill="hsl(${hue},60%,70%)" stroke="hsl(${hue},60%,50%)" stroke-width="2">
              <animateTransform attributeName="transform" type="translate"
                from="0,0" to="0,-5" dur="${2 + i}s" repeatCount="indefinite" direction="alternate"/>
            </ellipse>
            <!-- Cat head -->
            <circle cx="${x}" cy="${y - 8}" r="${size * 0.4}" 
              fill="hsl(${hue},60%,75%)" stroke="hsl(${hue},60%,50%)" stroke-width="2"/>
            <!-- Cat ears -->
            <polygon points="${x - size * 0.25},${y - 20} ${x - size * 0.1},${y - 30} ${x - size * 0.35},${y - 25}" 
              fill="hsl(${hue},60%,70%)"/>
            <polygon points="${x + size * 0.25},${y - 20} ${x + size * 0.1},${y - 30} ${x + size * 0.35},${y - 25}" 
              fill="hsl(${hue},60%,70%)"/>
            <!-- Cat tail -->
            <path d="M${x + size * 0.6} ${y + 5} Q${x + size * 0.9} ${y - 10} ${x + size * 0.7} ${y - 25}" 
              fill="none" stroke="hsl(${hue},60%,60%)" stroke-width="4" stroke-linecap="round">
              <animate attributeName="d" from="M${x + size * 0.6} ${y + 5} Q${x + size * 0.9} ${y - 10} ${x + size * 0.7} ${y - 25}" 
                       to="M${x + size * 0.6} ${y + 5} Q${x + size * 1.1} ${y - 5} ${x + size * 0.8} ${y - 20}" 
                       dur="${3 + i}s" repeatCount="indefinite" direction="alternate"/>
            </path>
          </g>`;
        break;
        
      case 2: // Floating balloon
        content += `
          <g>
            <!-- Balloon -->
            <ellipse cx="${x}" cy="${y - 10}" rx="${size * 0.6}" ry="${size * 0.8}" 
              fill="hsl(${hue},80%,70%)" stroke="hsl(${hue},80%,50%)" stroke-width="2">
              <animateTransform attributeName="transform" type="translate"
                from="0,0" to="0,-8" dur="${4 + i}s" repeatCount="indefinite" direction="alternate"/>
            </ellipse>
            <!-- Balloon string -->
            <line x1="${x}" y1="${y + 20}" x2="${x}" y2="${y + 40}" 
              stroke="hsl(0,0%,30%)" stroke-width="1">
              <animate attributeName="x1" from="${x}" to="${x + 3}" dur="${2 + i}s" 
                repeatCount="indefinite" direction="alternate"/>
            </line>
            <!-- Balloon highlight -->
            <ellipse cx="${x - size * 0.2}" cy="${y - 20}" rx="${size * 0.15}" ry="${size * 0.2}" 
              fill="hsl(${hue},40%,90%)" opacity="0.8"/>
          </g>`;
        break;
        
      case 3: // Smiling sun
        content += `
          <g>
            <!-- Sun face -->
            <circle cx="${x}" cy="${y}" r="${size * 0.5}" 
              fill="hsl(45,90%,70%)" stroke="hsl(45,90%,50%)" stroke-width="3">
              <animate attributeName="r" from="${size * 0.5}" to="${size * 0.55}" dur="${3 + i}s" 
                repeatCount="indefinite" direction="alternate"/>
            </circle>
            <!-- Sun rays -->
            ${Array.from({length: 8}, (_, j) => {
              const rayAngle = j * 45;
              const rayX1 = x + (size * 0.7) * Math.cos(rayAngle * Math.PI / 180);
              const rayY1 = y + (size * 0.7) * Math.sin(rayAngle * Math.PI / 180);
              const rayX2 = x + (size * 0.9) * Math.cos(rayAngle * Math.PI / 180);
              const rayY2 = y + (size * 0.9) * Math.sin(rayAngle * Math.PI / 180);
              return `
                <line x1="${rayX1}" y1="${rayY1}" x2="${rayX2}" y2="${rayY2}" 
                  stroke="hsl(45,90%,60%)" stroke-width="3" stroke-linecap="round">
                  <animate attributeName="opacity" from="0.6" to="1" dur="${1.5 + j * 0.2}s" 
                    repeatCount="indefinite" direction="alternate"/>
                </line>`;
            }).join('')}
            <!-- Sun eyes -->
            <circle cx="${x - size * 0.15}" cy="${y - size * 0.1}" r="3" fill="black"/>
            <circle cx="${x + size * 0.15}" cy="${y - size * 0.1}" r="3" fill="black"/>
            <!-- Sun smile -->
            <path d="M${x - size * 0.2} ${y + size * 0.1} Q${x} ${y + size * 0.3} ${x + size * 0.2} ${y + size * 0.1}" 
              fill="none" stroke="black" stroke-width="2" stroke-linecap="round"/>
          </g>`;
        break;
        
      case 4: // Dancing flower
        content += `
          <g>
            <!-- Flower stem -->
            <line x1="${x}" y1="${y + 20}" x2="${x}" y2="${y + 50}" 
              stroke="hsl(120,60%,40%)" stroke-width="4">
              <animate attributeName="x2" from="${x}" to="${x + 5}" dur="${3 + i}s" 
                repeatCount="indefinite" direction="alternate"/>
            </line>
            <!-- Flower petals -->
            ${Array.from({length: 6}, (_, j) => {
              const petalAngle = j * 60;
              const petalX = x + (size * 0.4) * Math.cos(petalAngle * Math.PI / 180);
              const petalY = y + (size * 0.4) * Math.sin(petalAngle * Math.PI / 180);
              return `
                <ellipse cx="${petalX}" cy="${petalY}" rx="${size * 0.2}" ry="${size * 0.35}" 
                  fill="hsl(${(hue + j * 30) % 360},80%,70%)" opacity="0.9"
                  transform="rotate(${petalAngle} ${petalX} ${petalY})">
                  <animateTransform attributeName="transform" type="rotate"
                    from="${petalAngle} ${petalX} ${petalY}" to="${petalAngle + 10} ${petalX} ${petalY}" 
                    dur="${2 + j * 0.3}s" repeatCount="indefinite" direction="alternate"/>
                </ellipse>`;
            }).join('')}
            <!-- Flower center -->
            <circle cx="${x}" cy="${y}" r="${size * 0.15}" fill="hsl(45,90%,60%)">
              <animate attributeName="r" from="${size * 0.12}" to="${size * 0.18}" dur="${2 + i}s" 
                repeatCount="indefinite" direction="alternate"/>
            </circle>
          </g>`;
        break;
        
      case 5: // Playful bird
        content += `
          <g>
            <!-- Bird body -->
            <ellipse cx="${x}" cy="${y}" rx="${size * 0.7}" ry="${size * 0.4}" 
              fill="hsl(${hue},70%,65%)" stroke="hsl(${hue},70%,45%)" stroke-width="2">
              <animateTransform attributeName="transform" type="translate"
                from="0,0" to="3,-3" dur="${2.5 + i}s" repeatCount="indefinite" direction="alternate"/>
            </ellipse>
            <!-- Bird head -->
            <circle cx="${x + size * 0.5}" cy="${y - 5}" r="${size * 0.3}" 
              fill="hsl(${hue},70%,70%)" stroke="hsl(${hue},70%,45%)" stroke-width="2"/>
            <!-- Bird beak -->
            <polygon points="${x + size * 0.7},${y - 5} ${x + size * 0.9},${y - 2} ${x + size * 0.7},${y + 2}" 
              fill="hsl(30,80%,50%)"/>
            <!-- Bird eye -->
            <circle cx="${x + size * 0.55}" cy="${y - 8}" r="2" fill="black"/>
            <!-- Bird wing -->
            <ellipse cx="${x - size * 0.1}" cy="${y - 5}" rx="${size * 0.3}" ry="${size * 0.2}" 
              fill="hsl(${(hue + 20) % 360},70%,60%)" opacity="0.8">
              <animateTransform attributeName="transform" type="rotate"
                from="0 ${x - size * 0.1} ${y - 5}" to="15 ${x - size * 0.1} ${y - 5}" 
                dur="${1.5 + i * 0.3}s" repeatCount="indefinite" direction="alternate"/>
            </ellipse>
          </g>`;
        break;
        
      case 6: // Cute mushroom
        content += `
          <g>
            <!-- Mushroom cap -->
            <ellipse cx="${x}" cy="${y - 10}" rx="${size * 0.6}" ry="${size * 0.3}" 
              fill="hsl(0,70%,65%)" stroke="hsl(0,70%,45%)" stroke-width="2">
              <animate attributeName="ry" from="${size * 0.3}" to="${size * 0.35}" dur="${3 + i}s" 
                repeatCount="indefinite" direction="alternate"/>
            </ellipse>
            <!-- Mushroom stem -->
            <rect x="${x - size * 0.15}" y="${y - 5}" width="${size * 0.3}" height="${size * 0.8}" 
              fill="hsl(30,30%,85%)" stroke="hsl(30,30%,70%)" stroke-width="1" rx="8"/>
            <!-- Mushroom spots -->
            <circle cx="${x - size * 0.2}" cy="${y - 15}" r="3" fill="white" opacity="0.9">
              <animate attributeName="opacity" from="0.5" to="1" dur="${2 + i}s" 
                repeatCount="indefinite" direction="alternate"/>
            </circle>
            <circle cx="${x + size * 0.1}" cy="${y - 20}" r="2" fill="white" opacity="0.9"/>
            <circle cx="${x + size * 0.25}" cy="${y - 12}" r="2.5" fill="white" opacity="0.9"/>
          </g>`;
        break;
        
      case 7: // Rainbow cloud
        content += `
          <g>
            <!-- Cloud -->
            <ellipse cx="${x}" cy="${y}" rx="${size * 0.8}" ry="${size * 0.4}" fill="hsl(200,20%,90%)" opacity="0.9">
              <animateTransform attributeName="transform" type="translate"
                from="0,0" to="5,0" dur="${4 + i}s" repeatCount="indefinite" direction="alternate"/>
            </ellipse>
            <circle cx="${x - size * 0.4}" cy="${y}" r="${size * 0.25}" fill="hsl(200,20%,90%)" opacity="0.9"/>
            <circle cx="${x + size * 0.4}" cy="${y}" r="${size * 0.25}" fill="hsl(200,20%,90%)" opacity="0.9"/>
            <circle cx="${x}" cy="${y - size * 0.2}" r="${size * 0.3}" fill="hsl(200,20%,90%)" opacity="0.9"/>
            <!-- Rainbow -->
            ${Array.from({length: 4}, (_, j) => {
              const rainbowY = y + 25 + j * 3;
              const rainbowHue = j * 90;
              return `
                <path d="M${x - size * 0.6} ${rainbowY} Q${x} ${rainbowY - 10} ${x + size * 0.6} ${rainbowY}" 
                  fill="none" stroke="hsl(${rainbowHue},80%,60%)" stroke-width="3" opacity="0.8">
                  <animate attributeName="opacity" from="0.4" to="1" dur="${2 + j * 0.5}s" 
                    repeatCount="indefinite" direction="alternate"/>
                </path>`;
            }).join('')}
          </g>`;
        break;
        
      case 8: // Happy ghost
        content += `
          <g>
            <!-- Ghost body -->
            <path d="M${x - size * 0.4} ${y + 20} 
                     Q${x - size * 0.4} ${y - 20} ${x} ${y - 20} 
                     Q${x + size * 0.4} ${y - 20} ${x + size * 0.4} ${y + 20}
                     L${x + size * 0.2} ${y + 15}
                     L${x} ${y + 25}
                     L${x - size * 0.2} ${y + 15} Z" 
              fill="hsl(200,30%,95%)" stroke="hsl(200,30%,80%)" stroke-width="2" opacity="0.9">
              <animateTransform attributeName="transform" type="translate"
                from="0,0" to="0,-6" dur="${3 + i}s" repeatCount="indefinite" direction="alternate"/>
            </path>
            <!-- Ghost eyes -->
            <circle cx="${x - size * 0.15}" cy="${y - 5}" r="3" fill="black"/>
            <circle cx="${x + size * 0.15}" cy="${y - 5}" r="3" fill="black"/>
            <!-- Ghost mouth -->
            <ellipse cx="${x}" cy="${y + 5}" rx="5" ry="3" fill="black"/>
          </g>`;
        break;
        
      case 9: // Bouncing frog
        content += `
          <g>
            <!-- Frog body -->
            <ellipse cx="${x}" cy="${y + 5}" rx="${size * 0.6}" ry="${size * 0.4}" 
              fill="hsl(120,60%,50%)" stroke="hsl(120,60%,30%)" stroke-width="2">
              <animateTransform attributeName="transform" type="scale"
                from="1" to="1.15" dur="${2 + i}s" repeatCount="indefinite" direction="alternate"/>
            </ellipse>
            <!-- Frog head -->
            <ellipse cx="${x}" cy="${y - 15}" rx="${size * 0.5}" ry="${size * 0.35}" 
              fill="hsl(120,60%,55%)" stroke="hsl(120,60%,30%)" stroke-width="2"/>
            <!-- Frog eyes -->
            <circle cx="${x - size * 0.2}" cy="${y - 25}" r="${size * 0.1}" fill="hsl(120,60%,55%)"/>
            <circle cx="${x + size * 0.2}" cy="${y - 25}" r="${size * 0.1}" fill="hsl(120,60%,55%)"/>
            <circle cx="${x - size * 0.2}" cy="${y - 25}" r="2" fill="black"/>
            <circle cx="${x + size * 0.2}" cy="${y - 25}" r="2" fill="black"/>
          </g>`;
        break;
        
      case 10: // Magic wand with sparkles
        content += `
          <g>
            <!-- Wand -->
            <line x1="${x - size * 0.4}" y1="${y + 20}" x2="${x + size * 0.4}" y2="${y - 20}" 
              stroke="hsl(30,50%,40%)" stroke-width="3" stroke-linecap="round">
              <animateTransform attributeName="transform" type="rotate"
                from="0 ${x} ${y}" to="10 ${x} ${y}" dur="${2 + i}s" repeatCount="indefinite" direction="alternate"/>
            </line>
            <!-- Star tip -->
            <polygon points="${generateStarPoints(x + size * 0.4, y - 20, 8, 5)}" 
              fill="hsl(45,90%,70%)" stroke="hsl(45,90%,50%)" stroke-width="1">
              <animateTransform attributeName="transform" type="rotate"
                from="0 ${x + size * 0.4} ${y - 20}" to="360 ${x + size * 0.4} ${y - 20}" 
                dur="${4 + i}s" repeatCount="indefinite"/>
            </polygon>
            <!-- Magic sparkles -->
            ${Array.from({length: 4}, (_, j) => {
              const sparkleX = x + ((elementSeed >> (j*4)) % 60) - 30;
              const sparkleY = y + ((elementSeed >> (j*4 + 2)) % 60) - 30;
              return `
                <polygon points="${generateStarPoints(sparkleX, sparkleY, 3, 4)}" 
                  fill="hsl(${45 + j * 60},90%,70%)" opacity="0.8">
                  <animate attributeName="opacity" from="0.3" to="1" dur="${1 + j * 0.5}s" 
                    repeatCount="indefinite" direction="alternate"/>
                  <animateTransform attributeName="transform" type="scale"
                    from="0.5" to="1.2" dur="${2 + j * 0.3}s" repeatCount="indefinite" direction="alternate"/>
                </polygon>`;
            }).join('')}
          </g>`;
        break;
        
      case 11: // Cute rocket
        content += `
          <g>
            <!-- Rocket body -->
            <ellipse cx="${x}" cy="${y}" rx="${size * 0.25}" ry="${size * 0.8}" 
              fill="hsl(${hue},70%,60%)" stroke="hsl(${hue},70%,40%)" stroke-width="2">
              <animateTransform attributeName="transform" type="translate"
                from="0,0" to="0,-8" dur="${2.5 + i}s" repeatCount="indefinite" direction="alternate"/>
            </ellipse>
            <!-- Rocket tip -->
            <polygon points="${x},${y - size * 0.8} ${x - size * 0.2},${y - size * 0.4} ${x + size * 0.2},${y - size * 0.4}" 
              fill="hsl(0,70%,60%)"/>
            <!-- Rocket fins -->
            <polygon points="${x - size * 0.25},${y + size * 0.6} ${x - size * 0.4},${y + size * 0.8} ${x - size * 0.1},${y + size * 0.8}" 
              fill="hsl(${hue},70%,50%)"/>
            <polygon points="${x + size * 0.25},${y + size * 0.6} ${x + size * 0.4},${y + size * 0.8} ${x + size * 0.1},${y + size * 0.8}" 
              fill="hsl(${hue},70%,50%)"/>
            <!-- Rocket window -->
            <circle cx="${x}" cy="${y - size * 0.2}" r="${size * 0.1}" fill="hsl(200,50%,80%)"/>
            <!-- Rocket flames -->
            <ellipse cx="${x}" cy="${y + size * 0.9}" rx="${size * 0.15}" ry="${size * 0.3}" 
              fill="hsl(15,90%,60%)" opacity="0.8">
              <animate attributeName="ry" from="${size * 0.2}" to="${size * 0.4}" dur="0.5s" 
                repeatCount="indefinite" direction="alternate"/>
            </ellipse>
          </g>`;
        break;
        
      case 12: // Bouncing heart
        content += `
          <g>
            <path d="M${x} ${y + size * 0.3}
                     C${x} ${y - size * 0.2} ${x - size * 0.5} ${y - size * 0.2} ${x - size * 0.5} ${y}
                     C${x - size * 0.5} ${y + size * 0.2} ${x} ${y + size * 0.5} ${x} ${y + size * 0.3}
                     C${x} ${y + size * 0.5} ${x + size * 0.5} ${y + size * 0.2} ${x + size * 0.5} ${y}
                     C${x + size * 0.5} ${y - size * 0.2} ${x} ${y - size * 0.2} ${x} ${y + size * 0.3}" 
              fill="hsl(340,80%,65%)" stroke="hsl(340,80%,45%)" stroke-width="2">
              <animateTransform attributeName="transform" type="scale"
                from="1" to="1.2" dur="${1.5 + i}s" repeatCount="indefinite" direction="alternate"/>
              <animate attributeName="fill" from="hsl(340,80%,65%)" to="hsl(340,90%,75%)" dur="${2 + i}s" 
                repeatCount="indefinite" direction="alternate"/>
            </path>
          </g>`;
        break;
        
      case 13: // Jumping bunny
        content += `
          <g>
            <!-- Bunny body -->
            <ellipse cx="${x}" cy="${y + 10}" rx="${size * 0.5}" ry="${size * 0.6}" 
              fill="hsl(30,30%,90%)" stroke="hsl(30,30%,70%)" stroke-width="2">
              <animateTransform attributeName="transform" type="translate"
                from="0,0" to="0,-5" dur="${2 + i}s" repeatCount="indefinite" direction="alternate"/>
            </ellipse>
            <!-- Bunny head -->
            <circle cx="${x}" cy="${y - 15}" r="${size * 0.35}" 
              fill="hsl(30,30%,92%)" stroke="hsl(30,30%,70%)" stroke-width="2"/>
            <!-- Bunny ears -->
            <ellipse cx="${x - size * 0.2}" cy="${y - 35}" rx="${size * 0.08}" ry="${size * 0.25}" 
              fill="hsl(30,30%,90%)" stroke="hsl(30,30%,70%)" stroke-width="1">
              <animateTransform attributeName="transform" type="rotate"
                from="0 ${x - size * 0.2} ${y - 35}" to="5 ${x - size * 0.2} ${y - 35}" 
                dur="${3 + i}s" repeatCount="indefinite" direction="alternate"/>
            </ellipse>
            <ellipse cx="${x + size * 0.2}" cy="${y - 35}" rx="${size * 0.08}" ry="${size * 0.25}" 
              fill="hsl(30,30%,90%)" stroke="hsl(30,30%,70%)" stroke-width="1">
              <animateTransform attributeName="transform" type="rotate"
                from="0 ${x + size * 0.2} ${y - 35}" to="-5 ${x + size * 0.2} ${y - 35}" 
                dur="${3 + i}s" repeatCount="indefinite" direction="alternate"/>
            </ellipse>
            <!-- Bunny nose -->
            <circle cx="${x}" cy="${y - 12}" r="1.5" fill="hsl(340,70%,60%)"/>
            <!-- Bunny tail -->
            <circle cx="${x - size * 0.4}" cy="${y + 5}" r="${size * 0.12}" fill="hsl(30,30%,95%)">
              <animate attributeName="r" from="${size * 0.1}" to="${size * 0.15}" dur="${2 + i}s" 
                repeatCount="indefinite" direction="alternate"/>
            </circle>
          </g>`;
        break;
        
      case 14: // Butterfly
        content += `
          <g>
            <!-- Butterfly body -->
            <ellipse cx="${x}" cy="${y}" rx="2" ry="${size * 0.6}" fill="hsl(30,50%,30%)"/>
            <!-- Upper wings -->
            <ellipse cx="${x - size * 0.3}" cy="${y - size * 0.2}" rx="${size * 0.25}" ry="${size * 0.35}" 
              fill="hsl(${hue},80%,70%)" stroke="hsl(${hue},80%,50%)" stroke-width="1" opacity="0.9">
              <animateTransform attributeName="transform" type="rotate"
                from="0 ${x - size * 0.3} ${y - size * 0.2}" to="15 ${x - size * 0.3} ${y - size * 0.2}" 
                dur="${1.5 + i * 0.2}s" repeatCount="indefinite" direction="alternate"/>
            </ellipse>
            <ellipse cx="${x + size * 0.3}" cy="${y - size * 0.2}" rx="${size * 0.25}" ry="${size * 0.35}" 
              fill="hsl(${hue},80%,70%)" stroke="hsl(${hue},80%,50%)" stroke-width="1" opacity="0.9">
              <animateTransform attributeName="transform" type="rotate"
                from="0 ${x + size * 0.3} ${y - size * 0.2}" to="-15 ${x + size * 0.3} ${y - size * 0.2}" 
                dur="${1.5 + i * 0.2}s" repeatCount="indefinite" direction="alternate"/>
            </ellipse>
            <!-- Lower wings -->
            <ellipse cx="${x - size * 0.25}" cy="${y + size * 0.2}" rx="${size * 0.15}" ry="${size * 0.25}" 
              fill="hsl(${(hue + 60) % 360},80%,70%)" opacity="0.8"/>
            <ellipse cx="${x + size * 0.25}" cy="${y + size * 0.2}" rx="${size * 0.15}" ry="${size * 0.25}" 
              fill="hsl(${(hue + 60) % 360},80%,70%)" opacity="0.8"/>
          </g>`;
        break;
        
      case 15: // Cheerful octopus
        content += `
          <g>
            <!-- Octopus head -->
            <circle cx="${x}" cy="${y - 10}" r="${size * 0.4}" 
              fill="hsl(${hue},70%,65%)" stroke="hsl(${hue},70%,45%)" stroke-width="2">
              <animate attributeName="r" from="${size * 0.38}" to="${size * 0.42}" dur="${3 + i}s" 
                repeatCount="indefinite" direction="alternate"/>
            </circle>
            <!-- Octopus tentacles -->
            ${Array.from({length: 4}, (_, j) => {
              const tentacleAngle = j * 90 + 45;
              const tentacleX = x + (size * 0.6) * Math.cos(tentacleAngle * Math.PI / 180);
              const tentacleY = y + (size * 0.6) * Math.sin(tentacleAngle * Math.PI / 180);
              return `
                <path d="M${x} ${y + 10} Q${tentacleX} ${y + 20} ${tentacleX} ${tentacleY}" 
                  fill="none" stroke="hsl(${hue},70%,60%)" stroke-width="4" stroke-linecap="round">
                  <animate attributeName="d" 
                    from="M${x} ${y + 10} Q${tentacleX} ${y + 20} ${tentacleX} ${tentacleY}"
                    to="M${x} ${y + 10} Q${tentacleX + 10} ${y + 15} ${tentacleX + 5} ${tentacleY - 5}"
                    dur="${2.5 + j * 0.3}s" repeatCount="indefinite" direction="alternate"/>
                </path>`;
            }).join('')}
            <!-- Octopus eyes -->
            <circle cx="${x - size * 0.15}" cy="${y - 15}" r="3" fill="white"/>
            <circle cx="${x + size * 0.15}" cy="${y - 15}" r="3" fill="white"/>
            <circle cx="${x - size * 0.15}" cy="${y - 15}" r="1.5" fill="black"/>
            <circle cx="${x + size * 0.15}" cy="${y - 15}" r="1.5" fill="black"/>
          </g>`;
        break;
        
      case 16: // Friendly alien
        content += `
          <g>
            <!-- Alien body -->
            <ellipse cx="${x}" cy="${y + 5}" rx="${size * 0.4}" ry="${size * 0.6}" 
              fill="hsl(${hue},60%,70%)" stroke="hsl(${hue},60%,50%)" stroke-width="2">
              <animate attributeName="ry" from="${size * 0.55}" to="${size * 0.65}" dur="${3 + i}s" 
                repeatCount="indefinite" direction="alternate"/>
            </ellipse>
            <!-- Alien head -->
            <ellipse cx="${x}" cy="${y - 20}" rx="${size * 0.5}" ry="${size * 0.4}" 
              fill="hsl(${hue},60%,75%)" stroke="hsl(${hue},60%,50%)" stroke-width="2"/>
            <!-- Alien antennae -->
            <line x1="${x - size * 0.2}" y1="${y - 35}" x2="${x - size * 0.3}" y2="${y - 45}" 
              stroke="hsl(${hue},60%,50%)" stroke-width="2" stroke-linecap="round">
              <animateTransform attributeName="transform" type="rotate"
                from="0 ${x - size * 0.2} ${y - 35}" to="10 ${x - size * 0.2} ${y - 35}" 
                dur="${2 + i}s" repeatCount="indefinite" direction="alternate"/>
            </line>
            <line x1="${x + size * 0.2}" y1="${y - 35}" x2="${x + size * 0.3}" y2="${y - 45}" 
              stroke="hsl(${hue},60%,50%)" stroke-width="2" stroke-linecap="round"/>
            <circle cx="${x - size * 0.3}" cy="${y - 45}" r="3" fill="hsl(45,90%,60%)"/>
            <circle cx="${x + size * 0.3}" cy="${y - 45}" r="3" fill="hsl(45,90%,60%)"/>
            <!-- Alien eyes -->
            <ellipse cx="${x - size * 0.1}" cy="${y - 25}" rx="4" ry="6" fill="black"/>
            <ellipse cx="${x + size * 0.1}" cy="${y - 25}" rx="4" ry="6" fill="black"/>
          </g>`;
        break;
        
      case 17: // Smiling donut
        content += `
          <g>
            <!-- Donut base -->
            <circle cx="${x}" cy="${y}" r="${size * 0.5}" 
              fill="hsl(30,70%,70%)" stroke="hsl(30,70%,50%)" stroke-width="2">
              <animateTransform attributeName="transform" type="rotate"
                from="0 ${x} ${y}" to="360 ${x} ${y}" dur="${8 + i}s" repeatCount="indefinite"/>
            </circle>
            <!-- Donut hole -->
            <circle cx="${x}" cy="${y}" r="${size * 0.2}" fill="white"/>
            <!-- Donut sprinkles -->
            ${Array.from({length: 8}, (_, j) => {
              const sprinkleAngle = j * 45 + (elementSeed % 45);
              const sprinkleRadius = (size * 0.3) + ((elementSeed >> (j*2)) % 10);
              const sprinkleX = x + sprinkleRadius * Math.cos(sprinkleAngle * Math.PI / 180);
              const sprinkleY = y + sprinkleRadius * Math.sin(sprinkleAngle * Math.PI / 180);
              return `
                <rect x="${sprinkleX - 1}" y="${sprinkleY - 3}" width="2" height="6" 
                  fill="hsl(${j * 45},80%,60%)" rx="1"
                  transform="rotate(${sprinkleAngle} ${sprinkleX} ${sprinkleY})">
                  <animate attributeName="opacity" from="0.6" to="1" dur="${1 + j * 0.2}s" 
                    repeatCount="indefinite" direction="alternate"/>
                </rect>`;
            }).join('')}
          </g>`;
        break;
        
      case 18: // Dancing robot
        content += `
          <g>
            <!-- Robot body -->
            <rect x="${x - size * 0.3}" y="${y - 5}" width="${size * 0.6}" height="${size * 0.7}" 
              fill="hsl(${hue},50%,60%)" stroke="hsl(${hue},50%,40%)" stroke-width="2" rx="5">
              <animateTransform attributeName="transform" type="translate"
                from="0,0" to="2,0" dur="${2 + i}s" repeatCount="indefinite" direction="alternate"/>
            </rect>
            <!-- Robot head -->
            <rect x="${x - size * 0.25}" y="${y - 35}" width="${size * 0.5}" height="${size * 0.4}" 
              fill="hsl(${hue},50%,65%)" stroke="hsl(${hue},50%,40%)" stroke-width="2" rx="3"/>
            <!-- Robot antenna -->
            <line x1="${x}" y1="${y - 35}" x2="${x}" y2="${y - 45}" stroke="hsl(${hue},50%,40%)" stroke-width="2"/>
            <circle cx="${x}" cy="${y - 45}" r="3" fill="hsl(0,80%,60%)">
              <animate attributeName="fill" from="hsl(0,80%,60%)" to="hsl(120,80%,60%)" dur="${1.5 + i}s" 
                repeatCount="indefinite" direction="alternate"/>
            </circle>
            <!-- Robot eyes -->
            <circle cx="${x - size * 0.1}" cy="${y - 25}" r="3" fill="hsl(200,80%,50%)"/>
            <circle cx="${x + size * 0.1}" cy="${y - 25}" r="3" fill="hsl(200,80%,50%)"/>
            <!-- Robot arms -->
            <rect x="${x - size * 0.5}" y="${y - 15}" width="${size * 0.15}" height="${size * 0.4}" 
              fill="hsl(${hue},50%,60%)" rx="3">
              <animateTransform attributeName="transform" type="rotate"
                from="0 ${x - size * 0.5} ${y - 15}" to="20 ${x - size * 0.5} ${y - 15}" 
                dur="${2.5 + i}s" repeatCount="indefinite" direction="alternate"/>
            </rect>
            <rect x="${x + size * 0.35}" y="${y - 15}" width="${size * 0.15}" height="${size * 0.4}" 
              fill="hsl(${hue},50%,60%)" rx="3">
              <animateTransform attributeName="transform" type="rotate"
                from="0 ${x + size * 0.35} ${y - 15}" to="-20 ${x + size * 0.35} ${y - 15}" 
                dur="${2.5 + i}s" repeatCount="indefinite" direction="alternate"/>
            </rect>
          </g>`;
        break;
        
      case 19: // Sleeping moon
        content += `
          <g>
            <!-- Moon -->
            <circle cx="${x}" cy="${y}" r="${size * 0.4}" 
              fill="hsl(45,40%,85%)" stroke="hsl(45,40%,70%)" stroke-width="2">
              <animate attributeName="cy" from="${y}" to="${y - 3}" dur="${4 + i}s" 
                repeatCount="indefinite" direction="alternate"/>
            </circle>
            <!-- Moon craters -->
            <circle cx="${x - size * 0.1}" cy="${y - 5}" r="2" fill="hsl(45,40%,75%)" opacity="0.7"/>
            <circle cx="${x + size * 0.15}" cy="${y + 8}" r="3" fill="hsl(45,40%,75%)" opacity="0.7"/>
            <!-- Sleeping face -->
            <path d="M${x - size * 0.15} ${y - 5} Q${x - size * 0.1} ${y - 8} ${x - size * 0.05} ${y - 5}" 
              fill="none" stroke="black" stroke-width="2" stroke-linecap="round"/>
            <path d="M${x + size * 0.05} ${y - 5} Q${x + size * 0.1} ${y - 8} ${x + size * 0.15} ${y - 5}" 
              fill="none" stroke="black" stroke-width="2" stroke-linecap="round"/>
            <path d="M${x - size * 0.1} ${y + 8} Q${x} ${y + 12} ${x + size * 0.1} ${y + 8}" 
              fill="none" stroke="black" stroke-width="2" stroke-linecap="round"/>
            <!-- Zzz sleep bubbles -->
            <text x="${x + size * 0.6}" y="${y - 15}" fill="hsl(200,30%,60%)" font-size="12" opacity="0.8">Z
              <animate attributeName="opacity" from="0.4" to="1" dur="${2 + i}s" 
                repeatCount="indefinite" direction="alternate"/>
            </text>
            <text x="${x + size * 0.7}" y="${y - 25}" fill="hsl(200,30%,60%)" font-size="10" opacity="0.6">z
              <animate attributeName="opacity" from="0.2" to="0.8" dur="${2.5 + i}s" 
                repeatCount="indefinite" direction="alternate"/>
            </text>
          </g>`;
        break;
    }
  }
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 ${width} ${height}"
         width="${width}" height="${height}">
      <!-- Animated background gradient -->
      <defs>
        <radialGradient id="bg-${seed}" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="hsl(${hue},30%,95%)" stop-opacity="0.3">
            <animate attributeName="stop-opacity" from="0.1" to="0.5" dur="${6}s" 
              repeatCount="indefinite" direction="alternate"/>
          </stop>
          <stop offset="100%" stop-color="hsl(${(hue + 120) % 360},30%,90%)" stop-opacity="0.1"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg-${seed})"/>
      ${content}
    </svg>
  `;
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