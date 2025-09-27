import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const generateReport = mutation({
  args: {
    sessionIds: v.array(v.string()),
    type: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    // Use a default userId since authentication is removed
    const userId = "anonymous-user";

    let summary = "";
    const recommendations = [];

    if (args.type === "posture" || args.type === "combined") {
      const postureSessions = await ctx.db
        .query("postureSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      
      // Filter out sessions with unrealistic values (forward head angle > 30° is physically impossible)
      const validSessions = postureSessions.filter(s => s.forwardHeadAngle <= 30);
      const recentSessions = validSessions.slice(-10);
      
      if (recentSessions.length > 0) {
        // Calculate comprehensive posture metrics
        const goodSessions = recentSessions.filter(s => s.classification === "good").length;
        const fairSessions = recentSessions.filter(s => s.classification === "fair").length;
        const poorSessions = recentSessions.filter(s => s.classification === "poor").length;
        
        // Postural Alignment Analysis
        const avgForwardHead = recentSessions.reduce((sum, s) => sum + s.forwardHeadAngle, 0) / recentSessions.length;
        const avgShoulderTilt = recentSessions.reduce((sum, s) => sum + Math.abs(s.shoulderTilt), 0) / recentSessions.length;
        const avgSpineAlignment = recentSessions.reduce((sum, s) => sum + s.spineAlignment, 0) / recentSessions.length;
        const avgPostureScore = recentSessions.reduce((sum, s) => sum + (s.postureScore || 0), 0) / recentSessions.length;
        
        // Sitting Position Analysis
        const sittingPositions = recentSessions.reduce((acc, s) => {
          acc[s.sittingPosition || 'unknown'] = (acc[s.sittingPosition || 'unknown'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const dominantSittingPosition = Object.entries(sittingPositions)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';
        
        // Behavioral Patterns Analysis
        const handFoldingSessions = recentSessions.filter(s => s.handFolding).length;
        const kneelingSessions = recentSessions.filter(s => s.kneeling).length;
        const avgKeypointConfidence = recentSessions.reduce((sum, s) => sum + (s.keypointConfidence || 0), 0) / recentSessions.length;
        
        // Posture Quality Trends
        const firstHalf = recentSessions.slice(0, Math.floor(recentSessions.length / 2));
        const secondHalf = recentSessions.slice(Math.floor(recentSessions.length / 2));
        const firstHalfAvgScore = firstHalf.reduce((sum, s) => sum + (s.postureScore || 0), 0) / firstHalf.length;
        const secondHalfAvgScore = secondHalf.reduce((sum, s) => sum + (s.postureScore || 0), 0) / secondHalf.length;
        const improvementTrend = secondHalfAvgScore - firstHalfAvgScore;
        
        // Comprehensive Summary
        summary += `\n=== COMPREHENSIVE POSTURE ANALYSIS ===\n\n`;
        summary += `OVERALL PERFORMANCE:\n`;
        summary += `• Posture Quality: ${goodSessions} good, ${fairSessions} fair, ${poorSessions} poor sessions\n`;
        summary += `• Overall Posture Score: ${avgPostureScore.toFixed(1)}/100\n`;
        summary += `• Trend: ${improvementTrend > 0 ? 'Improving' : improvementTrend < 0 ? 'Declining' : 'Stable'} (${improvementTrend > 0 ? '+' : ''}${improvementTrend.toFixed(1)} points)\n\n`;
        
        summary += `POSTURAL ALIGNMENT:\n`;
        summary += `• Forward Head Posture: ${avgForwardHead.toFixed(1)}° (Normal: 0-10°, Concerning: >15°)\n`;
        summary += `• Shoulder Tilt: ${avgShoulderTilt.toFixed(1)}% (Normal: 0-5%, Concerning: >10%)\n`;
        summary += `• Spinal Alignment: ${avgSpineAlignment.toFixed(1)}% (Excellent: >90%, Good: 80-90%, Poor: <80%)\n\n`;
        
        summary += `SITTING BEHAVIORS:\n`;
        summary += `• Dominant Position: ${dominantSittingPosition} (${sittingPositions[dominantSittingPosition]} sessions)\n`;
        summary += `• Hand Folding: ${handFoldingSessions}/${recentSessions.length} sessions (${((handFoldingSessions/recentSessions.length)*100).toFixed(1)}%)\n`;
        summary += `• Kneeling: ${kneelingSessions}/${recentSessions.length} sessions (${((kneelingSessions/recentSessions.length)*100).toFixed(1)}%)\n\n`;
        
        summary += `DATA QUALITY:\n`;
        summary += `• Measurement Confidence: ${avgKeypointConfidence.toFixed(1)}% (Higher = more reliable)\n`;
        summary += `• Sessions Analyzed: ${recentSessions.length} recent sessions\n\n`;
        
        // Health Risk Assessment
        summary += `HEALTH RISK ASSESSMENT:\n`;
        let riskLevel = "LOW";
        let riskFactors = [];
        
        if (avgForwardHead > 15) {
          riskFactors.push("High forward head posture");
          riskLevel = "HIGH";
        } else if (avgForwardHead > 10) {
          riskFactors.push("Moderate forward head posture");
          riskLevel = riskLevel === "LOW" ? "MODERATE" : riskLevel;
        }
        
        if (avgShoulderTilt > 10) {
          riskFactors.push("Significant shoulder imbalance");
          riskLevel = "HIGH";
        } else if (avgShoulderTilt > 5) {
          riskFactors.push("Minor shoulder imbalance");
          riskLevel = riskLevel === "LOW" ? "MODERATE" : riskLevel;
        }
        
        if (avgSpineAlignment < 70) {
          riskFactors.push("Poor spinal alignment");
          riskLevel = "HIGH";
        } else if (avgSpineAlignment < 80) {
          riskFactors.push("Suboptimal spinal alignment");
          riskLevel = riskLevel === "LOW" ? "MODERATE" : riskLevel;
        }
        
        if (dominantSittingPosition === 'hunchback') {
          riskFactors.push("Frequent hunchback posture");
          riskLevel = riskLevel === "LOW" ? "MODERATE" : riskLevel;
        }
        
        summary += `• Risk Level: ${riskLevel}\n`;
        if (riskFactors.length > 0) {
          summary += `• Risk Factors: ${riskFactors.join(', ')}\n`;
        } else {
          summary += `• Risk Factors: None identified\n`;
        }
        
        // Detailed Recommendations based on analysis
        if (avgForwardHead > 15) {
          recommendations.push("URGENT: Reduce forward head posture - adjust monitor height to eye level, use ergonomic workstation setup");
        } else if (avgForwardHead > 10) {
          recommendations.push("Monitor forward head position throughout the day - set hourly posture reminders");
        }
        
        if (avgShoulderTilt > 10) {
          recommendations.push("Address shoulder imbalance - check desk height, keyboard position, and consider shoulder strengthening exercises");
        }
        
        if (avgSpineAlignment < 80) {
          recommendations.push("Improve spinal alignment - use lumbar support, practice spine-strengthening exercises, maintain neutral spine during work");
        }
        
        if (dominantSittingPosition === 'hunchback') {
          recommendations.push("Correct hunchback posture - practice chest opening stretches, strengthen upper back muscles, maintain upright sitting");
        }
        
        if (handFoldingSessions > recentSessions.length * 0.5) {
          recommendations.push("Reduce hand folding habit - keep arms relaxed at sides, use proper keyboard positioning");
        }
        
        if (kneelingSessions > recentSessions.length * 0.3) {
          recommendations.push("Avoid kneeling while sitting - maintain both feet flat on ground for proper posture support");
        }
        
        if (avgPostureScore < 70) {
          recommendations.push("Overall posture improvement needed - consider ergonomic assessment, posture training, and regular movement breaks");
        } else if (avgPostureScore > 85) {
          recommendations.push("Excellent posture maintenance - continue current practices and consider advanced ergonomic optimizations");
        }
        
        if (improvementTrend < -5) {
          recommendations.push("Posture declining - review recent changes in workstation or habits, consider professional ergonomic consultation");
        } else if (improvementTrend > 5) {
          recommendations.push("Great improvement trend - maintain current practices and continue monitoring progress");
        }
        
        if (avgKeypointConfidence < 70) {
          recommendations.push("Improve measurement accuracy - ensure good lighting and clear camera view for more reliable posture analysis");
        }
      } else {
        summary += `No valid posture sessions available for analysis. Please record new sessions with proper camera positioning.`;
      }
    }

    if (args.type === "gait" || args.type === "combined") {
      const gaitSessions = await ctx.db
        .query("gaitSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      
      const recentSessions = gaitSessions.slice(-10);
      
      if (recentSessions.length > 0) {
        // Calculate comprehensive gait metrics
        const normalSessions = recentSessions.filter(s => s.classification === "normal").length;
        const asymmetricSessions = recentSessions.filter(s => s.classification === "asymmetric").length;
        const irregularSessions = recentSessions.filter(s => s.classification === "irregular").length;
        
        // Gait Quality Analysis
        const avgSymmetry = recentSessions.reduce((sum, s) => sum + s.symmetryScore, 0) / recentSessions.length;
        const avgCadence = recentSessions.reduce((sum, s) => sum + s.cadence, 0) / recentSessions.length;
        const avgStrideLength = recentSessions.filter(s => s.strideLength).reduce((sum, s) => sum + s.strideLength!, 0) / recentSessions.filter(s => s.strideLength).length;
        const avgLeftRightBalance = recentSessions.reduce((sum, s) => sum + s.leftRightBalance, 0) / recentSessions.length;
        
        // ESP32-Specific Analysis
        const esp32Sessions = recentSessions.filter(s => s.analysisType === 'esp32-wifi');
        const avgStancePhase = esp32Sessions.filter(s => s.stancePhase).reduce((sum, s) => sum + s.stancePhase!, 0) / esp32Sessions.filter(s => s.stancePhase).length;
        const avgSwingPhase = esp32Sessions.filter(s => s.swingPhase).reduce((sum, s) => sum + s.swingPhase!, 0) / esp32Sessions.filter(s => s.swingPhase).length;
        
        // Gait Pattern Trends
        const firstHalf = recentSessions.slice(0, Math.floor(recentSessions.length / 2));
        const secondHalf = recentSessions.slice(Math.floor(recentSessions.length / 2));
        const firstHalfSymmetry = firstHalf.reduce((sum, s) => sum + s.symmetryScore, 0) / firstHalf.length;
        const secondHalfSymmetry = secondHalf.reduce((sum, s) => sum + s.symmetryScore, 0) / secondHalf.length;
        const symmetryImprovement = secondHalfSymmetry - firstHalfSymmetry;
        
        summary += `\n=== COMPREHENSIVE GAIT ANALYSIS ===\n\n`;
        summary += `GAIT QUALITY ASSESSMENT:\n`;
        summary += `• Gait Classification: ${normalSessions} normal, ${asymmetricSessions} asymmetric, ${irregularSessions} irregular\n`;
        summary += `• Overall Symmetry: ${avgSymmetry.toFixed(1)}% (Excellent: >90%, Good: 80-90%, Poor: <80%)\n`;
        summary += `• Trend: ${symmetryImprovement > 0 ? 'Improving' : symmetryImprovement < 0 ? 'Declining' : 'Stable'} (${symmetryImprovement > 0 ? '+' : ''}${symmetryImprovement.toFixed(1)}%)\n\n`;
        
        summary += `GAIT MECHANICS:\n`;
        summary += `• Cadence: ${avgCadence.toFixed(1)} steps/min (Normal: 110-130, Optimal: 115-125)\n`;
        summary += `• Stride Length: ${avgStrideLength ? avgStrideLength.toFixed(1) + 'm' : 'Not available'}\n`;
        summary += `• Left-Right Balance: ${avgLeftRightBalance.toFixed(1)}% (Optimal: 50%, Acceptable: 45-55%)\n\n`;
        
        if (esp32Sessions.length > 0) {
          summary += `ESP32 SENSOR ANALYSIS:\n`;
          summary += `• Stance Phase: ${avgStancePhase ? avgStancePhase.toFixed(1) + '%' : 'Not available'} (Normal: 60-62%)\n`;
          summary += `• Swing Phase: ${avgSwingPhase ? avgSwingPhase.toFixed(1) + '%' : 'Not available'} (Normal: 38-40%)\n`;
          summary += `• Sensor Sessions: ${esp32Sessions.length}/${recentSessions.length} sessions\n\n`;
        }
        
        // Gait Risk Assessment
        summary += `GAIT RISK ASSESSMENT:\n`;
        let gaitRiskLevel = "LOW";
        let gaitRiskFactors = [];
        
        if (avgSymmetry < 70) {
          gaitRiskFactors.push("Poor gait symmetry");
          gaitRiskLevel = "HIGH";
        } else if (avgSymmetry < 80) {
          gaitRiskFactors.push("Moderate gait asymmetry");
          gaitRiskLevel = gaitRiskLevel === "LOW" ? "MODERATE" : gaitRiskLevel;
        }
        
        if (Math.abs(avgLeftRightBalance - 50) > 10) {
          gaitRiskFactors.push("Significant left-right imbalance");
          gaitRiskLevel = "HIGH";
        } else if (Math.abs(avgLeftRightBalance - 50) > 5) {
          gaitRiskFactors.push("Minor left-right imbalance");
          gaitRiskLevel = gaitRiskLevel === "LOW" ? "MODERATE" : gaitRiskLevel;
        }
        
        if (avgCadence < 100 || avgCadence > 140) {
          gaitRiskFactors.push("Abnormal cadence pattern");
          gaitRiskLevel = gaitRiskLevel === "LOW" ? "MODERATE" : gaitRiskLevel;
        }
        
        summary += `• Risk Level: ${gaitRiskLevel}\n`;
        if (gaitRiskFactors.length > 0) {
          summary += `• Risk Factors: ${gaitRiskFactors.join(', ')}\n`;
        } else {
          summary += `• Risk Factors: None identified\n`;
        }
        
        // Gait-specific recommendations
        if (avgSymmetry < 70) {
          recommendations.push("URGENT: Poor gait symmetry detected - consider physical therapy consultation and gait training exercises");
        } else if (avgSymmetry < 80) {
          recommendations.push("Improve gait symmetry - practice balance exercises, single-leg stands, and walking drills");
        }
        
        if (Math.abs(avgLeftRightBalance - 50) > 10) {
          recommendations.push("Address left-right imbalance - focus on bilateral strengthening exercises and gait symmetry training");
        }
        
        if (avgCadence < 100) {
          recommendations.push("Increase walking pace - practice walking with metronome at 110-120 BPM for improved cadence");
        } else if (avgCadence > 140) {
          recommendations.push("Reduce walking pace - focus on longer strides rather than faster steps for better efficiency");
        }
        
        if (asymmetricSessions > normalSessions) {
          recommendations.push("Frequent asymmetric gait patterns - consider biomechanical assessment and corrective exercises");
        }
        
        if (irregularSessions > normalSessions * 0.5) {
          recommendations.push("Address irregular gait patterns - practice consistent walking rhythm and consider balance training");
        }
        
        if (symmetryImprovement < -5) {
          recommendations.push("Gait quality declining - review recent changes in activity or footwear, consider professional assessment");
        } else if (symmetryImprovement > 5) {
          recommendations.push("Excellent gait improvement - maintain current training and continue monitoring progress");
        }
      } else {
        summary += `No gait sessions available for analysis. Please record gait data using ESP32 sensors.`;
      }
    }

    if (recommendations.length === 0) {
      recommendations.push("Continue maintaining good biomechanical patterns");
    }

    // Add comprehensive summary and next steps
    summary += `\n=== EXECUTIVE SUMMARY ===\n\n`;
    summary += `REPORT OVERVIEW:\n`;
    summary += `• Report Type: ${args.type.toUpperCase()}\n`;
    summary += `• Analysis Period: Recent ${args.sessionIds.length} sessions\n`;
    summary += `• Total Recommendations: ${recommendations.length}\n`;
    summary += `• Report Generated: ${new Date().toLocaleString()}\n\n`;
    
    summary += `KEY TAKEAWAYS:\n`;
    if (args.type === "posture" || args.type === "combined") {
      const postureSessions = await ctx.db
        .query("postureSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      const validSessions = postureSessions.filter(s => s.forwardHeadAngle <= 30);
      if (validSessions.length > 0) {
        const recentSessions = validSessions.slice(-10);
        const avgScore = recentSessions.reduce((sum, s) => sum + (s.postureScore || 0), 0) / recentSessions.length;
        summary += `• Posture Quality Score: ${avgScore.toFixed(1)}/100\n`;
        summary += `• Primary Focus: ${avgScore < 70 ? 'Posture improvement needed' : avgScore > 85 ? 'Maintain excellent posture' : 'Continue good practices'}\n`;
      }
    }
    
    if (args.type === "gait" || args.type === "combined") {
      const gaitSessions = await ctx.db
        .query("gaitSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      if (gaitSessions.length > 0) {
        const recentSessions = gaitSessions.slice(-10);
        const avgSymmetry = recentSessions.reduce((sum, s) => sum + s.symmetryScore, 0) / recentSessions.length;
        summary += `• Gait Symmetry Score: ${avgSymmetry.toFixed(1)}%\n`;
        summary += `• Primary Focus: ${avgSymmetry < 80 ? 'Gait symmetry improvement needed' : 'Maintain good gait patterns'}\n`;
      }
    }
    
    summary += `\nNEXT STEPS:\n`;
    summary += `• Review recommendations and prioritize based on risk level\n`;
    summary += `• Implement ergonomic improvements for workspace setup\n`;
    summary += `• Schedule regular monitoring sessions for progress tracking\n`;
    summary += `• Consider professional consultation for high-risk areas\n`;
    summary += `• Set up posture reminders and movement breaks\n\n`;
    
    summary += `PROFESSIONAL CONSULTATION RECOMMENDED FOR:\n`;
    summary += `• Persistent pain or discomfort\n`;
    summary += `• High-risk posture patterns\n`;
    summary += `• Declining performance trends\n`;
    summary += `• Complex biomechanical issues\n\n`;
    
    summary += `TIPS FOR SUCCESS:\n`;
    summary += `• Consistency is key - small daily improvements compound over time\n`;
    summary += `• Listen to your body - pain is a signal to adjust\n`;
    summary += `• Environment matters - optimize your workspace ergonomically\n`;
    summary += `• Movement variety - avoid prolonged static positions\n`;
    summary += `• Track progress - regular assessments show improvement patterns\n\n`;
    
    summary += `---\n`;
    summary += `Report generated by BiomechAI - Advanced Biomechanical Analysis System\n`;
    summary += `For questions or concerns, consult with healthcare professionals\n`;

    const reportId = await ctx.db.insert("reports", {
      userId,
      sessionIds: args.sessionIds,
      type: args.type,
      title: args.title,
      summary,
      recommendations,
      createdAt: Date.now(),
    });

    return reportId;
  },
});

export const getUserReports = query({
  args: {},
  handler: async (ctx) => {
    // Use a default userId since authentication is removed
    const userId = "anonymous-user";

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_user_and_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);

    return reports;
  },
});

export const getReport = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    // Use a default userId since authentication is removed
    const userId = "anonymous-user";

    const report = await ctx.db.get(args.reportId);
    if (!report || report.userId !== userId) {
      throw new Error("Report not found");
    }

    return report;
  },
});

export const cleanupBadPostureData = mutation({
  args: {},
  handler: async (ctx) => {
    // Use a default userId since authentication is removed
    const userId = "anonymous-user";

    // Find and delete sessions with unrealistic forward head angles (> 30°)
    const badSessions = await ctx.db
      .query("postureSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gt(q.field("forwardHeadAngle"), 30))
      .collect();

    console.log(`Found ${badSessions.length} sessions with unrealistic posture data to clean up`);

    // Delete the bad sessions
    for (const session of badSessions) {
      await ctx.db.delete(session._id);
    }

    return { deletedCount: badSessions.length };
  },
});

export const deleteReport = mutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const userId = "anonymous-user";
    const report = await ctx.db.get(args.reportId);
    
    if (!report || report.userId !== userId) {
      throw new Error("Report not found or access denied");
    }
    
    await ctx.db.delete(args.reportId);
    return { success: true };
  },
});

export const deleteAllPostureSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = "anonymous-user";
    
    const sessions = await ctx.db
      .query("postureSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
    
    return { deletedCount: sessions.length };
  },
});

export const deleteAllGaitSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = "anonymous-user";
    
    const sessions = await ctx.db
      .query("gaitSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
    
    return { deletedCount: sessions.length };
  },
});
