import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const applicationTables = {
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.string(),
    pictureUrl: v.optional(v.string()),
    lastSignIn: v.number(),
  }).index("by_token", ["tokenIdentifier"]),
  
  userProfiles: defineTable({
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.optional(v.union(
      v.literal("user"),
      v.literal("admin")
    )),
    subscriptionTier: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro"),
      v.literal("unlimited")
    ),
    tracksUsed: v.number(),
    subscriptionExpiry: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    originalAudioId: v.optional(v.id("_storage")),
    masteredAudioId: v.optional(v.id("_storage")),
    eqPreset: v.string(),
    eqSettings: v.optional(v.any()),
    compressorSettings: v.optional(v.any()),
    status: v.union(
      v.literal("uploading"),
      v.literal("queued"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    duration: v.optional(v.number()),
    fileSize: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_user_and_preset", ["userId", "eqPreset"]),

  eqPresets: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.string(),
    settings: v.object({
      lowGain: v.number(),
      midGain: v.number(),
      highGain: v.number(),
      lowFreq: v.number(),
      midFreq: v.number(),
      highFreq: v.number(),
    }),
    isActive: v.boolean(),
  }).index("by_active", ["isActive"]),
};

export default defineSchema({
  ...applicationTables,
});