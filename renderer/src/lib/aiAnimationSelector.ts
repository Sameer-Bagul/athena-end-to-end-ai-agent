// AI-driven animation and facial expression selector
import { AnimationAction } from '../three/AnimationManager';
import { animationFacialMap } from './facialMapping';

export interface AIAnimationSelection {
  animation: AnimationAction;
  facialExpressions: typeof animationFacialMap[AnimationAction];
}

// Example: Use LLM output (intent, emotion, or text) to select animation and facial expression
export function selectAnimationAndExpression(text: string): AIAnimationSelection {
  const t = text.toLowerCase();
  let animation: AnimationAction = AnimationAction.THINKING;

  // 1. Determine Animation (Body Language)
  if (t.includes('hello') || t.includes('hi ') || t.includes('greetings')) {
    animation = AnimationAction.CLAPPING;
  } else if (t.includes('bye') || t.includes('see you')) {
    animation = AnimationAction.GOODBYE;
  } else if (t.includes('jump')) {
    animation = AnimationAction.JUMP;
  } else if (t.includes('look')) {
    animation = AnimationAction.LOOK_AROUND;
  } else {
    // Default for speaking
    animation = AnimationAction.THINKING;
  }

  // 2. Determine Facial Expression (Emotion)
  // We prioritize strong emotions.
  // We also try to detect negation ("not happy") though simple keyword matching is limited.

  const selectedExpressions: any[] = [];

  const hasNegative = t.includes('not ') || t.includes("don't") || t.includes("won't");

  // Keyword Sets
  // These should be moved to a config/data file in a real app
  const keywords = {
    joy: ['happy', 'excited', 'great', 'love', 'wonderful', 'amazing', 'good', 'glad', 'funny', 'haha', 'lol'],
    sad: ['sad', 'sorry', 'unfortunate', 'bad', 'depressed', 'crying', 'tear', 'upset'],
    angry: ['angry', 'mad', 'terrible', 'hate', 'furious', 'annoying', 'stupid'],
    surprised: ['wow', 'surprised', 'shocked', 'unbelievable', 'really?'],
  };

  if (keywords.angry.some(k => t.includes(k)) && !hasNegative) {
    selectedExpressions.push({ name: 'Angry', value: 1.0 });
  } else if (keywords.sad.some(k => t.includes(k)) && !hasNegative) {
    selectedExpressions.push({ name: 'Sad', value: 1.0 }, { name: 'Frown', value: 0.5 });
  } else if (keywords.surprised.some(k => t.includes(k))) {
    selectedExpressions.push({ name: 'Surprised', value: 1.0 });
  } else if (keywords.joy.some(k => t.includes(k)) && !hasNegative) {
    selectedExpressions.push({ name: 'Joy', value: 1.0 }, { name: 'Smile', value: 1.0 }, { name: 'EyeSmileLeft', value: 0.8 }, { name: 'EyeSmileRight', value: 0.8 });
  } else {
    // Neutral / Default
    // If no strong emotion, maybe just a slight smile if positive context or just neutral
    selectedExpressions.push({ name: 'Neutral', value: 0.5 });
  }

  // Merge with animation defaults if needed
  const animDefaults = animationFacialMap[animation] || [];

  // Logic: Emotion Expressions should OVERRIDE animation defaults if there's a conflict, 
  // or we just stack them. Stacking is safer for now.
  const finalExpressions = [...animDefaults, ...selectedExpressions];

  return { animation, facialExpressions: finalExpressions };
}
