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

  const nsfwKeywords = ["fuck", "wet", "cock", "pussy", "hard", "dick", "moan", "pleasure", "slut", "horny", "intimate", "naked", "sex"];
  const isNSFW = nsfwKeywords.some(kw => new RegExp(`\\b${kw}\\b`, 'g').test(t));

  if (!hintedMeta) {
    if (isNSFW) {
      bestMatch = ANIMATION_METADATA.find(m => m.action === AnimationAction.IDLE) || null;
    } else {
      for (const meta of ANIMATION_METADATA) {
        let score = 0;
        meta.keywords.forEach(kw => {
          if (new RegExp(`\\b${kw.toLowerCase()}\\b`, 'g').test(t)) {
            score += 2;
            if (kw.length > 5) score += 1;
          }
        });

        if (new RegExp(`\\b${meta.category}\\b`, 'g').test(t)) score += 1;

        if (score > highestScore && score >= 3) { // Require a higher confidence score
          highestScore = score;
          bestMatch = meta;
        }
      }
    }
  }

  // 2. Map Metadata File back to AnimationAction
  let selectedAction: AnimationAction = AnimationAction.TALK_NORMAL;
  selectedAction = bestMatch ? bestMatch.action : AnimationAction.IDLE;

  if (!bestMatch) {
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
