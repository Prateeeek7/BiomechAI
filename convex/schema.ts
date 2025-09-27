import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const applicationTables = {
  postureSessions: defineTable({
    userId: v.string(),
    timestamp: v.number(),
    forwardHeadAngle: v.number(),
    shoulderTilt: v.number(),
    neckAngle: v.number(),
    spineAlignment: v.number(),
    classification: v.string(), // "good", "fair", "poor"
    duration: v.number(), // session duration in seconds
    // Advanced OpenPose-style features
    sittingPosition: v.optional(v.string()), // "straight", "hunchback", "reclined", "unknown"
    handFolding: v.optional(v.boolean()),
    kneeling: v.optional(v.boolean()),
    spineAngle: v.optional(v.number()),
    earToHipAngle: v.optional(v.number()),
    postureScore: v.optional(v.number()), // 0-100
    keypointConfidence: v.optional(v.number()), // 0-100
    recommendations: v.array(v.string()),
    // New fields for complete session data
    rawData: v.optional(v.string()), // JSON string of complete session data
    dataPoints: v.optional(v.number()), // Number of data points recorded
  }).index("by_user", ["userId"])
    .index("by_user_and_timestamp", ["userId", "timestamp"])
    .index("by_user_and_position", ["userId", "sittingPosition"]),

  gaitSessions: defineTable({
    userId: v.string(),
    timestamp: v.number(),
    stepCount: v.number(),
    symmetryScore: v.number(), // 0-100
    cadence: v.number(), // steps per minute
    strideLength: v.optional(v.number()),
    gaitSpeed: v.optional(v.number()),
    leftRightBalance: v.number(), // percentage
    classification: v.string(), // "normal", "asymmetric", "irregular"
    analysisType: v.string(), // "motion", "csv", "esp32"
    rawDataPath: v.optional(v.string()),
    // ESP32-specific metrics
    stancePhase: v.optional(v.number()),
    swingPhase: v.optional(v.number()),
    doubleSupportPhase: v.optional(v.number()),
    heelStrikeForce: v.optional(v.number()),
    toeOffForce: v.optional(v.number()),
    recommendations: v.array(v.string()),
  }).index("by_user", ["userId"])
    .index("by_user_and_timestamp", ["userId", "timestamp"])
    .index("by_user_and_type", ["userId", "analysisType"]),

  reports: defineTable({
    userId: v.string(),
    sessionIds: v.array(v.string()),
    type: v.string(), // "posture", "gait", "combined"
    title: v.string(),
    summary: v.string(),
    recommendations: v.array(v.string()),
    pdfStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_and_created", ["userId", "createdAt"]),

  userProfiles: defineTable({
    userId: v.string(),
    height: v.optional(v.number()), // in cm
    weight: v.optional(v.number()), // in kg
    age: v.optional(v.number()),
    activityLevel: v.optional(v.string()), // "sedentary", "moderate", "active"
    medicalConditions: v.optional(v.array(v.string())),
    goals: v.optional(v.array(v.string())),
    preferences: v.object({
      darkMode: v.boolean(),
      notifications: v.boolean(),
      units: v.string(), // "metric", "imperial"
    }),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...applicationTables,
});
