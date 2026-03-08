import { AnimationAction } from '../three/AnimationManager';
import { ANIMATION_METADATA } from './animationMetadata';
import type { AnimationMetadata } from './animationMetadata';
import { animationFacialMap } from './facialMapping';

export interface AIAnimationSelection {
  animation: AnimationAction;
  facialExpressions: any[];
  hasHint: boolean;
  behavior: 'mood' | 'gesture';
}

/**
 * Intelligent animation and facial expression selector
 * Uses metadata keywords to find the best match for the given text.
 */
export function selectAnimationAndExpression(text: string): AIAnimationSelection {
  const t = text.toLowerCase();

  // 0. Hint Detection (Prioritize bracketed tags)
  const hintMatches = [...text.matchAll(/\(([^)]+)\)/g)];
  let hintedMeta: AnimationMetadata | null = null;
  let hasHint = false;

  if (hintMatches.length > 0) {
    const hint = hintMatches[hintMatches.length - 1][1].toLowerCase().trim();
    hasHint = true;

    // Fuzzy match against file names, keywords, or categories
    hintedMeta = ANIMATION_METADATA.find(m => {
      const fileNameRaw = m.file.replace('.fbx', '').toLowerCase();
      return fileNameRaw === hint ||
        fileNameRaw.includes(hint) ||
        m.keywords.some(kw => kw.toLowerCase() === hint) ||
        m.category.toLowerCase() === hint;
    }) || null;

    if (!hintedMeta) {
      console.warn(`⚠️ [AnimationSelector] Hint "(${hint})" provided but no matching meta found.`);
    }
  }

  // 1. Scoring Logic (Fallback if no hint or hint failed)
  let bestMatch: AnimationMetadata | null = hintedMeta;
  let highestScore = hintedMeta ? 100 : 0;

  if (!hintedMeta) {
    for (const meta of ANIMATION_METADATA) {
      let score = 0;
      meta.keywords.forEach(kw => {
        if (t.includes(kw.toLowerCase())) {
          score += 2;
          if (kw.length > 5) score += 1;
        }
      });

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
      "idle1.fbx": AnimationAction.IDLE,
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
    selectedAction = t.length > 80 ? AnimationAction.TALK_BIG : AnimationAction.TALK_NORMAL;
  }

  // 3. Determine Facial Expression
  const selectedExpressions: any[] = [];
  if (t.includes('happy') || t.includes('glad') || t.includes('excited')) {
    selectedExpressions.push({ name: 'Joy', value: 1.0 });
  } else if (t.includes('sad') || t.includes('sorry')) {
    selectedExpressions.push({ name: 'Sad', value: 1.0 });
  }

  const fbxFile = bestMatch ? bestMatch.file : "talking1.fbx";
  const animDefaults = animationFacialMap[fbxFile] || [];
  const finalExpressions = [...animDefaults, ...selectedExpressions];

  return {
    animation: selectedAction,
    facialExpressions: finalExpressions,
    hasHint,
    behavior: bestMatch?.behavior || (hasHint ? 'gesture' : 'mood')
  };
}
