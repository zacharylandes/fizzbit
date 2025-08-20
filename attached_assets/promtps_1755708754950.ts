# Dynamic Triangle-Integrated Prompt System

## Main Blended Prompt (Use this one!)
```javascript
const generateBlendedPrompt = (userInput, wildWeight, actionableWeight, deepWeight, count = 5) => {
  // Determine dominant style
  const weights = { wild: wildWeight, actionable: actionableWeight, deep: deepWeight };
  const dominant = Object.keys(weights).reduce((a, b) => weights[a] > weights[b] ? a : b);
  
  // Build style guidance based on blend
  let styleGuide = "";
  let formatGuide = "";
  let hookGuide = "";
  
  if (wildWeight > 0.6) {
    styleGuide = "Be experimental, surreal, and boundary-pushing. Break rules and explore the absurd.";
    hookGuide = "What makes this delightfully strange or rule-breaking";
  } else if (actionableWeight > 0.6) {
    styleGuide = "Be practical, immediate, and doable. Focus on quick wins and simple daily practices.";
    hookGuide = "Why this small action creates momentum or immediate satisfaction";
  } else if (deepWeight > 0.6) {
    styleGuide = "Be substantial, meaningful, and project-oriented. Think long-term creative endeavors.";
    hookGuide = "What makes this worth the sustained effort and what you'll gain";
  } else {
    // Blended approach
    const styles = [];
    if (wildWeight > 0.2) styles.push(`${Math.round(wildWeight * 100)}% experimental/surreal`);
    if (actionableWeight > 0.2) styles.push(`${Math.round(actionableWeight * 100)}% practical/immediate`);
    if (deepWeight > 0.2) styles.push(`${Math.round(deepWeight * 100)}% substantial/long-term`);
    
    styleGuide = `Blend these creative approaches: ${styles.join(', ')}. `;
    hookGuide = "What makes this interesting given the creative blend";
  }
  
  // Time scope based on weights
  let timeScope = "";
  if (actionableWeight > 0.4) {
    timeScope = "Each idea should be startable today or completable in 5-30 minutes. ";
  } else if (deepWeight > 0.4) {
    timeScope = "Each idea should be a multi-week or multi-month journey. ";
  } else if (wildWeight > 0.4) {
    timeScope = "Focus on imaginative leaps regardless of time commitment. ";
  } else {
    timeScope = "Mix time commitments from quick wins to longer projects. ";
  }

  return `Generate ${count} compelling creative ideas about: "${userInput}"

STYLE BLEND: ${styleGuide}
TIME SCOPE: ${timeScope}
CREATIVE MIX: ${Math.round(wildWeight * 100)}% Wild Inspiration + ${Math.round(actionableWeight * 100)}% Daily Actionable + ${Math.round(deepWeight * 100)}% Deep Projects

Always make the ideas directly about "${userInput}" - be imaginative but clear and actionable for the given blend.

Format each as:
1. TITLE: [2-4 intriguing words]
IDEA: [One clear sentence that explores "${userInput}" through this creative lens]
HOOK: [${hookGuide}]

Example for "learning piano" with 60% actionable, 30% deep, 10% wild:
1. TITLE: Daily Chord Victory
IDEA: Learn one new chord each morning and immediately play a simple song that uses it before breakfast
HOOK: Builds piano skills through tiny daily wins that create instant musical satisfaction`;
};
```

## How to Integrate with Your Triangle Component

```javascript
// In your triangle component, update the generatePrompt function:
const generatePrompt = (userInput) => {
  return generateBlendedPrompt(userInput, weights.wild, weights.actionable, weights.deep, 5);
};

// Usage examples:
generatePrompt("green doggies with christmas hats")
generatePrompt("starting a podcast about local history") 
generatePrompt("photo of an old typewriter")
```

## Example Full Prompts with User Input

**User Input: "green doggies with christmas hats"**
**Triangle Position: 70% Wild + 20% Actionable + 10% Deep**

```
Generate 5 compelling creative ideas about: "green doggies with christmas hats"

STYLE BLEND: Be experimental, surreal, and boundary-pushing. Break rules and explore the absurd.
TIME SCOPE: Focus on imaginative leaps regardless of time commitment.
CREATIVE MIX: 70% Wild Inspiration + 20% Daily Actionable + 10% Deep Projects

Always make the ideas directly about "green doggies with christmas hats" - be imaginative but clear and actionable for the given blend.
```

**User Input: "need a name for my productivity app"**
**Triangle Position: 10% Wild + 80% Actionable + 10% Deep**

```
Generate 5 compelling creative ideas about: "need a name for my productivity app"

STYLE BLEND: Be practical, immediate, and doable. Focus on quick wins and simple daily practices.
TIME SCOPE: Each idea should be startable today or completable in 5-30 minutes.
CREATIVE MIX: 10% Wild Inspiration + 80% Daily Actionable + 10% Deep Projects

Always make the ideas directly about "need a name for my productivity app" - be imaginative but clear and actionable for the given blend.
```

## Example Outputs at Different Triangle Positions

**Pure Wild (100% Wild):**
```
STYLE BLEND: Be experimental, surreal, and boundary-pushing. Break rules and explore the absurd.
TIME SCOPE: Focus on imaginative leaps regardless of time commitment.
CREATIVE MIX: 100% Wild Inspiration + 0% Daily Actionable + 0% Deep Projects
```

**Balanced (33% each):**
```
STYLE BLEND: Blend these creative approaches: 33% experimental/surreal, 33% practical/immediate, 33% substantial/long-term.
TIME SCOPE: Mix time commitments from quick wins to longer projects.
CREATIVE MIX: 33% Wild Inspiration + 33% Daily Actionable + 33% Deep Projects
```

**Mixed (60% Actionable, 30% Deep, 10% Wild):**
```
STYLE BLEND: Be practical, immediate, and doable. Focus on quick wins and simple daily practices.
TIME SCOPE: Each idea should be startable today or completable in 5-30 minutes.
CREATIVE MIX: 10% Wild Inspiration + 60% Daily Actionable + 30% Deep Projects
```

This way, your triangle actually controls the AI's creative output in real-time!