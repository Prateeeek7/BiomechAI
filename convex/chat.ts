import { action } from "./_generated/server";
import { v } from "convex/values";

export const chatWithAI = action({
  args: {
    postureStats: v.optional(v.any()),
    gaitStats: v.optional(v.any()),
    userMessage: v.string(),
  },
  handler: async (ctx, args) => {
    // Use a default userId since authentication is removed
    const userId = "anonymous-user";

    // Prepare biomechanical context
    let contextPrompt = `You are an expert biomechanics and movement science AI assistant specializing in posture analysis, gait assessment, ergonomics, and movement optimization. You have access to the user's personal biomechanical data from their BiomechAI sessions.

**User's Personal Biomechanical Data:**`;

    if (args.postureStats && args.postureStats.totalSessions > 0) {
      contextPrompt += `
📊 **Posture Analysis Data:**
- Total posture sessions recorded: ${args.postureStats.totalSessions}
- Good posture percentage: ${args.postureStats.goodPosturePercentage}%
- Average forward head angle: ${args.postureStats.averageForwardHead}° (normal: <8°)
- Average posture score: ${args.postureStats.averageScore}/100
- Improvement rate: ${args.postureStats.improvementRate}%
- Recent weekly trend: ${args.postureStats.weeklyTrend ? 'Available for analysis' : 'No recent data'}`;
    } else {
      contextPrompt += `
📊 **Posture Analysis Data:**
- No posture sessions recorded yet
- User is new to posture monitoring`;
    }

    if (args.gaitStats && args.gaitStats.totalSessions > 0) {
      contextPrompt += `
🚶 **Gait Analysis Data:**
- Total gait sessions recorded: ${args.gaitStats.totalSessions}
- Average gait symmetry: ${args.gaitStats.averageSymmetry}% (ideal: >85%)
- Average cadence: ${args.gaitStats.averageCadence} steps/min (normal: 120-160)
- Normal gait percentage: ${args.gaitStats.normalGaitPercentage}%
- Recent weekly trend: ${args.gaitStats.weeklyTrend ? 'Available for analysis' : 'No recent data'}`;
    } else {
      contextPrompt += `
🚶 **Gait Analysis Data:**
- No gait sessions recorded yet
- User is new to gait monitoring`;
    }

    contextPrompt += `

**Instructions:**
Provide expert, evidence-based advice tailored to this user's specific biomechanical profile. Use their personal data to:
- Give personalized recommendations based on their actual measurements
- Reference their specific posture scores and gait metrics
- Provide progressive improvement strategies based on their current levels
- Explain the significance of their measurements in practical terms
- Offer safety considerations for their specific situation
- Suggest realistic goals based on their current performance

**User's Question:** ${args.userMessage}

Please respond as a knowledgeable biomechanics expert with access to their personal data, providing specific, actionable advice.`;

    try {
      // Try Google Gemini API first (free tier available)
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBq1e0QeZoclwogw6alBYQodjF8dDu2orM';
      
      if (GEMINI_API_KEY) {
        try {
          console.log('Using Google Gemini API for external AI responses');
          
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `${contextPrompt}\n\nUser's Question: ${args.userMessage}`
                }]
              }],
              generationConfig: {
                maxOutputTokens: 1500,
                temperature: 0.7,
              }
            }),
          });

          console.log('Gemini API response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Gemini API success, returning response');
            return data.candidates[0].content.parts[0].text;
          } else {
            const errorText = await response.text();
            console.log('Gemini API error:', response.status, errorText);
          }
        } catch (geminiError) {
          console.log('Gemini API network error:', geminiError);
        }
      }
      
      // Try OpenAI API as backup
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      
      if (OPENAI_API_KEY) {
        console.log('Using OpenAI API for external AI responses');
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: contextPrompt
              },
              {
                role: 'user',
                content: args.userMessage
              }
            ],
            max_tokens: 1500,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('OpenAI API success, returning response');
          return data.choices[0].message.content;
        }
      }
      
      
      // Final fallback to comprehensive biomechanics system
      console.log('All external APIs failed, using comprehensive biomechanics expert system');
      return generateComprehensiveBiomechanicsResponse(args.userMessage, args.postureStats, args.gaitStats);
      
    } catch (error) {
      console.error('Error with external APIs:', error);
      console.log('Falling back to comprehensive biomechanics expert system');
      return generateComprehensiveBiomechanicsResponse(args.userMessage, args.postureStats, args.gaitStats);
    }
    
    /*
    // Grok API integration - temporarily disabled due to key validation issues
    try {
      console.log('Calling Grok API with user message:', args.userMessage);
      
      const GROK_API_KEY = process.env.GROK_API_KEY;
      
      if (!GROK_API_KEY || !GROK_API_KEY.startsWith('gsk_')) {
        console.log('Invalid API key, using comprehensive biomechanics system');
        return generateComprehensiveBiomechanicsResponse(args.userMessage, args.postureStats, args.gaitStats);
      }
      
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: contextPrompt
            },
            {
              role: 'user',
              content: args.userMessage
            }
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.log('Grok API failed, using comprehensive biomechanics system');
        return generateComprehensiveBiomechanicsResponse(args.userMessage, args.postureStats, args.gaitStats);
      }

      const data = await response.json();
      return data.choices[0].message.content;
      
    } catch (error) {
      console.log('Grok API error, using comprehensive biomechanics system');
      return generateComprehensiveBiomechanicsResponse(args.userMessage, args.postureStats, args.gaitStats);
    }
    */
  },
});

