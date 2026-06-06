import { AnimationAction } from '../three/AnimationManager';

export interface AnimationMetadata {
    file: string;
    action: AnimationAction;
    description: string;
    keywords: string[];
    sentiment: 'positive' | 'negative' | 'neutral' | 'energetic' | 'calm';
    category: 'idle' | 'talking' | 'action' | 'emotion' | 'dance';
    behavior: 'mood' | 'gesture'; // mood = sticky across sentences, gesture = one-shot
}

export const ANIMATION_METADATA: AnimationMetadata[] = [
    {
        file: "idle1.fbx",
        action: AnimationAction.IDLE,
        description: "Standard breathing idle, natural and relaxed.",
        keywords: ["chill", "stand", "still", "relax"],
        sentiment: "neutral",
        category: "idle",
        behavior: "mood"
    },
    {
        file: "Talking.fbx",
        action: AnimationAction.THINKING,
        description: "Natural hand gestures while speaking.",
        keywords: ["say", "tell", "explain", "speak", "talk", "talking", "thinking", "thought"],
        sentiment: "neutral",
        category: "talking",
        behavior: "mood"
    },
    {
        file: "angry.fbx",
        action: AnimationAction.ANGRY,
        description: "Aggressive body language, hands on hips or gesturing sharply.",
        keywords: ["angry", "mad", "furious", "outraged"],
        sentiment: "negative",
        category: "emotion",
        behavior: "gesture"
    },
    {
        file: "armStretching.fbx",
        action: AnimationAction.ARMS_STRETCH,
        description: "Stretching arms, showing tiredness or preparation.",
        keywords: ["tired", "stretch", "morning", "ready"],
        sentiment: "neutral",
        category: "action",
        behavior: "gesture"
    },
    {
        file: "buttonPushing.fbx",
        action: AnimationAction.BUTTON_PUSH,
        description: "Leaning forward to press a virtual button.",
        keywords: ["click", "press", "button", "start", "activate"],
        sentiment: "neutral",
        category: "action",
        behavior: "gesture"
    },
    {
        file: "danceBboyHipHop.fbx",
        action: AnimationAction.DANCE_BBOY,
        description: "Breakdance / Hip-hop energetic dance moves.",
        keywords: ["dance", "hiphop", "cool", "party", "breakdance"],
        sentiment: "energetic",
        category: "dance",
        behavior: "mood"
    },
    {
        file: "danceHipHop.fbx",
        action: AnimationAction.DANCE_HIPHOP,
        description: "Smooth hip-hop rhythm.",
        keywords: ["groove", "vibe", "music", "rhythm"],
        sentiment: "energetic",
        category: "dance",
        behavior: "mood"
    },
    {
        file: "danceRumba.fbx",
        action: AnimationAction.DANCE_RUMBA,
        description: "Elegant and rhythmic Rumba dance.",
        keywords: ["elegant", "latin", "rumba", "slow dance"],
        sentiment: "positive",
        category: "dance",
        behavior: "mood"
    },
    {
        file: "defeated.fbx",
        action: AnimationAction.DEFEATED,
        description: "Slumped shoulders, looking down in disappointment.",
        keywords: ["lose", "fail", "sad", "unfortunate", "sorry", "defeated"],
        sentiment: "negative",
        category: "emotion",
        behavior: "gesture"
    },
    {
        file: "dismissingGesture.fbx",
        action: AnimationAction.DISMISS,
        description: "A wave-away gesture, dismissing a topic.",
        keywords: ["nevermind", "ignore", "whatever", "dismiss", "bye"],
        sentiment: "neutral",
        category: "action",
        behavior: "gesture"
    },
    {
        file: "excitedDance.fbx",
        action: AnimationAction.EXCITED_DANCE,
        description: "Happy, jumping-style celebration dance.",
        keywords: ["yay", "hooray", "celebrate", "won", "excited", "awesome"],
        sentiment: "energetic",
        category: "dance",
        behavior: "mood"
    },
    {
        file: "greeting.fbx",
        action: AnimationAction.GREETING,
        description: "A friendly wave and open posture.",
        keywords: ["hello", "hi", "greetings", "welcome", "hey", "wave", "morning"],
        sentiment: "positive",
        category: "action",
        behavior: "gesture"
    },
    {
        file: "Drunk.fbx",
        action: AnimationAction.DRUNK,
        description: "Stumbling, dizzy, or unstable movement.",
        keywords: ["dizzy", "unstable", "drunk", "confused", "whoa"],
        sentiment: "negative",
        category: "idle",
        behavior: "mood"
    },
    {
        file: "SingleBigjump.fbx",
        action: AnimationAction.JUMP_SINGLE,
        description: "A single, powerful vertical jump.",
        keywords: ["jump", "leap", "up"],
        sentiment: "energetic",
        category: "action",
        behavior: "gesture"
    },
    {
        file: "bigJumps.fbx",
        action: AnimationAction.JUMP_BIG,
        description: "Continuous excited jumping.",
        keywords: ["jumping", "happy", "intense", "wow"],
        sentiment: "energetic",
        category: "action",
        behavior: "gesture"
    },
    {
        file: "layingFemalePose.fbx",
        action: AnimationAction.LAYING,
        description: "Relaxed laying down or reclining posture.",
        keywords: ["sleep", "rest", "lay", "bed", "relaxing"],
        sentiment: "calm",
        category: "idle",
        behavior: "mood"
    },
    {
        file: "nervousLookAround.fbx",
        action: AnimationAction.LOOK_AROUND,
        description: "Shifty eyes and hesitant head movements.",
        keywords: ["scared", "nervous", "who", "where", "anxious", "suspicious"],
        sentiment: "negative",
        category: "emotion",
        behavior: "gesture"
    },
    {
        file: "pointForward.fbx",
        action: AnimationAction.POINT,
        description: "Directing attention forward with a finger point.",
        keywords: ["look", "there", "pointing", "attention", "this"],
        sentiment: "neutral",
        category: "action",
        behavior: "gesture"
    },
    {
        file: "salute.fbx",
        action: AnimationAction.SALUTE,
        description: "A formal military-style salute.",
        keywords: ["sir", "captain", "respect", "formal", "yes", "salute"],
        sentiment: "positive",
        category: "action",
        behavior: "gesture"
    },
    {
        file: "surprised.fbx",
        action: AnimationAction.SURPRISED,
        description: "Sudden gasp/flinch showing shock.",
        keywords: ["shock", "surprised", "omg", "unbelievable", "unreal"],
        sentiment: "energetic",
        category: "emotion",
        behavior: "gesture"
    },
    {
        file: "talkingArguing.fbx",
        action: AnimationAction.TALK_ARGUE,
        description: "Heated discussion with more forceful gestures.",
        keywords: ["disagree", "argue", "debate", "protest"],
        sentiment: "negative",
        category: "talking",
        behavior: "mood"
    },
    {
        file: "talkingBig.fbx",
        action: AnimationAction.TALK_BIG,
        description: "Expansive gestures for emphasizing large concepts.",
        keywords: ["huge", "big", "important", "world", "everything", "expansion"],
        sentiment: "positive",
        category: "talking",
        behavior: "mood"
    },
    {
        file: "talking1.fbx",
        action: AnimationAction.TALK_NORMAL,
        description: "Casual alternative speaking animation.",
        keywords: ["anyway", "also", "besides", "chat"],
        sentiment: "neutral",
        category: "talking",
        behavior: "mood"
    },
    {
        file: "talkingOnPhone.fbx",
        action: AnimationAction.TALK_PHONE,
        description: "Mimicking holding a phone to the ear.",
        keywords: ["call", "phone", "hello?", "calling", "mobile"],
        sentiment: "neutral",
        category: "talking",
        behavior: "mood"
    },
    {
        file: "Rapping.fbx",
        action: AnimationAction.RAP,
        description: "Fast-paced, rhythmic hand movements typical of rapping.",
        keywords: ["rap", "beat", "rhyme", "flow", "hiphop style"],
        sentiment: "energetic",
        category: "talking",
        behavior: "mood"
    },
    {
        file: "Singing.fbx",
        action: AnimationAction.SING,
        description: "Expressive, sweeping movements for musical performance.",
        keywords: ["sing", "song", "music", "melody", "vocal"],
        sentiment: "positive",
        category: "talking",
        behavior: "mood"
    }
];
