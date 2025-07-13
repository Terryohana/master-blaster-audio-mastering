import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Check if user has access to a specific project
export const hasProjectAccess = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    
    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => 
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
      
    if (!user) return false;
    
    // Check if user is admin
    const isAdmin = await ctx.runQuery(api.auth.isAdmin);
    if (isAdmin) return true;
    
    // Check if project belongs to user
    const project = await ctx.db.get(args.projectId);
    if (!project) return false;
    
    return project.userId === user._id;
  },
});

// Get all projects accessible to the user
export const getAccessibleProjects = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => 
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
      
    if (!user) return [];
    
    // Check if user is admin
    const isAdmin = await ctx.runQuery(api.auth.isAdmin);
    
    if (isAdmin) {
      // Admins can see all projects
      return await ctx.db.query("projects").collect();
    } else {
      // Regular users can only see their own projects
      return await ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
    }
  },
});

// Enforce access control on project mutation
export const validateProjectAccess = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const hasAccess = await ctx.runQuery(api.access.hasProjectAccess, {
      projectId: args.projectId,
    });
    
    if (!hasAccess) {
      throw new Error("Unauthorized: You don't have access to this project");
    }
    
    return true;
  },
});