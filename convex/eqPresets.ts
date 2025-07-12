import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listActivePresets = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("eqPresets")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const initializePresets = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if presets already exist
    const existingPresets = await ctx.db.query("eqPresets").collect();
    if (existingPresets.length > 0) return;

    const presets = [
      {
        name: "Warm Vocal",
        description: "Enhances vocal warmth and presence",
        category: "Vocal",
        settings: { lowGain: 2, midGain: 3, highGain: 1, lowFreq: 200, midFreq: 1000, highFreq: 8000 },
        isActive: true,
      },
      {
        name: "Bright Pop",
        description: "Modern pop sound with crisp highs",
        category: "Pop",
        settings: { lowGain: 1, midGain: 2, highGain: 4, lowFreq: 100, midFreq: 2000, highFreq: 10000 },
        isActive: true,
      },
      {
        name: "Deep Bass",
        description: "Enhanced low-end for electronic music",
        category: "Electronic",
        settings: { lowGain: 5, midGain: 0, highGain: 2, lowFreq: 60, midFreq: 500, highFreq: 12000 },
        isActive: true,
      },
      {
        name: "Rock Master",
        description: "Punchy midrange for rock tracks",
        category: "Rock",
        settings: { lowGain: 3, midGain: 4, highGain: 2, lowFreq: 120, midFreq: 800, highFreq: 6000 },
        isActive: true,
      },
      {
        name: "Jazz Smooth",
        description: "Smooth and balanced for jazz",
        category: "Jazz",
        settings: { lowGain: 2, midGain: 1, highGain: 3, lowFreq: 80, midFreq: 1200, highFreq: 8000 },
        isActive: true,
      },
      {
        name: "Hip Hop Punch",
        description: "Strong low-end with clear vocals",
        category: "Hip Hop",
        settings: { lowGain: 4, midGain: 2, highGain: 3, lowFreq: 80, midFreq: 1500, highFreq: 10000 },
        isActive: true,
      },
      {
        name: "Classical Balance",
        description: "Natural sound for classical music",
        category: "Classical",
        settings: { lowGain: 1, midGain: 0, highGain: 1, lowFreq: 100, midFreq: 1000, highFreq: 8000 },
        isActive: true,
      },
      {
        name: "Acoustic Guitar",
        description: "Perfect for acoustic instruments",
        category: "Acoustic",
        settings: { lowGain: 1, midGain: 3, highGain: 2, lowFreq: 120, midFreq: 2000, highFreq: 8000 },
        isActive: true,
      },
      {
        name: "EDM Boost",
        description: "High energy for electronic dance music",
        category: "EDM",
        settings: { lowGain: 4, midGain: 1, highGain: 5, lowFreq: 60, midFreq: 800, highFreq: 12000 },
        isActive: true,
      },
      {
        name: "Podcast Voice",
        description: "Clear speech for podcasts",
        category: "Voice",
        settings: { lowGain: 0, midGain: 4, highGain: 2, lowFreq: 200, midFreq: 1000, highFreq: 6000 },
        isActive: true,
      },
      {
        name: "Vintage Warmth",
        description: "Retro analog sound",
        category: "Vintage",
        settings: { lowGain: 3, midGain: 2, highGain: 1, lowFreq: 100, midFreq: 800, highFreq: 6000 },
        isActive: true,
      },
      {
        name: "Crystal Clear",
        description: "Ultra-clean and transparent",
        category: "Clean",
        settings: { lowGain: 0, midGain: 1, highGain: 3, lowFreq: 80, midFreq: 2000, highFreq: 10000 },
        isActive: true,
      },
      {
        name: "Radio Ready",
        description: "Broadcast-ready sound",
        category: "Broadcast",
        settings: { lowGain: 2, midGain: 3, highGain: 3, lowFreq: 100, midFreq: 1500, highFreq: 8000 },
        isActive: true,
      },
      {
        name: "Ambient Space",
        description: "Spacious sound for ambient music",
        category: "Ambient",
        settings: { lowGain: 2, midGain: 0, highGain: 4, lowFreq: 60, midFreq: 500, highFreq: 12000 },
        isActive: true,
      },
      {
        name: "Country Twang",
        description: "Perfect for country music",
        category: "Country",
        settings: { lowGain: 2, midGain: 3, highGain: 2, lowFreq: 120, midFreq: 1200, highFreq: 8000 },
        isActive: true,
      },
      {
        name: "Metal Aggression",
        description: "Heavy and aggressive for metal",
        category: "Metal",
        settings: { lowGain: 4, midGain: 5, highGain: 3, lowFreq: 100, midFreq: 800, highFreq: 8000 },
        isActive: true,
      },
      {
        name: "Reggae Groove",
        description: "Laid-back reggae sound",
        category: "Reggae",
        settings: { lowGain: 3, midGain: 1, highGain: 2, lowFreq: 80, midFreq: 600, highFreq: 8000 },
        isActive: true,
      },
      {
        name: "Blues Soul",
        description: "Soulful blues tone",
        category: "Blues",
        settings: { lowGain: 2, midGain: 4, highGain: 1, lowFreq: 100, midFreq: 1000, highFreq: 6000 },
        isActive: true,
      },
      {
        name: "Orchestral Epic",
        description: "Grand orchestral sound",
        category: "Orchestral",
        settings: { lowGain: 2, midGain: 1, highGain: 3, lowFreq: 60, midFreq: 1000, highFreq: 10000 },
        isActive: true,
      },
      {
        name: "Lo-Fi Chill",
        description: "Relaxed lo-fi aesthetic",
        category: "Lo-Fi",
        settings: { lowGain: 3, midGain: 0, highGain: 1, lowFreq: 120, midFreq: 800, highFreq: 6000 },
        isActive: true,
      },
    ];

    for (const preset of presets) {
      await ctx.db.insert("eqPresets", preset);
    }
  },
});
