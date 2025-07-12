// EQ preset categories
export const PRESET_CATEGORIES = [
  "Vocals",
  "Drums",
  "Bass",
  "Guitar",
  "Piano",
  "Strings",
  "Synth",
  "Mastering"
];

// EQ preset definitions
export const EQ_PRESETS = [
  {
    name: "Flat",
    category: "Mastering",
    description: "Neutral frequency response",
    settings: [0, 0, 0, 0, 0, 0, 0]
  },
  {
    name: "Vocal Clarity",
    category: "Vocals",
    description: "Enhanced vocal presence",
    settings: [0, -1, -2, 2, 3, 1, 0]
  },
  {
    name: "Vocal Air",
    category: "Vocals",
    description: "Adds brightness to vocals",
    settings: [0, -1, 0, 0, 1, 2, 3]
  },
  {
    name: "Vocal Warmth",
    category: "Vocals",
    description: "Adds low-mid warmth to vocals",
    settings: [0, 2, 1, 0, -1, 0, 0]
  },
  {
    name: "Kick Punch",
    category: "Drums",
    description: "Enhanced kick drum impact",
    settings: [3, 2, -2, 0, 0, 0, 0]
  },
  {
    name: "Snare Snap",
    category: "Drums",
    description: "Crisp snare drum sound",
    settings: [0, 0, -1, 2, 3, 1, 0]
  },
  {
    name: "Drum Overhead",
    category: "Drums",
    description: "Balanced cymbal and drum sound",
    settings: [0, 0, -1, 0, 1, 2, 3]
  },
  {
    name: "Bass Boost",
    category: "Bass",
    description: "Enhanced low end",
    settings: [3, 2, 0, 0, 0, 0, 0]
  },
  {
    name: "Bass Clarity",
    category: "Bass",
    description: "Defined bass with presence",
    settings: [2, 1, 0, 1, 0, 0, 0]
  },
  {
    name: "Bass Scoop",
    category: "Bass",
    description: "Reduced muddy frequencies",
    settings: [2, 0, -2, 0, 0, 0, 0]
  },
  {
    name: "Guitar Crunch",
    category: "Guitar",
    description: "Mid-focused guitar tone",
    settings: [0, 0, 1, 2, 1, 0, 0]
  },
  {
    name: "Guitar Sparkle",
    category: "Guitar",
    description: "Bright acoustic guitar",
    settings: [0, 0, 0, 1, 2, 3, 2]
  },
  {
    name: "Piano Warmth",
    category: "Piano",
    description: "Rich piano tone",
    settings: [1, 1, 0, 0, 0, 1, 0]
  },
  {
    name: "Piano Bright",
    category: "Piano",
    description: "Bright, clear piano",
    settings: [0, 0, -1, 0, 1, 2, 2]
  },
  {
    name: "String Ensemble",
    category: "Strings",
    description: "Full string section",
    settings: [0, 1, 1, 0, 0, 1, 1]
  },
  {
    name: "Synth Bass",
    category: "Synth",
    description: "Deep synth bass",
    settings: [3, 2, 0, -1, 0, 0, 0]
  },
  {
    name: "Synth Lead",
    category: "Synth",
    description: "Cutting synth lead",
    settings: [0, 0, -1, 1, 2, 2, 0]
  },
  {
    name: "Air Boost",
    category: "Mastering",
    description: "Enhanced high frequencies",
    settings: [0, 0, 0, 0, 1, 2, 3]
  },
  {
    name: "Loudness",
    category: "Mastering",
    description: "Smiley curve EQ",
    settings: [2, 1, -1, -1, 0, 1, 2]
  },
  {
    name: "Mid Scoop",
    category: "Mastering",
    description: "Reduced mid frequencies",
    settings: [1, 0, -2, -2, 0, 1, 1]
  }
];