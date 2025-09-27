import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const analyzeGait = mutation({
  args: {
    stepCount: v.number(),
    symmetryScore: v.number(),
    cadence: v.number(),
    strideLength: v.optional(v.number()),
    gaitSpeed: v.optional(v.number()),
    leftRightBalance: v.number(),
    analysisType: v.string(),
    rawDataPath: v.optional(v.string()),
    stancePhase: v.optional(v.number()),
    swingPhase: v.optional(v.number()),
    doubleSupportPhase: v.optional(v.number()),
    heelStrikeForce: v.optional(v.number()),
    toeOffForce: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Use a default userId since authentication is removed
    const userId = "anonymous-user";

    // Enhanced gait classification based on ESP32 metrics
    let classification = "normal";
    const recommendations = [];

    // Symmetry analysis
    if (args.symmetryScore < 70) {
      classification = "asymmetric";
      recommendations.push("Significant gait asymmetry detected - consider consulting a healthcare professional");
    } else if (args.symmetryScore < 85) {
      classification = "irregular";
      recommendations.push("Minor gait irregularities detected - focus on balanced movement");
    }

    // Balance analysis
    if (Math.abs(args.leftRightBalance - 50) > 15) {
      classification = classification === "normal" ? "irregular" : classification;
      recommendations.push("Uneven weight distribution between left and right steps");
    }

    // Cadence analysis
    if (args.cadence < 100 || args.cadence > 180) {
      recommendations.push("Cadence outside normal range - aim for 120-160 steps per minute");
    }

    // Advanced ESP32-specific analysis
    if (args.analysisType === 'esp32') {
      // Stance phase analysis
      if (args.stancePhase && (args.stancePhase < 55 || args.stancePhase > 70)) {
        recommendations.push("Abnormal stance phase duration - may indicate balance issues");
      }

      // Swing phase analysis
      if (args.swingPhase && (args.swingPhase < 25 || args.swingPhase > 40)) {
        recommendations.push("Abnormal swing phase duration - may indicate mobility limitations");
      }

      // Force analysis
      if (args.heelStrikeForce && args.toeOffForce) {
        const forceRatio = args.heelStrikeForce / args.toeOffForce;
        if (forceRatio < 0.8 || forceRatio > 1.2) {
          recommendations.push("Uneven ground reaction forces - consider gait training");
        }
      }

      // Speed analysis
      if (args.gaitSpeed && args.gaitSpeed < 0.8) {
        recommendations.push("Slow gait speed - consider increasing walking pace gradually");
      }
    }

    if (recommendations.length === 0) {
      recommendations.push("Normal gait pattern detected!");
    }

    const sessionId = await ctx.db.insert("gaitSessions", {
      userId,
      timestamp: Date.now(),
      stepCount: args.stepCount,
      symmetryScore: args.symmetryScore,
      cadence: args.cadence,
      strideLength: args.strideLength,
      gaitSpeed: args.gaitSpeed,
      leftRightBalance: args.leftRightBalance,
      classification,
      analysisType: args.analysisType,
      rawDataPath: args.rawDataPath,
      stancePhase: args.stancePhase,
      swingPhase: args.swingPhase,
      doubleSupportPhase: args.doubleSupportPhase,
      heelStrikeForce: args.heelStrikeForce,
      toeOffForce: args.toeOffForce,
      recommendations,
    });

    return {
      sessionId,
      classification,
      recommendations,
      score: args.symmetryScore,
    };
  },
});

export const getGaitHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Use a default userId since authentication is removed
    const userId = "anonymous-user";

    const sessions = await ctx.db
      .query("gaitSessions")
      .withIndex("by_user_and_timestamp", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 50);

    return sessions;
  },
});

export const getGaitStats = query({
  args: {},
  handler: async (ctx) => {
    // Use a default userId since authentication is removed
    const userId = "anonymous-user";

    const sessions = await ctx.db
      .query("gaitSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageSymmetry: 0,
        averageCadence: 0,
        normalGaitPercentage: 0,
        weeklyTrend: [],
      };
    }

    const normalSessions = sessions.filter(s => s.classification === "normal").length;
    const averageSymmetry = sessions.reduce((sum, s) => sum + s.symmetryScore, 0) / sessions.length;
    const averageCadence = sessions.reduce((sum, s) => sum + s.cadence, 0) / sessions.length;
    
    // Calculate weekly trend
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentSessions = sessions.filter(s => s.timestamp > weekAgo);
    
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = Date.now() - i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const daySessions = recentSessions.filter(s => s.timestamp >= dayStart && s.timestamp < dayEnd);
      const daySymmetry = daySessions.length > 0 
        ? daySessions.reduce((sum, s) => sum + s.symmetryScore, 0) / daySessions.length
        : 0;
      weeklyTrend.push({
        date: new Date(dayStart).toLocaleDateString(),
        symmetry: Math.round(daySymmetry),
      });
    }

    return {
      totalSessions: sessions.length,
      averageSymmetry: Math.round(averageSymmetry),
      averageCadence: Math.round(averageCadence),
      normalGaitPercentage: Math.round((normalSessions / sessions.length) * 100),
      weeklyTrend,
    };
  },
});
