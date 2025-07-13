import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { SUBSCRIPTION_LIMITS } from "./subscription";

export const listProjects = query({
  args: {
    status: v.optional(v.string()),
    eqPreset: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => 
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
      
    if (!user) return [];
    
    const userId = user._id;

    let query = ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId));

    if (args.status) {
      query = ctx.db
        .query("projects")
        .withIndex("by_user_and_status", (q) => 
          q.eq("userId", userId).eq("status", args.status as any)
        );
    }

    if (args.eqPreset) {
      query = ctx.db
        .query("projects")
        .withIndex("by_user_and_preset", (q) => 
          q.eq("userId", userId).eq("eqPreset", args.eqPreset!)
        );
    }

    const projects = await query.order("desc").collect();

    return Promise.all(
      projects.map(async (project) => ({
        ...project,
        originalAudioUrl: project.originalAudioId 
          ? await ctx.storage.getUrl(project.originalAudioId) 
          : null,
        masteredAudioUrl: project.masteredAudioId 
          ? await ctx.storage.getUrl(project.masteredAudioId) 
          : null,
      }))
    );
  },
});

export const getProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => 
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
      
    if (!user) return null;
    
    const userId = user._id;

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      return null;
    }

    return {
      ...project,
      originalAudioUrl: project.originalAudioId 
        ? await ctx.storage.getUrl(project.originalAudioId) 
        : null,
      masteredAudioUrl: project.masteredAudioId 
        ? await ctx.storage.getUrl(project.masteredAudioId) 
        : null,
    };
  },
});

export const createProject = mutation({
  args: {
    name: v.string(),
    eqPreset: v.string(),
    eqSettings: v.optional(v.any()),
    compressorSettings: v.optional(v.any()),
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
    
    const userId = user._id;

    // Check if user can create a project
    const canCreate = await ctx.runQuery(api.subscription.canCreateProject);
    if (!canCreate.allowed) {
      throw new Error(canCreate.reason);
    }

    // Get user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");
    
    const now = Date.now();
    
    // Calculate expiry date for free tier
    let expiresAt = null;
    if (profile.subscriptionTier === "free") {
      expiresAt = now + (SUBSCRIPTION_LIMITS.free.expiryDays * 24 * 60 * 60 * 1000);
    }

    const projectId = await ctx.db.insert("projects", {
      userId,
      name: args.name,
      eqPreset: args.eqPreset,
      eqSettings: args.eqSettings || null,
      compressorSettings: args.compressorSettings || null,
      status: "uploading",
      createdAt: now,
      expiresAt,
    });
    
    // Update last project created timestamp
    await ctx.db.patch(profile._id, {
      lastProjectCreated: now
    });

    return projectId;
  },
});

export const updateProjectSettings = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    eqPreset: v.optional(v.string()),
    eqSettings: v.optional(v.any()),
    compressorSettings: v.optional(v.any()),
    status: v.optional(v.string()),
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
    
    const userId = user._id;

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const updates: any = {};
    if (args.name) updates.name = args.name;
    if (args.eqPreset) updates.eqPreset = args.eqPreset;
    if (args.eqSettings) updates.eqSettings = args.eqSettings;
    if (args.compressorSettings) updates.compressorSettings = args.compressorSettings;
    if (args.status) updates.status = args.status;

    await ctx.db.patch(args.projectId, updates);
  },
});

export const updateProjectAudio = mutation({
  args: {
    projectId: v.id("projects"),
    audioId: v.id("_storage"),
    duration: v.optional(v.number()),
    fileSize: v.optional(v.number()),
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
    
    const userId = user._id;

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    await ctx.db.patch(args.projectId, {
      originalAudioId: args.audioId,
      status: "queued",
      duration: args.duration,
      fileSize: args.fileSize,
    });

    // Increment tracks used
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        tracksUsed: profile.tracksUsed + 1,
      });
    }
  },
});

export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
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
    
    const userId = user._id;

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    // Delete associated files
    if (project.originalAudioId) {
      await ctx.storage.delete(project.originalAudioId);
    }
    if (project.masteredAudioId) {
      await ctx.storage.delete(project.masteredAudioId);
    }

    await ctx.db.delete(args.projectId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => 
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
      
    if (!user) throw new Error("User not found");
    
    // Check storage limits
    const subscription = await ctx.runQuery(api.subscription.getUserSubscription);
    if (!subscription) throw new Error("Subscription not found");
    
    if (subscription.storageUsed >= subscription.storageLimit) {
      throw new Error(`Storage limit reached (${Math.round(subscription.storageUsed / (1024 * 1024))}MB/${Math.round(subscription.storageLimit / (1024 * 1024))}MB)`);
    }
    
    return await ctx.storage.generateUploadUrl();
  },
});