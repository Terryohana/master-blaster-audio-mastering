import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Get the current user with their profile - simplified version
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    // Return basic user info from identity
    return {
      _id: "placeholder",
      email: identity.email,
      name: identity.name || "User",
      profile: {
        subscriptionTier: "free",
        tracksUsed: 0,
        role: "user"
      }
    };
  },
});

// Get user by token identifier
export const getUserByToken = query({
  args: {
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => 
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .first();
  },
});

// Get user by token identifier
export const getUserByToken = query({
  args: {
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => 
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .first();
  },
});

// Create a new user from Clerk data
export const createUser = mutation({
  args: {
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.string(),
    pictureUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => 
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .first();
      
    if (existingUser) {
      return existingUser._id;
    }
    
    // Create new user
    return await ctx.db.insert("users", {
      tokenIdentifier: args.tokenIdentifier,
      name: args.name,
      email: args.email,
      pictureUrl: args.pictureUrl,
      lastSignIn: Date.now(),
    });
  },
});

// Update existing user data
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    pictureUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    // Update user data
    await ctx.db.patch(args.userId, {
      name: args.name,
      email: args.email,
      pictureUrl: args.pictureUrl,
      lastSignIn: Date.now(),
    });
    
    return args.userId;
  },
});

// Create user profile
export const createUserProfile = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existingProfile) return existingProfile._id;

    // Create new profile with default settings
    return await ctx.db.insert("userProfiles", {
      userId: args.userId,
      role: "user", // Default role
      subscriptionTier: "free",
      tracksUsed: 0,
    });
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => 
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
      
    if (!user) throw new Error("User not found");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, {
      firstName: args.firstName,
      lastName: args.lastName,
    });
  },
});

// Upgrade user subscription
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => 
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
      
    if (!user) throw new Error("User not found");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
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

// Get subscription limits for current user
export const getSubscriptionLimits = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => 
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
      
    if (!user) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
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

// Admin function to set user role
export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    // Check if current user is admin
    const isAdmin = await ctx.runQuery(api.auth.isAdmin);
    if (!isAdmin) throw new Error("Unauthorized: Admin access required");
    
    // Get user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
      
    if (!profile) throw new Error("User profile not found");
    
    // Update role
    await ctx.db.patch(profile._id, {
      role: args.role,
    });
    
    return { success: true };
  },
});