function generateComprehensiveBiomechanicsResponse(userMessage: string, postureStats: any, gaitStats: any): string {
  const message = userMessage.toLowerCase();
  
  // Handle general questions about dates, time, etc.
  if (message.includes('date') || message.includes('time') || message.includes('today')) {
    const now = new Date();
    return `🤖 **AI Biomechanics Assistant**\n\nToday is ${now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}.\n\nI'm your biomechanics expert! I can help you with:\n• Posture analysis and improvement\n• Gait assessment and optimization\n• Exercise prescription\n• Ergonomic workspace setup\n• Movement pattern analysis\n\nWhat biomechanics question can I help you with today?`;
  }
  
  // Handle greetings
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return `🤖 **AI Biomechanics Expert**\n\nHello! I'm your personal biomechanics assistant, powered by advanced movement science knowledge. I specialize in:\n\n**📊 Your Personal Analysis:**\n${postureStats && postureStats.totalSessions > 0 ? `• ${postureStats.totalSessions} posture sessions analyzed\n• Current score: ${postureStats.averageScore}/100\n` : '• No posture data yet - let\'s start analyzing!\n'}${gaitStats && gaitStats.totalSessions > 0 ? `• ${gaitStats.totalSessions} gait sessions recorded\n• Symmetry: ${gaitStats.averageSymmetry}%\n` : '• No gait data yet - ready to begin tracking!\n'}\n**🎯 How I Can Help:**\n• Analyze your movement patterns\n• Provide personalized exercise recommendations\n• Optimize your workspace ergonomics\n• Track your biomechanical progress\n\nWhat would you like to know about your movement and posture today?`;
  }
  
  return generateEnhancedFallbackResponse(userMessage, postureStats, gaitStats);
}

