import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// Simple placeholder for isAdmin function
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    
    // Get user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!user) return false;
    
    // Check if user has admin role
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
      
    return profile?.role === "admin";
  },
});

// Simple placeholder for getUser function
export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    // Return basic user info
    return {
      _id: "placeholder",
      email: identity.email,
      name: identity.name,
    };
  },
});

// Sync user data from Clerk to Convex
export const syncUser = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const { tokenIdentifier, email, name } = identity;

    // Check if user exists
    const existingUser = await ctx.runQuery(api.users.getUserByToken, { tokenIdentifier });

    if (existingUser) {
      // Update user's last sign in time
      await ctx.runMutation(api.users.updateUser, {
        userId: existingUser._id,
        lastSignIn: Date.now()
      });
    } else {
      // Create new user
      const userId = await ctx.runMutation(api.users.createUser, {
        tokenIdentifier,
        email: email || "",
        name: name || "User"
      });

      // Create user profile with free tier
      await ctx.runMutation(api.users.createUserProfile, {
        userId,
        role: "user",
        subscriptionTier: "free"
      });
    }
  },
});

// Direct login function for admin
export const adminLogin = mutation({
  args: {
    email: v.string(),
    password: v.string()
  },
  handler: async (ctx, args) => {
    // Check if email and password match admin credentials
    if (args.email === "methodman@mail.com" && args.password === "12345678") {
      // Create or update admin user
      let user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();
      
      if (!user) {
        // Create new admin user
        const userId = await ctx.db.insert("users", {
          tokenIdentifier: `admin:${args.email}`,
          email: args.email,
          name: "Admin User",
          lastSignIn: Date.now()
        });
        
        // Create admin profile
        await ctx.db.insert("userProfiles", {
          userId,
          role: "admin",
          subscriptionTier: "unlimited",
          tracksUsed: 0,
          storageUsed: 0
        });
        
        user = await ctx.db.get(userId);
      } else {
        // Update last sign in
        await ctx.db.patch(user._id, {
          lastSignIn: Date.now()
        });
        
        // Ensure user has admin profile
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .unique();
          
        if (!profile) {
          await ctx.db.insert("userProfiles", {
            userId: user._id,
            role: "admin",
            subscriptionTier: "unlimited",
            tracksUsed: 0,
            storageUsed: 0
          });
        } else if (profile.role !== "admin") {
          await ctx.db.patch(profile._id, {
            role: "admin"
          });
        }
      }
      
      return {
        success: true,
        user
      };
    }
    
    return {
      success: false,
      error: "Invalid email or password"
    };
  }
});