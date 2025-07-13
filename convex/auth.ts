import { query } from "./_generated/server";

// Simple placeholder for isAdmin function
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    // Always return false for now until proper deployment
    return false;
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

