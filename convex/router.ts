import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// ESP32 Data Reception Endpoint
http.route({
  path: "/api/esp32-data",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Parse JSON body
      const body = await request.text();
      const data = JSON.parse(body);

      // Validate required fields
      if (!data.deviceId || !data.timestamp || !data.acceleration || !data.gyroscope) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { 
            status: 400, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }

      // Insert ESP32 data into gaitSessions table
      const sessionId = await ctx.runMutation(api.gait.analyzeGait, {
        stepCount: 0,
        cadence: 0,
        strideLength: 0,
        gaitSpeed: 0,
        symmetryScore: 0,
        leftRightBalance: 50,
        stancePhase: 60,
        swingPhase: 40,
        doubleSupportPhase: 10,
        heelStrikeForce: 0,
        toeOffForce: 0,
        analysisType: 'esp32-wifi',
        rawDataPath: JSON.stringify(data)
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          sessionId,
          message: "ESP32 data received successfully" 
        }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          } 
        }
      );
    } catch (error) {
      console.error("Error processing ESP32 data:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }
  }),
});

// CORS preflight handler
http.route({
  path: "/api/esp32-data",
  method: "OPTIONS",
  handler: httpAction(async (ctx, request) => {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }),
});

// ESP32 Device Status Endpoint
http.route({
  path: "/api/esp32-status",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      // Return current ESP32 device status
      return new Response(
        JSON.stringify({ 
          status: "ready",
          message: "ESP32 endpoint is operational",
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          } 
        }
      );
    } catch (error) {
      console.error("Error getting ESP32 status:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }
  }),
});

export default http;