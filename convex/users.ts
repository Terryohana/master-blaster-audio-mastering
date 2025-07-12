import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const user = await ctx.db.get(userId);
    if (!user) return null;

    let profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return { ...user, profile };
  },
});

export const createUserProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) return existingProfile._id;

    return await ctx.db.insert("userProfiles", {
      userId,
      subscriptionTier: "free",
      tracksUsed: 0,
    });
  },
});

export const updateProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, {
      firstName: args.firstName,
      lastName: args.lastName,
    });
  },
});

export const upgradeSubscription = mutation({
  args: {
    tier: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro"),
      v.literal("unlimited")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    // Reset tracks used when upgrading (simulate new billing cycle)
    const tracksUsed = args.tier === "free" ? profile.tracksUsed : 0;
    
    await ctx.db.patch(profile._id, {
      subscriptionTier: args.tier,
      tracksUsed,
      subscriptionExpiry: args.tier === "free" 
        ? undefined 
        : Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    return { success: true };
  },
});

export const getSubscriptionLimits = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return null;

    const limits = {
      free: 10,
      starter: 25,
      pro: 50,
      unlimited: 100,
    };

    return {
      tier: profile.subscriptionTier,
      limit: limits[profile.subscriptionTier],
      used: profile.tracksUsed,
      remaining: limits[profile.subscriptionTier] - profile.tracksUsed,
      subscriptionExpiry: profile.subscriptionExpiry,
    };
  },
});
