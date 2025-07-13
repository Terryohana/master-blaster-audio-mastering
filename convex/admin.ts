import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Get all users with their profiles and subscription info
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    // Check if current user is admin
    const isAdmin = await ctx.runQuery(api.auth.isAdmin);
    if (!isAdmin) throw new Error("Unauthorized: Admin access required");
    
    const users = await ctx.db.query("users").collect();
    
    const usersWithDetails = await Promise.all(users.map(async (user) => {
      // Get user profile
      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();
      
      // Get subscription if exists
      let subscription = null;
      if (profile?.subscriptionId) {
        subscription = await ctx.db.get(profile.subscriptionId);
      }
      
      // Get projects count
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      
      // Calculate storage used
      let storageUsed = 0;
      for (const project of projects) {
        if (project.fileSize) {
          storageUsed += project.fileSize;
        }
      }
      
      return {
        ...user,
        profile,
        subscription,
        projectsCount: projects.length,
        storageUsed
      };
    }));
    
    return usersWithDetails;
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
    billingCycle: v.optional(v.union(
      v.literal("monthly"),
      v.literal("annual")
    )),
    expiryDays: v.optional(v.number())
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
    
    const now = Date.now();
    let expiryDate = null;
    
    if (args.expiryDays) {
      expiryDate = now + (args.expiryDays * 24 * 60 * 60 * 1000);
    } else if (args.billingCycle) {
      expiryDate = args.billingCycle === "monthly"
        ? now + (30 * 24 * 60 * 60 * 1000) // 30 days
        : now + (365 * 24 * 60 * 60 * 1000); // 365 days
    }
    
    // Create or update subscription
    let subscriptionId = profile.subscriptionId;
    
    if (args.tier !== "free" && args.billingCycle) {
      // If changing to a paid tier, create/update subscription record
      const tierLimits = await ctx.runQuery(api.subscription.getSubscriptionPlanDetails);
      const price = tierLimits[args.tier].price[args.billingCycle];
      
      if (subscriptionId) {
        // Update existing subscription
        await ctx.db.patch(subscriptionId, {
          tier: args.tier,
          billingCycle: args.billingCycle,
          expiryDate,
          status: "active",
          price
        });
      } else {
        // Create new subscription
        subscriptionId = await ctx.db.insert("subscriptions", {
          userId: args.userId,
          tier: args.tier,
          billingCycle: args.billingCycle,
          startDate: now,
          expiryDate,
          status: "active",
          price
        });
      }
    } else if (args.tier === "free" && subscriptionId) {
      // If downgrading to free, cancel subscription
      await ctx.db.patch(subscriptionId, {
        status: "canceled",
        canceledDate: now
      });
      subscriptionId = null;
    }
    
    // Update user profile
    await ctx.db.patch(profile._id, {
      subscriptionTier: args.tier,
      subscriptionExpiry: expiryDate,
      subscriptionId
    });
    
    return { success: true };
  }
});

// Get subscription statistics
export const getSubscriptionStats = query({
  args: {},
  handler: async (ctx) => {
    // Check if current user is admin
    const isAdmin = await ctx.runQuery(api.auth.isAdmin);
    if (!isAdmin) throw new Error("Unauthorized: Admin access required");
    
    const profiles = await ctx.db.query("userProfiles").collect();
    
    // Count users by subscription tier
    const tierCounts = {
      free: 0,
      starter: 0,
      pro: 0,
      unlimited: 0
    };
    
    for (const profile of profiles) {
      tierCounts[profile.subscriptionTier]++;
    }
    
    // Get active subscriptions
    const activeSubscriptions = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    // Calculate revenue
    let monthlyRevenue = 0;
    let annualRevenue = 0;
    
    for (const sub of activeSubscriptions) {
      if (sub.billingCycle === "monthly") {
        monthlyRevenue += sub.price;
      } else {
        // Divide annual by 12 to get monthly equivalent
        monthlyRevenue += sub.price / 12;
        annualRevenue += sub.price;
      }
    }
    
    // Get project counts
    const projects = await ctx.db.query("projects").collect();
    const totalProjects = projects.length;
    
    // Calculate total storage used
    let totalStorageUsed = 0;
    for (const project of projects) {
      if (project.fileSize) {
        totalStorageUsed += project.fileSize;
      }
    }
    
    return {
      userCounts: tierCounts,
      totalUsers: profiles.length,
      totalProjects,
      activeSubscriptions: activeSubscriptions.length,
      monthlyRevenue,
      annualRevenue,
      projectedAnnualRevenue: monthlyRevenue * 12,
      totalStorageUsed: Math.round(totalStorageUsed / (1024 * 1024)) + " MB"
    };
  },
});

