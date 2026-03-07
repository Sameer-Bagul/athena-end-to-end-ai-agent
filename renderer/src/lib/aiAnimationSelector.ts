import { AnimationAction } from '../three/AnimationManager';
import { ANIMATION_METADATA } from './animationMetadata';
import type { AnimationMetadata } from './animationMetadata';
import { animationFacialMap } from './facialMapping';

export interface AIAnimationSelection {
  animation: AnimationAction;
  facialExpressions: any[];
}

/**
 * Intelligent animation and facial expression selector
 * Uses metadata keywords to find the best match for the given text.
 */
export function selectAnimationAndExpression(text: string): AIAnimationSelection {
  const t = text.toLowerCase();

  // 0. Hint Detection (Prioritize bracketed tags like (Greeting) or (Angry))
  const hintMatch = text.match(/\(([^)]+)\)/);
  let hintedMeta: AnimationMetadata | null = null;

  if (hintMatch) {
    const hint = hintMatch[1].toLowerCase();
    // Try to find a metadata entry that matches the hint name or a keyword exactly
    hintedMeta = ANIMATION_METADATA.find(m =>
      m.file.toLowerCase().includes(hint) ||
      m.keywords.some(kw => kw.toLowerCase() === hint) ||
      m.category === hint
    ) || null;
  }

  // 1. Scoring Logic (Fallback or refinement)
  let bestMatch: AnimationMetadata | null = hintedMeta;
  let highestScore = hintedMeta ? 100 : 0; // High base score for explicit hints

  if (!hintedMeta) {
    // We skip "talking" and "idle" categories for specific keyword matching 
    // to prioritize actions/emotions/dances if mentioned.
    for (const meta of ANIMATION_METADATA) {
      let score = 0;

      // Exact keyword matches
      meta.keywords.forEach(kw => {
        if (t.includes(kw.toLowerCase())) {
          score += 2;
          // Bonus for longer keywords
          if (kw.length > 5) score += 1;
        }
      });

      // Semantic categories (if text mentions "dance", "sing", etc.)
      if (t.includes(meta.category)) score += 1;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = meta;
      }
    }
  }

  // 2. Map Metadata File back to AnimationAction
  let selectedAction: AnimationAction = AnimationAction.TALK_NORMAL;

  if (bestMatch) {
    // Find the Enum key that maps to this file
    const file = bestMatch.file;

    const fileToAction: Record<string, AnimationAction> = {
      "angry.fbx": AnimationAction.ANGRY,
      "armStretching.fbx": AnimationAction.ARMS_STRETCH,
      "buttonPushing.fbx": AnimationAction.BUTTON_PUSH,
      "danceBboyHipHop.fbx": AnimationAction.DANCE_BBOY,
      "danceHipHop.fbx": AnimationAction.DANCE_HIPHOP,
      "danceRumba.fbx": AnimationAction.DANCE_RUMBA,
      "defeated.fbx": AnimationAction.DEFEATED,
      "dismissingGesture.fbx": AnimationAction.DISMISS,
      "excitedDance.fbx": AnimationAction.EXCITED_DANCE,
      "greeting.fbx": AnimationAction.GREETING,
      "Drunk.fbx": AnimationAction.DRUNK,
      "Idle.fbx": AnimationAction.IDLE,
      "idle1.fbx": AnimationAction.IDLE_ALT,
      "SingleBigjump.fbx": AnimationAction.JUMP_SINGLE,
      "bigJumps.fbx": AnimationAction.JUMP_BIG,
      "layingFemalePose.fbx": AnimationAction.LAYING,
      "nervousLookAround.fbx": AnimationAction.LOOK_AROUND,
      "pointForward.fbx": AnimationAction.POINT,
      "salute.fbx": AnimationAction.SALUTE,
      "surprised.fbx": AnimationAction.SURPRISED,
      "talkingArguing.fbx": AnimationAction.TALK_ARGUE,
      "talkingBig.fbx": AnimationAction.TALK_BIG,
      "talking1.fbx": AnimationAction.TALK_NORMAL,
      "talkingOnPhone.fbx": AnimationAction.TALK_PHONE,
      "Rapping.fbx": AnimationAction.RAP,
      "Singing.fbx": AnimationAction.SING,
      "Talking.fbx": AnimationAction.THINKING
    };

    selectedAction = fileToAction[file] || AnimationAction.TALK_NORMAL;
  } else {
    // Default fallback based on sentence length or simple talk
    selectedAction = t.length > 100 ? AnimationAction.TALK_BIG : AnimationAction.TALK_NORMAL;
  }

  // 3. Determine Facial Expression (Emotion)
  const selectedExpressions: any[] = [];

  // Basic sentiment mapping
  if (t.includes('happy') || t.includes('glad') || t.includes('excited') || t.includes('great')) {
    selectedExpressions.push({ name: 'Joy', value: 1.0 }, { name: 'Smile', value: 0.8 });
  } else if (t.includes('sad') || t.includes('sorry') || t.includes('bad')) {
    selectedExpressions.push({ name: 'Sad', value: 1.0 });
  } else if (t.includes('angry') || t.includes('mad') || t.includes('hate')) {
    selectedExpressions.push({ name: 'Angry', value: 1.0 });
  } else if (t.includes('wow') || t.includes('surprised') || t.includes('shock')) {
    selectedExpressions.push({ name: 'Surprised', value: 1.0 });
  }

  // Merge with animation defaults
  const fbxFile = bestMatch ? bestMatch.file : "talking1.fbx";
  const animDefaults = animationFacialMap[fbxFile] || [];
  const finalExpressions = [...animDefaults, ...selectedExpressions];

  return { animation: selectedAction, facialExpressions: finalExpressions };
}
