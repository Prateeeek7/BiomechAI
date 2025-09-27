import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const analyzePosture = mutation({
  args: {
    forwardHeadAngle: v.number(),
    shoulderTilt: v.number(),
    neckAngle: v.number(),
    spineAlignment: v.number(),
    duration: v.number(),
    // Advanced OpenPose-style features
    sittingPosition: v.optional(v.string()),
    handFolding: v.optional(v.boolean()),
    kneeling: v.optional(v.boolean()),
    spineAngle: v.optional(v.number()),
    earToHipAngle: v.optional(v.number()),
    postureScore: v.optional(v.number()),
    keypointConfidence: v.optional(v.number()),
    // New fields for complete session data
    rawData: v.optional(v.string()), // JSON string of complete session data
    dataPoints: v.optional(v.number()), // Number of data points recorded
  },
  handler: async (ctx, args) => {
    // Use a default userId since authentication is removed
    const userId = "anonymous-user";

    // Enhanced posture classification with OpenPose-style features
    let classification = "good";
    const recommendations = [];

    // Advanced sitting position analysis
    if (args.sittingPosition === 'hunchback') {
      classification = "poor";
      recommendations.push("Correct hunchback posture by sitting up straight and pulling shoulders back");
    } else if (args.sittingPosition === 'reclined') {
      classification = classification === "good" ? "fair" : classification;
      recommendations.push("Adjust to a more upright sitting position");
    }

    // Hand folding analysis
    if (args.handFolding) {
      recommendations.push("Keep your arms relaxed at your sides for better posture");
    }

    // Kneeling analysis
    if (args.kneeling) {
      recommendations.push("Sit with both feet flat on the ground for proper posture");
    }

    // Traditional posture analysis with more realistic thresholds
    if (args.forwardHeadAngle > 15) {
      classification = "poor";
      recommendations.push("Reduce forward head posture by adjusting monitor height");
    } else if (args.forwardHeadAngle > 10) {
      classification = classification === "good" ? "fair" : classification;
      recommendations.push("Monitor forward head position throughout the day");
    }

    if (Math.abs(args.shoulderTilt) > 10) {
      classification = "poor";
      recommendations.push("Level your shoulders and check workspace ergonomics");
    }

    if (args.neckAngle > 15) {
      classification = classification === "good" ? "fair" : classification;
      recommendations.push("Maintain neutral neck position");
    }

    if (args.spineAlignment < 70) {
      classification = "poor";
      recommendations.push("Improve spinal alignment with back support");
    } else if (args.spineAlignment < 85) {
      classification = classification === "good" ? "fair" : classification;
      recommendations.push("Focus on maintaining good spinal alignment");
    }

    // Posture score analysis
    if (args.postureScore && args.postureScore < 60) {
      classification = "poor";
      recommendations.push("Overall posture needs significant improvement");
    } else if (args.postureScore && args.postureScore < 80) {
      classification = classification === "good" ? "fair" : classification;
      recommendations.push("Posture is acceptable but can be improved");
    }

    // Keypoint confidence analysis
    if (args.keypointConfidence && args.keypointConfidence < 70) {
      recommendations.push("Ensure good lighting and clear view for accurate posture analysis");
    }

    if (recommendations.length === 0) {
      recommendations.push("Excellent posture! Keep maintaining this good posture");
    }

    const sessionId = await ctx.db.insert("postureSessions", {
      userId,
      timestamp: Date.now(),
      forwardHeadAngle: args.forwardHeadAngle,
      shoulderTilt: args.shoulderTilt,
      neckAngle: args.neckAngle,
      spineAlignment: args.spineAlignment,
      classification,
      duration: args.duration,
      sittingPosition: args.sittingPosition,
      handFolding: args.handFolding,
      kneeling: args.kneeling,
      spineAngle: args.spineAngle,
      earToHipAngle: args.earToHipAngle,
      postureScore: args.postureScore,
      keypointConfidence: args.keypointConfidence,
      recommendations,
      rawData: args.rawData, // Store complete session data for reports
      dataPoints: args.dataPoints, // Store number of data points
    });

    return {
      sessionId,
      classification,
      recommendations,
      score: classification === "good" ? 90 : classification === "fair" ? 70 : 40,
    };
  },
});

