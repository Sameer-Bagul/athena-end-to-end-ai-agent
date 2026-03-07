export interface AnimationMetadata {
    file: string;
    description: string;
    keywords: string[];
    sentiment: 'positive' | 'negative' | 'neutral' | 'energetic' | 'calm';
    category: 'idle' | 'talking' | 'action' | 'emotion' | 'dance';
}

export const ANIMATION_METADATA: AnimationMetadata[] = [
    {
        file: "Idle.fbx",
        description: "Standard breathing idle, natural and relaxed.",
        keywords: ["wait", "stay", "relax", "listen"],
        sentiment: "neutral",
        category: "idle"
    },
    {
        file: "Talking.fbx",
        description: "Natural hand gestures while speaking.",
        keywords: ["say", "tell", "explain", "speak"],
        sentiment: "neutral",
        category: "talking"
    },
    {
        file: "angry.fbx",
        description: "Aggressive body language, hands on hips or gesturing sharply.",
        keywords: ["angry", "mad", "hate", "terrible", "stop", "no"],
        sentiment: "negative",
        category: "emotion"
    },
    {
        file: "armStretching.fbx",
        description: "Stretching arms, showing tiredness or preparation.",
        keywords: ["tired", "stretch", "morning", "ready"],
        sentiment: "neutral",
        category: "action"
    },
    {
        file: "buttonPushing.fbx",
        description: "Leaning forward to press a virtual button.",
        keywords: ["click", "press", "button", "start", "activate"],
        sentiment: "neutral",
        category: "action"
    },
    {
        file: "danceBboyHipHop.fbx",
        description: "Breakdance / Hip-hop energetic dance moves.",
        keywords: ["dance", "hiphop", "cool", "party", "breakdance"],
        sentiment: "energetic",
        category: "dance"
    },
    {
        file: "danceHipHop.fbx",
        description: "Smooth hip-hop rhythm.",
        keywords: ["groove", "vibe", "music", "rhythm"],
        sentiment: "energetic",
        category: "dance"
    },
    {
        file: "danceRumba.fbx",
        description: "Elegant and rhythmic Rumba dance.",
        keywords: ["elegant", "latin", "rumba", "slow dance"],
        sentiment: "positive",
        category: "dance"
    },
    {
        file: "defeated.fbx",
        description: "Slumped shoulders, looking down in disappointment.",
        keywords: ["lose", "fail", "sad", "unfortunate", "sorry", "defeated"],
        sentiment: "negative",
        category: "emotion"
    },
    {
        file: "dismissingGesture.fbx",
        description: "A wave-away gesture, dismissing a topic.",
        keywords: ["nevermind", "ignore", "whatever", "dismiss", "bye"],
        sentiment: "neutral",
        category: "action"
    },
    {
        file: "excitedDance.fbx",
        description: "Happy, jumping-style celebration dance.",
        keywords: ["yay", "hooray", "celebrate", "won", "excited", "awesome"],
        sentiment: "energetic",
        category: "dance"
    },
    {
        file: "greeting.fbx",
        description: "A friendly wave and open posture.",
        keywords: ["hello", "hi", "greetings", "welcome", "hey"],
        sentiment: "positive",
        category: "action"
    },
    {
        file: "Drunk.fbx",
        description: "Stumbling, dizzy, or unstable movement.",
        keywords: ["dizzy", "unstable", "drunk", "confused", "whoa"],
        sentiment: "negative",
        category: "idle"
    },
    {
        file: "idle1.fbx",
        description: "Alternative casual idle posture.",
        keywords: ["chill", "stand", "waiting"],
        sentiment: "neutral",
        category: "idle"
    },
    {
        file: "SingleBigjump.fbx",
        description: "A single, powerful vertical jump.",
        keywords: ["jump", "leap", "up"],
        sentiment: "energetic",
        category: "action"
    },
    {
        file: "bigJumps.fbx",
        description: "Continuous excited jumping.",
        keywords: ["jumping", "happy", "intense", "wow"],
        sentiment: "energetic",
        category: "action"
    },
    {
        file: "layingFemalePose.fbx",
        description: "Relaxed laying down or reclining posture.",
        keywords: ["sleep", "rest", "lay", "bed", "relaxing"],
        sentiment: "calm",
        category: "idle"
    },
    {
        file: "nervousLookAround.fbx",
        description: "Shifty eyes and hesitant head movements.",
        keywords: ["scared", "nervous", "who", "where", "anxious", "suspicious"],
        sentiment: "negative",
        category: "emotion"
    },
    {
        file: "pointForward.fbx",
        description: "Directing attention forward with a finger point.",
        keywords: ["look", "there", "pointing", "attention", "this"],
        sentiment: "neutral",
        category: "action"
    },
    {
        file: "salute.fbx",
        description: "A formal military-style salute.",
        keywords: ["sir", "captain", "respect", "formal", "yes", "salute"],
        sentiment: "positive",
        category: "action"
    },
    {
        file: "surprised.fbx",
        description: "Sudden gasp/flinch showing shock.",
        keywords: ["shock", "surprised", "what", "omg", "unbelievable"],
        sentiment: "energetic",
        category: "emotion"
    },
    {
        file: "talkingArguing.fbx",
        description: "Heated discussion with more forceful gestures.",
        keywords: ["disagree", "argue", "debate", "wrong", "but"],
        sentiment: "negative",
        category: "talking"
    },
    {
        file: "talkingBig.fbx",
        description: "Expansive gestures for emphasizing large concepts.",
        keywords: ["huge", "big", "important", "world", "everything", "expansion"],
        sentiment: "positive",
        category: "talking"
    },
    {
        file: "talking1.fbx",
        description: "Casual alternative speaking animation.",
        keywords: ["anyway", "also", "besides", "chat"],
        sentiment: "neutral",
        category: "talking"
    },
    {
        file: "talkingOnPhone.fbx",
        description: "Mimicking holding a phone to the ear.",
        keywords: ["call", "phone", "hello?", "calling", "mobile"],
        sentiment: "neutral",
        category: "talking"
    },
    {
        file: "Rapping.fbx",
        description: "Fast-paced, rhythmic hand movements typical of rapping.",
        keywords: ["rap", "beat", "rhyme", "flow", "hiphop style"],
        sentiment: "energetic",
        category: "talking"
    },
    {
        file: "Singing.fbx",
        description: "Expressive, sweeping movements for musical performance.",
        keywords: ["sing", "song", "music", "melody", "vocal"],
        sentiment: "positive",
        category: "talking"
    }
];
