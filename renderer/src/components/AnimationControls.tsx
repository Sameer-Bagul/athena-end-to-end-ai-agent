import { AnimationAction } from '../three/AnimationManager';

interface AnimationControlsProps {
  currentAnimation: AnimationAction;
  onAnimationChange: (action: AnimationAction) => void;
}

const ANIMATION_LABELS: Record<AnimationAction, string> = {
  [AnimationAction.IDLE]: 'Idle',
  [AnimationAction.TALK]: 'Talk',
  [AnimationAction.GREET]: 'Greet',
  [AnimationAction.HAPPY]: 'Happy',
  [AnimationAction.JUMP]: 'Jump',
};

export const AnimationControls: React.FC<AnimationControlsProps> = ({
  currentAnimation,
  onAnimationChange,
}) => {
  return (
    <div className="shrink-0 h-20 flex items-center px-6 bg-black/40 backdrop-blur-md border-t border-white/10">
      <div className="w-full flex items-center justify-center gap-3">
        {Object.values(AnimationAction).map((action) => (
          <button
            key={action}
            onClick={() => onAnimationChange(action)}
            className={`
              px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200
              ${
                currentAnimation === action
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50 scale-105'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white hover:scale-105'
              }
            `}
          >
            {ANIMATION_LABELS[action]}
          </button>
        ))}
      </div>
    </div>
  );
};
