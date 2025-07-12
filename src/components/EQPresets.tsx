interface EQPreset {
  name: string;
  category: string;
  description: string;
  gains: number[]; // 7-band EQ: [20Hz, 60Hz, 250Hz, 1kHz, 3kHz, 6kHz, 12kHz]
  icon: string;
}

export const EQ_PRESETS: EQPreset[] = [
  // Major Genres
  { name: "Rock", category: "Genre", description: "Mid-scooped with presence", gains: [-3, 2, -2, 1, 3, 2, 1], icon: "🎸" },
  { name: "Metal", category: "Genre", description: "Aggressive with tight low-end", gains: [-6, 1, -4, 2, 4, 3, 2], icon: "⚡" },
  { name: "Pop", category: "Genre", description: "Balanced with vocal emphasis", gains: [1, 2, -1, 1, 2, 1, 2], icon: "🎤" },
  { name: "Hip-Hop", category: "Genre", description: "Heavy bass with clear highs", gains: [4, 3, -2, 1, 2, 1, 2], icon: "🎧" },
  { name: "Trap", category: "Genre", description: "Extreme sub-bass", gains: [6, 2, -3, 0, 3, 2, 3], icon: "🔥" },
  { name: "Jazz", category: "Genre", description: "Warm and natural", gains: [0, 1, 1, 1, 1, 1, 2], icon: "🎷" },
  { name: "Classical", category: "Genre", description: "Minimal, natural dynamics", gains: [0, 0.5, 0, 0.5, 1, 1, 1], icon: "🎻" },
  { name: "EDM", category: "Genre", description: "V-shaped with power", gains: [5, 3, -2, -1, 2, 3, 4], icon: "🎛️" },
  { name: "House", category: "Genre", description: "Pumping bass, clear mids", gains: [4, 3, -1, 1, 2, 2, 3], icon: "🏠" },
  { name: "Dubstep", category: "Genre", description: "Extreme V-curve", gains: [8, 4, -4, -2, 4, 5, 6], icon: "🌊" },

  // Tone Variations
  { name: "Warm", category: "Tone", description: "Cozy, intimate sound", gains: [0, 2, 1, 0, -1, -1, 0], icon: "🔥" },
  { name: "Bright", category: "Tone", description: "Crisp and clear", gains: [0, 0, 0, 0, 3, 4, 3], icon: "✨" },
  { name: "Flat", category: "Tone", description: "Reference neutral", gains: [0, 0, 0, 0, 0, 0, 0], icon: "📏" },
  { name: "Vintage", category: "Tone", description: "Classic analog warmth", gains: [0, 1, 1, 1, -1, -2, -1], icon: "📻" },
  { name: "Airy", category: "Tone", description: "Open, spacious highs", gains: [0, 0, 0, 0, 1, 2, 4], icon: "☁️" },
  { name: "Punchy", category: "Tone", description: "Impact and presence", gains: [0, 2, 0, 0, 3, 1, 0], icon: "👊" },

  // Purpose Variations
  { name: "Vocal Boost", category: "Purpose", description: "Enhance vocal clarity", gains: [0, 0, -2, 2, 3, 1, 1], icon: "🎤" },
  { name: "Bass Tight", category: "Purpose", description: "Clean, tight low-end", gains: [-3, -1, -3, 0, 0, 0, 0], icon: "🎯" },
  { name: "Mastering", category: "Purpose", description: "Subtle final polish", gains: [0.5, 0.5, 0, 0.5, 1, 0.5, 1], icon: "🎚️" },

  // Sub-genres
  { name: "Classic Rock", category: "Sub-Genre", description: "Warmer vintage rock", gains: [-2, 2, 1, 1, 2, 2, 1], icon: "🎸" },
  { name: "Death Metal", category: "Sub-Genre", description: "Extreme aggression", gains: [-6, -2, -3, 2, 5, 4, 2], icon: "💀" },
  { name: "Trance", category: "Sub-Genre", description: "Emotional electronic", gains: [3, 2, -1, 2, 1, 2, 3], icon: "🌀" },
  { name: "Drum & Bass", category: "Sub-Genre", description: "Massive sub-bass", gains: [6, 4, -2, 0, 2, 2, 3], icon: "🥁" },

  // Mood Tags
  { name: "Chill", category: "Mood", description: "Relaxed and smooth", gains: [1, 2, 1, 0, -1, 0, 1], icon: "😌" },
  { name: "Dark", category: "Mood", description: "Moody and atmospheric", gains: [2, 1, 2, 0, -2, -3, -2], icon: "🌙" },
  { name: "Uplifting", category: "Mood", description: "Bright and energetic", gains: [1, 1, 0, 1, 2, 3, 3], icon: "☀️" },
  { name: "Heavy", category: "Mood", description: "Powerful and intense", gains: [3, 2, -1, 1, 3, 2, 1], icon: "⚡" },
];

export const PRESET_CATEGORIES = [
  "All",
  "Genre", 
  "Tone",
  "Purpose", 
  "Sub-Genre",
  "Mood"
];