import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// This function deletes all user data from the database
// CAUTION: This is a destructive operation and cannot be undone
export const deleteAllUserData = mutation({
  args: {},
  handler: async (ctx) => {
    // Verify the user is authenticated
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Get all projects
    const projects = await ctx.db.query("projects").collect();
    
    // Delete all audio files from storage
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
    
    // Reset user profiles track counts
    const profiles = await ctx.db.query("userProfiles").collect();
    for (const profile of profiles) {
      await ctx.db.patch(profile._id, { tracksUsed: 0 });
    }
    
    return { success: true, message: "All user data has been deleted" };
  },
});