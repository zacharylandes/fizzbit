// Dynamic Triangle-Integrated Prompt System

export const generateBlendedPrompt = (
  userInput: string, 
  wildWeight: number, 
  actionableWeight: number, 
  deepWeight: number, 
  count: number = 5
): string => {
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

export interface CreativityWeights {
  wild: number;
  actionable: number;
  deep: number;
}

export const getBlendDescription = (weights: CreativityWeights): string => {
  const { wild, actionable, deep } = weights;
  
  if (wild > 0.6) return "Experimental & Surreal";
  if (actionable > 0.6) return "Quick & Practical";
  if (deep > 0.6) return "Substantial & Meaningful";
  
  const parts = [];
  if (wild > 0.2) parts.push("Wild");
  if (actionable > 0.2) parts.push("Quick");
  if (deep > 0.2) parts.push("Deep");
  
  return parts.join(" + ");
};