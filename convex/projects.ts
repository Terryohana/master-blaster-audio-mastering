import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listProjects = query({
  args: {
    status: v.optional(v.string()),
    eqPreset: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

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
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check subscription limits
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const limits = {
      free: 10,
      starter: 25,
      pro: 50,
      unlimited: 100,
    };

    if (profile.tracksUsed >= limits[profile.subscriptionTier]) {
      throw new Error("Track limit reached for your subscription tier");
    }

    const projectId = await ctx.db.insert("projects", {
      userId,
      name: args.name,
      eqPreset: args.eqPreset,
      eqSettings: args.eqSettings || null,
      compressorSettings: args.compressorSettings || null,
      status: "uploading",
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.storage.generateUploadUrl();
  },
});