// Get system stats (admin only) - legacy version
export const getSystemStats = query({
  args: {},
  handler: async (ctx) => {
    return ctx.runQuery(api.admin.getSubscriptionStats);
  },
});

// Delete user and all their data
export const deleteUser = mutation({
  args: {
    userId: v.id("users")
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
    
    // Get user projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Delete all storage files
    for (const project of projects) {
      if (project.originalAudioId) {
        await ctx.storage.delete(project.originalAudioId);
      }
      if (project.masteredAudioId) {
        await ctx.storage.delete(project.masteredAudioId);
      }
    }
    
    // Delete all projects
    for (const project of projects) {
      await ctx.db.delete(project._id);
    }
    
    // Delete subscription if exists
    if (profile?.subscriptionId) {
      await ctx.db.delete(profile.subscriptionId);
    }
    
    // Delete profile
    if (profile) {
      await ctx.db.delete(profile._id);
    }
    
    // Delete user
    await ctx.db.delete(args.userId);
    
    return { success: true };
  }
});

// Delete all user data (dangerous operation)
export const deleteAllUserData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if current user is admin
    const isAdmin = await ctx.runQuery(api.auth.isAdmin);
    if (!isAdmin) throw new Error("Unauthorized: Admin access required");
    
    // Get all projects
    const projects = await ctx.db.query("projects").collect();
    
    // Delete all storage files
    for (const project of projects) {
      if (project.originalAudioId) {
        await ctx.storage.delete(project.originalAudioId);
      }
      if (project.masteredAudioId) {
        await ctx.storage.delete(project.masteredAudioId);
      }
    }
    
    // Delete all projects
    for (const project of projects) {
      await ctx.db.delete(project._id);
    }
    
    // Delete all subscriptions
    const subscriptions = await ctx.db.query("subscriptions").collect();
    for (const subscription of subscriptions) {
      await ctx.db.delete(subscription._id);
    }
    
    // Delete all user profiles
    const profiles = await ctx.db.query("userProfiles").collect();
    for (const profile of profiles) {
      await ctx.db.delete(profile._id);
    }
    
    return { success: true };
  },
});

// Create admin user
export const createAdminUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
      
    if (existingUser) {
      // If user exists, make them admin
      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", existingUser._id))
        .unique();
        
      if (profile) {
        await ctx.db.patch(profile._id, {
          role: "admin"
        });
        
        return { 
          success: true, 
          message: "User already exists. Updated to admin role.",
          userId: existingUser._id
        };
      }
    }
    
    // Create new user
    // In a real implementation, you would hash the password
    // For demo purposes, we're storing it directly (NOT SECURE)
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: `password:${args.email}`,
      email: args.email,
      name: args.name || "Admin User",
      lastSignIn: Date.now()
    });
    
    // Create user profile with admin role
    await ctx.db.insert("userProfiles", {
      userId,
      role: "admin",
      subscriptionTier: "unlimited",
      tracksUsed: 0,
      storageUsed: 0
    });
    
    return { 
      success: true, 
      message: "Admin user created successfully",
      userId
    };
  }
});