export const getPostureHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Use a default userId since authentication is removed
    const userId = "anonymous-user";

    const sessions = await ctx.db
      .query("postureSessions")
      .withIndex("by_user_and_timestamp", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 50);

    return sessions;
  },
});

export const getPostureStats = query({
  args: {},
  handler: async (ctx) => {
    // Use a default userId since authentication is removed
    const userId = "anonymous-user";

    const sessions = await ctx.db
      .query("postureSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageScore: 0,
        goodPosturePercentage: 0,
        weeklyTrend: [],
        advancedStats: {
          sittingPositionStats: {},
          handFoldingPercentage: 0,
          kneelingPercentage: 0,
          averagePostureScore: 0,
          averageKeypointConfidence: 0,
        },
      };
    }

    const goodSessions = sessions.filter(s => s.classification === "good").length;
    const averageForwardHead = sessions.reduce((sum, s) => sum + s.forwardHeadAngle, 0) / sessions.length;
    
    // Calculate advanced statistics
    const sittingPositionStats: Record<string, number> = {};
    sessions.forEach(s => {
      if (s.sittingPosition) {
        sittingPositionStats[s.sittingPosition] = (sittingPositionStats[s.sittingPosition] || 0) + 1;
      }
    });

    const handFoldingSessions = sessions.filter(s => s.handFolding).length;
    const kneelingSessions = sessions.filter(s => s.kneeling).length;
    const sessionsWithPostureScore = sessions.filter(s => s.postureScore !== undefined);
    const sessionsWithKeypointConfidence = sessions.filter(s => s.keypointConfidence !== undefined);
    
    const averagePostureScore = sessionsWithPostureScore.length > 0 
      ? sessionsWithPostureScore.reduce((sum, s) => sum + (s.postureScore || 0), 0) / sessionsWithPostureScore.length
      : 0;
    
    const averageKeypointConfidence = sessionsWithKeypointConfidence.length > 0
      ? sessionsWithKeypointConfidence.reduce((sum, s) => sum + (s.keypointConfidence || 0), 0) / sessionsWithKeypointConfidence.length
      : 0;
    
    // Calculate weekly trend (last 7 days)
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentSessions = sessions.filter(s => s.timestamp > weekAgo);
    
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = Date.now() - i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const daySessions = recentSessions.filter(s => s.timestamp >= dayStart && s.timestamp < dayEnd);
      const dayScore = daySessions.length > 0 
        ? daySessions.filter(s => s.classification === "good").length / daySessions.length * 100
        : 0;
      weeklyTrend.push({
        date: new Date(dayStart).toLocaleDateString(),
        score: Math.round(dayScore),
      });
    }

    // Calculate improvement rate (comparing first half vs second half of sessions)
    const midPoint = Math.floor(sessions.length / 2);
    const firstHalf = sessions.slice(0, midPoint);
    const secondHalf = sessions.slice(midPoint);
    
    const firstHalfGood = firstHalf.filter(s => s.classification === "good").length;
    const secondHalfGood = secondHalf.filter(s => s.classification === "good").length;
    
    const firstHalfScore = firstHalf.length > 0 ? (firstHalfGood / firstHalf.length) * 100 : 0;
    const secondHalfScore = secondHalf.length > 0 ? (secondHalfGood / secondHalf.length) * 100 : 0;
    
    const improvementRate = firstHalf.length > 0 && secondHalf.length > 0 
      ? ((secondHalfScore - firstHalfScore) / firstHalfScore) * 100 
      : 0;

    return {
      totalSessions: sessions.length,
      averageScore: Math.round((goodSessions / sessions.length) * 100),
      goodPosturePercentage: Math.round((goodSessions / sessions.length) * 100),
      averageForwardHead: Math.round(averageForwardHead * 10) / 10,
      improvementRate: Math.round(improvementRate),
      weeklyTrend,
      advancedStats: {
        sittingPositionStats,
        handFoldingPercentage: Math.round((handFoldingSessions / sessions.length) * 100),
        kneelingPercentage: Math.round((kneelingSessions / sessions.length) * 100),
        averagePostureScore: Math.round(averagePostureScore),
        averageKeypointConfidence: Math.round(averageKeypointConfidence),
      },
    };
  },
});
