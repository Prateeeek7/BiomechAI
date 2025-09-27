import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    // Use a default userId since authentication is removed
    const userId = "anonymous-user";

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return profile;
  },
});

export const updateUserProfile = mutation({
  args: {
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
    age: v.optional(v.number()),
    activityLevel: v.optional(v.string()),
    medicalConditions: v.optional(v.array(v.string())),
    goals: v.optional(v.array(v.string())),
    preferences: v.optional(v.object({
      darkMode: v.boolean(),
      notifications: v.boolean(),
      units: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // Use a default userId since authentication is removed
    const userId = "anonymous-user";

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        ...args,
      });
      return existingProfile._id;
    } else {
      const profileId = await ctx.db.insert("userProfiles", {
        userId,
        height: args.height,
        weight: args.weight,
        age: args.age,
        activityLevel: args.activityLevel,
        medicalConditions: args.medicalConditions,
        goals: args.goals,
        preferences: args.preferences || {
          darkMode: false,
          notifications: true,
          units: "metric",
        },
      });
      return profileId;
    }
  },
});

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    // Use a default userId since authentication is removed
    const userId = "anonymous-user";

    const postureSessions = await ctx.db
      .query("postureSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const gaitSessions = await ctx.db
      .query("gaitSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Calculate recent activity (last 7 days)
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentPosture = postureSessions.filter(s => s.timestamp > weekAgo);
    const recentGait = gaitSessions.filter(s => s.timestamp > weekAgo);

    return {
      totalSessions: postureSessions.length + gaitSessions.length,
      totalPostureSessions: postureSessions.length,
      totalGaitSessions: gaitSessions.length,
      totalReports: reports.length,
      activeUsers: 1, // For now, just the current user
      recentPostureSessions: recentPosture.length,
      recentGaitSessions: recentGait.length,
      lastActivity: Math.max(
        postureSessions.length > 0 ? Math.max(...postureSessions.map(s => s.timestamp)) : 0,
        gaitSessions.length > 0 ? Math.max(...gaitSessions.map(s => s.timestamp)) : 0
      ),
    };
  },
});
