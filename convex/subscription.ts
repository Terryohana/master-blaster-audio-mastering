import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Subscription tier limits
export const SUBSCRIPTION_LIMITS = {
  free: {
    projectLimit: 1,
    storageLimit: 50 * 1024 * 1024, // 50MB
    expiryDays: 30,
    price: {
      monthly: 0,
      annual: 0
    }
  },
  starter: {
    projectLimit: 25,
    storageLimit: 1 * 1024 * 1024 * 1024, // 1GB
    expiryDays: null, // No expiry
    price: {
      monthly: 9.99,
      annual: 99.99
    }
  },
  pro: {
    projectLimit: 50,
    storageLimit: 2 * 1024 * 1024 * 1024, // 2GB
    expiryDays: null, // No expiry
    price: {
      monthly: 19.99,
      annual: 199.99
    }
  },
  unlimited: {
    projectLimit: Number.MAX_SAFE_INTEGER,
    storageLimit: 5 * 1024 * 1024 * 1024, // 5GB
    expiryDays: null, // No expiry
    price: {
      monthly: 39.99,
      annual: 399.99
    }
  }
};

// Get subscription plan details
export const getSubscriptionPlanDetails = query({
  args: {},
  handler: async () => {
    return SUBSCRIPTION_LIMITS;
  }
});

// Get current user's subscription details
export const getUserSubscription = query({
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

    // Get user's projects count
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    // Calculate total storage used
    let totalStorageUsed = 0;
    for (const project of projects) {
      if (project.fileSize) {
        totalStorageUsed += project.fileSize;
      }
    }

    const tier = profile.subscriptionTier;
    const limits = SUBSCRIPTION_LIMITS[tier];

    return {
      tier,
      projectCount: projects.length,
      projectLimit: limits.projectLimit,
      storageUsed: totalStorageUsed,
      storageLimit: limits.storageLimit,
      expiryDays: limits.expiryDays,
      subscriptionExpiry: profile.subscriptionExpiry,
      price: limits.price
    };
  }
});

// Purchase subscription
export const purchaseSubscription = mutation({
  args: {
    tier: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro"),
      v.literal("unlimited")
    ),
    billingCycle: v.union(
      v.literal("monthly"),
      v.literal("annual")
    ),
    paymentMethodId: v.optional(v.string())
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

    // Calculate expiry date based on billing cycle
    const now = Date.now();
    const expiryDate = args.billingCycle === "monthly"
      ? now + (30 * 24 * 60 * 60 * 1000) // 30 days
      : now + (365 * 24 * 60 * 60 * 1000); // 365 days

    // In a real implementation, you would process payment here
    // For now, we'll just update the subscription

    // Create subscription record
    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId: user._id,
      tier: args.tier,
      billingCycle: args.billingCycle,
      startDate: now,
      expiryDate,
      status: "active",
      paymentMethodId: args.paymentMethodId,
      price: SUBSCRIPTION_LIMITS[args.tier].price[args.billingCycle]
    });

    // Update user profile
    await ctx.db.patch(profile._id, {
      subscriptionTier: args.tier,
      subscriptionExpiry: expiryDate,
      subscriptionId
    });

    return { 
      success: true,
      subscriptionId,
      expiryDate
    };
  }
});

// Check if user can create a new project
export const canCreateProject = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { allowed: false, reason: "Not authenticated" };
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => 
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
      
    if (!user) return { allowed: false, reason: "User not found" };

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!profile) return { allowed: false, reason: "Profile not found" };

    // Get user's projects count
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    const tier = profile.subscriptionTier;
    const projectLimit = SUBSCRIPTION_LIMITS[tier].projectLimit;
    
    if (projects.length >= projectLimit) {
      return { 
        allowed: false, 
        reason: `Project limit reached (${projects.length}/${projectLimit})`,
        upgradeOptions: {
          currentTier: tier,
          recommendedTier: tier === "free" ? "starter" : 
                          tier === "starter" ? "pro" : "unlimited"
        }
      };
    }
    
    return { allowed: true };
  }
});

// Schedule project expiration for free tier
export const scheduleProjectExpiration = mutation({
  args: {
    projectId: v.id("projects")
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
    
    // Only set expiration for free tier
    if (profile.subscriptionTier === "free") {
      const now = Date.now();
      const expiryDate = now + (SUBSCRIPTION_LIMITS.free.expiryDays * 24 * 60 * 60 * 1000);
      
      await ctx.db.patch(args.projectId, {
        expiresAt: expiryDate
      });
      
      return { expiryDate };
    }
    
    return { expiryDate: null };
  }
});

// Clean up expired projects (would be called by a scheduled job)
export const cleanupExpiredProjects = action({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Find all expired projects
    const expiredProjects = await ctx.runQuery(api.subscription.getExpiredProjects);
    
    let deletedCount = 0;
    
    for (const project of expiredProjects) {
      try {
        // Delete project files from storage
        if (project.originalAudioId) {
          await ctx.runMutation(api.storage.deleteFile, {
            storageId: project.originalAudioId
          });
        }
        
        if (project.masteredAudioId) {
          await ctx.runMutation(api.storage.deleteFile, {
            storageId: project.masteredAudioId
          });
        }
        
        // Delete project record
        await ctx.runMutation(api.projects.deleteProject, {
          projectId: project._id
        });
        
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete project ${project._id}:`, error);
      }
    }
    
    return { deletedCount };
  }
});

// Get expired projects
export const getExpiredProjects = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    return await ctx.db
      .query("projects")
      .withIndex("by_expiry", (q) => q.lt("expiresAt", now))
      .collect();
  }
});