function generateEnhancedFallbackResponse(userMessage: string, postureStats: any, gaitStats: any): string {
  const message = userMessage.toLowerCase();
  
  // Enhanced posture analysis with personal data
  if (message.includes('posture') || message.includes('forward head') || message.includes('sitting') || message.includes('wrong position') || message.includes('back')) {
    let response = `🤖 **AI Biomechanics Expert - Comprehensive Analysis**\n\n`;
    
    // Add personal data analysis if available
    if (postureStats && postureStats.totalSessions > 0) {
      response += `📊 **Your Personal Posture Profile:**\n`;
      response += `• Total sessions analyzed: ${postureStats.totalSessions}\n`;
      response += `• Current posture score: ${postureStats.averageScore}/100\n`;
      response += `• Forward head angle: ${postureStats.averageForwardHead}° (ideal: <8°)\n`;
      response += `• Improvement trend: ${postureStats.improvementRate > 0 ? '+' + postureStats.improvementRate + '%' : 'Stable'}\n\n`;
    }
    
    response += `⚠️ **Effects of Prolonged Poor Posture:**\n`;
    response += `• **Immediate (Hours):** Muscle fatigue, tension headaches, neck stiffness\n`;
    response += `• **Short-term (Days/Weeks):** Chronic pain, reduced mobility, poor circulation\n`;
    response += `• **Long-term (Months/Years):** Spinal misalignment, disc degeneration, permanent structural changes\n\n`;
    
    response += `💡 **Evidence-Based Solutions:**\n`;
    response += `• **Ergonomic Setup:** Monitor at eye level, lumbar support, feet flat\n`;
    response += `• **Movement Breaks:** 30-second posture resets every 30 minutes\n`;
    response += `• **Targeted Exercises:** Chin tucks, wall angels, thoracic extensions\n`;
    response += `• **Strengthening:** Deep neck flexors, core stability, hip flexors\n`;
    response += `• **Stretching:** Chest muscles, anterior neck, hip flexors\n\n`;
    
    response += `⚡ **Quick Action Plan:**\n`;
    response += `1. Set hourly posture reminders\n`;
    response += `2. Perform 10 chin tucks every 2 hours\n`;
    response += `3. Adjust workspace ergonomics today\n`;
    response += `4. Start with 5-minute daily exercise routine\n\n`;
    
    response += `🎯 **Expected Timeline:**\n`;
    response += `• Week 1: Reduced muscle tension\n`;
    response += `• Week 2-4: Improved posture awareness\n`;
    response += `• Month 2-3: Noticeable postural improvements\n`;
    response += `• Month 3+: Long-term structural benefits\n\n`;
    
    response += `📈 **Monitor Progress:** Use your BiomechAI sessions to track improvements in posture scores and forward head angles.`;
    
    return response;
  }
  
  // Enhanced gait analysis
  if (message.includes('gait') || message.includes('walking') || message.includes('symmetry') || message.includes('balance')) {
    let response = `🤖 **AI Gait Analysis Expert**\n\n`;
    
    if (gaitStats && gaitStats.totalSessions > 0) {
      response += `📊 **Your Gait Performance Profile:**\n`;
      response += `• Total gait sessions: ${gaitStats.totalSessions}\n`;
      response += `• Symmetry score: ${gaitStats.averageSymmetry}% (ideal: >85%)\n`;
      response += `• Cadence: ${gaitStats.averageCadence} steps/min (optimal: 120-160)\n`;
      response += `• Normal gait percentage: ${gaitStats.normalGaitPercentage}%\n\n`;
    }
    
    response += `🚶 **Gait Optimization Strategy:**\n`;
    response += `• **Symmetry Training:** Single-leg balance exercises, weight shifting drills\n`;
    response += `• **Cadence Optimization:** Metronome walking, rhythm training\n`;
    response += `• **Strength Building:** Hip abductors, calf raises, ankle mobility\n`;
    response += `• **Balance Enhancement:** Proprioceptive training, unstable surfaces\n\n`;
    
    response += `📋 **Daily Gait Routine:**\n`;
    response += `• Morning: 5 minutes of balance exercises\n`;
    response += `• Walking: Focus on equal weight distribution\n`;
    response += `• Evening: Single-leg stands (30 seconds each)\n`;
    response += `• Weekly: Gait analysis with BiomechAI\n\n`;
    
    return response;
  }
  
  return generateFallbackResponse(userMessage, postureStats, gaitStats);
}

