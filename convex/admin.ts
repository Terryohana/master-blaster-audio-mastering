import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Get all users (admin only)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    // Check if current user is admin
    const isAdmin = await ctx.runQuery(api.auth.isAdmin);
    if (!isAdmin) throw new Error("Unauthorized: Admin access required");
    
    // Get all users with their profiles
    const users = await ctx.db.query("users").collect();
    
    // Get profiles for each user
    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .unique();
          
        return {
          ...user,
          profile: profile || null,
        };
      })
    );
    
    return usersWithProfiles;
  },
});

// Update user role (admin only)
export const updateUserRole = mutation({
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

// Update user subscription (admin only)
export const updateUserSubscription = mutation({
  args: {
    userId: v.id("users"),
    tier: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro"),
      v.literal("unlimited")
    ),
    expiryDays: v.optional(v.number()),
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
    
    // Calculate expiry date if provided
    const subscriptionExpiry = args.expiryDays
      ? Date.now() + (args.expiryDays * 24 * 60 * 60 * 1000)
      : undefined;
    
    // Update subscription
    await ctx.db.patch(profile._id, {
      subscriptionTier: args.tier,
      subscriptionExpiry,
    });
    
    return { success: true };
  },
});

// Get system stats (admin only)
export const getSystemStats = query({
  args: {},
  handler: async (ctx) => {
    // Check if current user is admin
    const isAdmin = await ctx.runQuery(api.auth.isAdmin);
    if (!isAdmin) throw new Error("Unauthorized: Admin access required");
    
    // Get user counts
    const totalUsers = (await ctx.db.query("users").collect()).length;
    
    // Get subscription counts
    const profiles = await ctx.db.query("userProfiles").collect();
    const subscriptionCounts = profiles.reduce((acc, profile) => {
      acc[profile.subscriptionTier] = (acc[profile.subscriptionTier] || 0) + 1;
      return acc;
    }, {});
    
    // Get project counts
    const projects = await ctx.db.query("projects").collect();
    const totalProjects = projects.length;
    
    return {
      totalUsers,
      subscriptionCounts,
      totalProjects,
    };
  },
});