function generateFallbackResponse(userMessage: string, postureStats: any, gaitStats: any): string {
  const message = userMessage.toLowerCase();
  
  if (message.includes('posture') || message.includes('forward head') || message.includes('sitting')) {
    let response = "🤖 **AI Biomechanics Expert Response**\n\nBased on biomechanical principles, here are evidence-based recommendations for improving posture:\n\n";
    
    if (postureStats && postureStats.averageForwardHead > 10) {
      response += `📊 **Your Data Analysis:**\n• Your average forward head angle is ${postureStats.averageForwardHead}° (ideal: <8°)\n• This suggests forward head posture needs attention\n\n`;
    }
    
    response += `💡 **Actionable Recommendations:**\n• **Chin Tucks**: Hold 5-10 seconds, repeat 10 times daily\n• **Chest Stretches**: Doorway stretch for pectoral muscles\n• **Monitor Height**: Adjust to eye level to reduce forward head posture\n• **Movement Breaks**: Reset posture every 30 minutes\n• **Ergonomic Setup**: Consider workstation assessment\n\n⚡ **Key Principle**: Small, frequent corrections beat occasional major adjustments!`;
    
    return response;
  }
  
  if (message.includes('gait') || message.includes('walking') || message.includes('symmetry')) {
    let response = "🤖 **AI Gait Analysis Expert**\n\nHere's evidence-based guidance for gait optimization:\n\n";
    
    if (gaitStats && gaitStats.averageSymmetry < 85) {
      response += `📊 **Your Gait Data:**\n• Symmetry: ${gaitStats.averageSymmetry}% (ideal: >85%)\n• This indicates some asymmetry that can be improved\n\n`;
    }
    
    response += `💡 **Gait Optimization Tips:**\n• **Weight Distribution**: Equal loading between both legs\n• **Optimal Cadence**: 120-160 steps per minute for efficiency\n• **Foot Strike**: Land midfoot, not heel-heavy\n• **Core Engagement**: Maintain stability during walking\n• **Balance Training**: Single-leg stands for stability improvement\n\n⚡ **Pro Tip**: If asymmetries persist, consider consulting a movement specialist for detailed analysis.`;
    
    return response;
  }
  
  if (message.includes('exercise') || message.includes('strengthen') || message.includes('workout')) {
    return `🤖 **AI Exercise Prescription**\n\nHere are evidence-based exercises for biomechanical health:\n\n**💪 For Posture Improvement:**\n• **Wall Angels**: 2 sets of 15 reps (scapular mobility)\n• **Bird Dogs**: 2 sets of 10 reps each side (core stability)\n• **Thoracic Extensions**: 2 sets of 10 reps (spine mobility)\n• **Hip Flexor Stretches**: Hold 30 seconds each side\n\n**🚶 For Gait Enhancement:**\n• **Single-Leg Stands**: 3 sets of 30 seconds each leg\n• **Calf Raises**: 2 sets of 15 reps (push-off power)\n• **Hip Abductor Work**: 2 sets of 12 reps each side\n• **Ankle Mobility**: 10 circles each direction\n\n**⚡ Training Principles:**\n• Start with 2-3 sets of 10-15 repetitions\n• Progress gradually over 2-4 weeks\n• Focus on quality over quantity\n• Listen to your body and avoid pain\n\nWould you like specific instructions for any of these exercises?`;
  }
  
  // Handle other common biomechanics questions
  if (message.includes('ergonomic') || message.includes('workspace') || message.includes('desk')) {
    return `🤖 **AI Ergonomic Assessment**\n\n**🪑 Optimal Workspace Setup:**\n• **Monitor Height**: Top of screen at eye level\n• **Keyboard Position**: Elbows at 90° angles\n• **Chair Support**: Lumbar support, feet flat on floor\n• **Lighting**: Reduce glare, use natural light when possible\n• **Mouse Position**: Close to keyboard, avoid reaching\n\n**⚡ Quick Ergonomic Checks:**\n• Shoulders relaxed, not hunched\n• Wrists straight while typing\n• Take breaks every 30 minutes\n• Stand and move regularly\n\n**🔧 Adjustable Elements:**\n• Monitor arm for height adjustment\n• Keyboard tray for proper positioning\n• Footrest if feet don't reach floor\n• Document holder to reduce neck turning`;
  }

  if (message.includes('pain') || message.includes('ache') || message.includes('discomfort')) {
    return `🤖 **AI Movement Health Assessment**\n\n**⚠️ Important Note:**\nWhile I can provide general guidance, persistent pain requires professional medical evaluation.\n\n**🔍 Common Biomechanical Issues:**\n• **Neck Pain**: Often related to forward head posture\n• **Lower Back Pain**: May indicate weak core or poor sitting habits\n• **Shoulder Discomfort**: Could be from rounded shoulders or repetitive strain\n• **Hip/Knee Issues**: Often gait-related or from prolonged sitting\n\n**💡 General Self-Care:**\n• Move regularly throughout the day\n• Strengthen weak muscles, stretch tight ones\n• Maintain neutral spine alignment\n• Listen to your body's signals\n• Consider professional assessment for persistent issues\n\n**🚨 When to Seek Help:**\n• Pain lasting more than a few days\n• Sharp or severe pain\n• Pain that interferes with daily activities\n• Numbness or tingling sensations`;
  }

  if (message.includes('improve') || message.includes('better') || message.includes('tips')) {
    return `🤖 **AI Biomechanics Improvement Plan**\n\n**🎯 Key Improvement Areas:**\n\n**📊 Track Your Progress:**\n• Use your BiomechAI sessions regularly\n• Monitor trends in your posture scores\n• Track gait symmetry improvements\n• Set realistic, measurable goals\n\n**🔄 Daily Habits:**\n• **Morning**: Posture check and gentle stretches\n• **Work Hours**: 30-minute movement breaks\n• **Evening**: Relaxation and mobility work\n• **Weekly**: Review your biomechanics data\n\n**📈 Progressive Approach:**\n• Start with awareness and small corrections\n• Build consistent daily habits\n• Gradually increase exercise intensity\n• Focus on one area at a time\n• Celebrate small wins along the way\n\n**💪 Success Factors:**\n• Consistency beats perfection\n• Small changes create big results\n• Patience with the process\n• Regular assessment and adjustment`;
  }

  return `🤖 **AI Biomechanics Assistant**\n\nThank you for your question! I'm here to help with all aspects of movement and biomechanics.\n\n**🔍 What I Can Help With:**\n• Posture analysis and improvement\n• Gait assessment and optimization\n• Exercise prescription and form\n• Ergonomic workspace setup\n• Movement pattern analysis\n• Pain prevention strategies\n\n**💡 Quick Tips:**\n• Movement quality beats quantity\n• Consistency in good habits beats perfection\n• Listen to your body's feedback\n• Small, frequent corrections are most effective\n• Professional assessment helps with persistent issues\n\n**❓ Try Asking:**\n• "How can I improve my posture?"\n• "What exercises help with forward head posture?"\n• "How do I set up an ergonomic workspace?"\n• "What causes gait asymmetry?"\n\nI'm analyzing your personal biomechanical data to provide tailored advice!`;
}
