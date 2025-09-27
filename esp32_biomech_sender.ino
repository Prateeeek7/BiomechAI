/*
 * BiomechAI ESP32 WiFi Multi-Sensor Data Sender
 * Sends 6-axis MPU6050 data to BiomechAI web application
 * Compatible with ESP32-WROOM modules
 * Supports both single and multi-sensor configurations
 * 
 * Hardware Connections:
 * ESP32    MPU6050
 * 3.3V  -> VCC
 * GND   -> GND
 * GPIO21 -> SDA
 * GPIO22 -> SCL
 * 
 * Multi-Sensor Setup:
 * - Flash this code to multiple ESP32 devices
 * - Each device will auto-generate unique ID
 * - Assign sensor types in the web interface
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <esp_system.h>
#include <esp_wifi.h>

// MPU6050 Library with DMP support
#include "MPU6050.h"
#include "MPU6050_6Axis_MotionApps20.h"

// WiFi Credentials - Update these with your network details
const char* ssid = "Pratik's iPhone";           // Replace with your WiFi name
const char* password = "1234567890";    // Replace with your WiFi password

// BiomechAI Server Configuration
const char* serverURL = "http://172.20.10.4:5173";  // Your computer's IP address
const char* endpoint = "/api/esp32-data";            // API endpoint for data

// ESP32 Device Configuration - Right Ankle Sensor
String deviceId = "ESP32-" + String((uint32_t)ESP.getEfuseMac(), HEX);
String deviceName = "BiomechAI-RightAnkle";
String sensorType = "ankle";  // Pre-configured for ankle placement
String bodyPosition = "right_ankle";  // Specific body position

// MPU6050 Object with DMP
MPU6050 mpu;

// DMP (Digital Motion Processor) variables
uint8_t mpuIntStatus;
uint8_t devStatus;
uint16_t packetSize;
uint16_t fifoCount;
uint8_t fifoBuffer[64];

// Quaternion and gravity vectors from DMP
Quaternion q;
VectorFloat gravity;
VectorFloat realAccel;
VectorFloat worldAccel;

// Data transmission settings
const unsigned long SEND_INTERVAL = 50;  // Send data every 50ms (20Hz)
const unsigned long RECONNECT_INTERVAL = 30000;  // Reconnect every 30 seconds if disconnected

// Variables
unsigned long lastSendTime = 0;
unsigned long lastReconnectTime = 0;
bool isConnected = false;
bool dmpReady = false;

// Enhanced MPU6050 Data Structure
struct SensorData {
  float accelX, accelY, accelZ;    // Acceleration in m/s²
  float gyroX, gyroY, gyroZ;       // Gyroscope in rad/s
  float temperature;               // Temperature in °C
  unsigned long timestamp;         // Timestamp in ms
  float yaw, pitch, roll;          // Calculated angles
  
  // DMP (Digital Motion Processor) data
  float quatW, quatX, quatY, quatZ;  // Quaternion
  float gravityX, gravityY, gravityZ; // Gravity vector
  float realAccelX, realAccelY, realAccelZ; // Real acceleration
  float worldAccelX, worldAccelY, worldAccelZ; // World acceleration
};

void setup() {
  Serial.begin(115200);
  Serial.println("BiomechAI ESP32 WiFi Data Sender Starting...");
  
  // Initialize I2C for MPU6050
  Wire.begin(21, 22);  // SDA=21, SCL=22 for ESP32
  Wire.setClock(400000);  // 400kHz I2C clock
  
  // Initialize MPU6050
  mpu.initialize();
  
  // Verify MPU6050 connection
  if (!mpu.testConnection()) {
    Serial.println("MPU6050 connection failed!");
    while (1) {
      delay(1000);
      Serial.println("Please check MPU6050 wiring and restart");
    }
  }
  
  Serial.println("MPU6050 initialized successfully");
  
  // Configure MPU6050 for ankle-worn gait analysis
  mpu.setFullScaleAccelRange(MPU6050_ACCEL_FS_4);  // ±4g (higher range for ankle movement)
  mpu.setFullScaleGyroRange(MPU6050_GYRO_FS_500);  // ±500°/s (higher range for ankle rotation)
  mpu.setDLPFMode(MPU6050_DLPF_BW_42);             // 42Hz low-pass filter (better for gait)
  
  // Initialize DMP for enhanced accuracy
  devStatus = mpu.dmpInitialize();
  
  // Calibration offsets for ankle placement (adjust as needed)
  mpu.setXAccelOffset(-1100);
  mpu.setYAccelOffset(-1453);
  mpu.setZAccelOffset(1788);
  mpu.setXGyroOffset(220);
  mpu.setYGyroOffset(76);
  mpu.setZGyroOffset(-85);
  
  if (devStatus == 0) {
    // DMP initialized successfully
    mpu.setDMPEnabled(true);
    mpuIntStatus = mpu.getIntStatus();
    dmpReady = true;
    packetSize = mpu.dmpGetFIFOPacketSize();
    Serial.println("DMP initialized successfully for ankle sensor");
  } else {
    Serial.println("DMP initialization failed, using basic mode");
    dmpReady = false;
  }
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("BiomechAI ESP32 Right Ankle Sensor Ready!");
  Serial.println("Device ID: " + deviceId);
  Serial.println("Device Name: " + deviceName);
  Serial.println("Sensor Type: " + sensorType);
  Serial.println("Body Position: " + bodyPosition);
  Serial.println("Server URL: " + String(serverURL));
  Serial.println("");
  Serial.println("=== ANKLE SENSOR SETUP INSTRUCTIONS ===");
  Serial.println("1. Attach sensor to RIGHT ANKLE");
  Serial.println("2. Ensure MPU6050 is oriented with X-axis pointing forward");
  Serial.println("3. Secure with strap or adhesive");
  Serial.println("4. Start walking to begin gait analysis");
  Serial.println("=====================================");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastReconnectTime > RECONNECT_INTERVAL) {
      Serial.println("WiFi disconnected. Attempting to reconnect...");
      connectToWiFi();
      lastReconnectTime = millis();
    }
    delay(1000);
    return;
  }
  
  // Send data at specified interval
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    sendSensorData();
    lastSendTime = millis();
  }
  
  // Small delay to prevent overwhelming the system
  delay(10);
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("WiFi connected successfully!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    isConnected = true;
  } else {
    Serial.println("");
    Serial.println("WiFi connection failed!");
    isConnected = false;
  }
}

void sendSensorData() {
  if (!isConnected || WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  // Read sensor data
  SensorData data = readMPU6050Data();
  
  // Create JSON payload with ankle-specific data
  StaticJsonDocument<1024> jsonDoc;
  jsonDoc["deviceId"] = deviceId;
  jsonDoc["deviceName"] = deviceName;
  jsonDoc["sensorType"] = sensorType;
  jsonDoc["bodyPosition"] = bodyPosition;
  jsonDoc["timestamp"] = data.timestamp;
  jsonDoc["receivedAt"] = millis();
  
  // Accelerometer data
  JsonObject accel = jsonDoc.createNestedObject("acceleration");
  accel["x"] = data.accelX;
  accel["y"] = data.accelY;
  accel["z"] = data.accelZ;
  
  // Gyroscope data
  JsonObject gyro = jsonDoc.createNestedObject("gyroscope");
  gyro["x"] = data.gyroX;
  gyro["y"] = data.gyroY;
  gyro["z"] = data.gyroZ;
  
  // Calculated angles
  JsonObject angles = jsonDoc.createNestedObject("angles");
  angles["yaw"] = data.yaw;
  angles["pitch"] = data.pitch;
  angles["roll"] = data.roll;
  
  // Additional data
  jsonDoc["temperature"] = data.temperature;
  jsonDoc["wifiSignal"] = WiFi.RSSI();
  jsonDoc["batteryLevel"] = 100;  // Placeholder for battery level
  
  // DMP (Digital Motion Processor) data for enhanced accuracy
  if (dmpReady) {
    JsonObject quaternion = jsonDoc.createNestedObject("quaternion");
    quaternion["w"] = data.quatW;
    quaternion["x"] = data.quatX;
    quaternion["y"] = data.quatY;
    quaternion["z"] = data.quatZ;
    
    JsonObject gravity = jsonDoc.createNestedObject("gravity");
    gravity["x"] = data.gravityX;
    gravity["y"] = data.gravityY;
    gravity["z"] = data.gravityZ;
    
    JsonObject realAccel = jsonDoc.createNestedObject("realAccel");
    realAccel["x"] = data.realAccelX;
    realAccel["y"] = data.realAccelY;
    realAccel["z"] = data.realAccelZ;
    
    JsonObject worldAccel = jsonDoc.createNestedObject("worldAccel");
    worldAccel["x"] = data.worldAccelX;
    worldAccel["y"] = data.worldAccelY;
    worldAccel["z"] = data.worldAccelZ;
  }
  
  // Convert to string
  String jsonString;
  serializeJson(jsonDoc, jsonString);
  
  // Send HTTP POST request
  HTTPClient http;
  http.begin(serverURL + String(endpoint));
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-BiomechAI");
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    if (httpResponseCode == 200) {
      // Success - data sent
      Serial.print("Data sent successfully. Response: ");
      Serial.println(response);
    } else {
      Serial.print("HTTP Error: ");
      Serial.println(httpResponseCode);
    }
  } else {
    Serial.print("HTTP Request failed: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

SensorData readMPU6050Data() {
  SensorData data;
  
  if (dmpReady) {
    // Use DMP for enhanced accuracy
    mpuIntStatus = mpu.getIntStatus();
    fifoCount = mpu.getFIFOCount();
    
    if ((mpuIntStatus & 0x10) || fifoCount == 1024) {
      mpu.resetFIFO();
    } else if (mpuIntStatus & 0x02) {
      while (fifoCount < packetSize) fifoCount = mpu.getFIFOCount();
      
      mpu.getFIFOBytes(fifoBuffer, packetSize);
      fifoCount -= packetSize;
      
      // Get quaternion
      mpu.dmpGetQuaternion(&q, fifoBuffer);
      
      // Get gravity vector
      mpu.dmpGetGravity(&gravity, &q);
      
      // Get real acceleration
      mpu.dmpGetAccel(&realAccel, fifoBuffer);
      
      // Get world acceleration
      mpu.dmpGetLinearAccel(&worldAccel, &realAccel, &gravity);
      
      // Get yaw, pitch, roll from quaternion
      mpu.dmpGetYawPitchRoll(data.yaw, data.pitch, data.roll, &q, &gravity);
      
      // Convert to degrees
      data.yaw *= 180/M_PI;
      data.pitch *= 180/M_PI;
      data.roll *= 180/M_PI;
      
      // Store DMP data
      data.quatW = q.w;
      data.quatX = q.x;
      data.quatY = q.y;
      data.quatZ = q.z;
      
      data.gravityX = gravity.x;
      data.gravityY = gravity.y;
      data.gravityZ = gravity.z;
      
      data.realAccelX = realAccel.x * 9.81;  // Convert to m/s²
      data.realAccelY = realAccel.y * 9.81;
      data.realAccelZ = realAccel.z * 9.81;
      
      data.worldAccelX = worldAccel.x * 9.81;  // Convert to m/s²
      data.worldAccelY = worldAccel.y * 9.81;
      data.worldAccelZ = worldAccel.z * 9.81;
      
      // Use real acceleration for main accelerometer data
      data.accelX = data.realAccelX;
      data.accelY = data.realAccelY;
      data.accelZ = data.realAccelZ;
    }
  } else {
    // Fallback to basic reading
    int16_t accelX_raw, accelY_raw, accelZ_raw;
    int16_t gyroX_raw, gyroY_raw, gyroZ_raw;
    int16_t temperature_raw;
    
    mpu.getMotion6(&accelX_raw, &accelY_raw, &accelZ_raw, &gyroX_raw, &gyroY_raw, &gyroZ_raw);
    temperature_raw = mpu.getTemperature();
    
    // Convert to physical units for ±4g range: 8192 LSB/g
    data.accelX = accelX_raw / 8192.0 * 9.81;  // Convert to m/s²
    data.accelY = accelY_raw / 8192.0 * 9.81;
    data.accelZ = accelZ_raw / 8192.0 * 9.81;
    
    // ±500°/s range: 65.5 LSB/°/s
    data.gyroX = gyroX_raw / 65.5 * PI / 180.0;  // Convert to rad/s
    data.gyroY = gyroY_raw / 65.5 * PI / 180.0;
    data.gyroZ = gyroZ_raw / 65.5 * PI / 180.0;
    
    // Calculate yaw, pitch, roll (simplified)
    data.yaw = atan2(data.gyroY, data.gyroX) * 180.0 / PI;
    data.pitch = atan2(-data.accelX, sqrt(data.accelY * data.accelY + data.accelZ * data.accelZ)) * 180.0 / PI;
    data.roll = atan2(data.accelY, data.accelZ) * 180.0 / PI;
    
    // Zero out DMP data
    data.quatW = data.quatX = data.quatY = data.quatZ = 0;
    data.gravityX = data.gravityY = data.gravityZ = 0;
    data.realAccelX = data.realAccelY = data.realAccelZ = 0;
    data.worldAccelX = data.worldAccelY = data.worldAccelZ = 0;
  }
  
  // Temperature conversion
  int16_t temperature_raw = mpu.getTemperature();
  data.temperature = temperature_raw / 340.0 + 36.53;
  
  // Timestamp
  data.timestamp = millis();
  
  return data;
}

// Utility functions
void printSensorData(const SensorData& data) {
  Serial.println("=== MPU6050 Data ===");
  Serial.print("Accel X: "); Serial.print(data.accelX, 3); Serial.println(" m/s²");
  Serial.print("Accel Y: "); Serial.print(data.accelY, 3); Serial.println(" m/s²");
  Serial.print("Accel Z: "); Serial.print(data.accelZ, 3); Serial.println(" m/s²");
  Serial.print("Gyro X: "); Serial.print(data.gyroX, 3); Serial.println(" rad/s");
  Serial.print("Gyro Y: "); Serial.print(data.gyroY, 3); Serial.println(" rad/s");
  Serial.print("Gyro Z: "); Serial.print(data.gyroZ, 3); Serial.println(" rad/s");
  Serial.print("Temperature: "); Serial.print(data.temperature, 1); Serial.println(" °C");
  Serial.print("Yaw: "); Serial.print(data.yaw, 1); Serial.println(" °");
  Serial.print("Pitch: "); Serial.print(data.pitch, 1); Serial.println(" °");
  Serial.print("Roll: "); Serial.print(data.roll, 1); Serial.println(" °");
  Serial.println("==================");
}

void printWiFiStatus() {
  Serial.println("=== WiFi Status ===");
  Serial.print("SSID: "); Serial.println(WiFi.SSID());
  Serial.print("IP Address: "); Serial.println(WiFi.localIP());
  Serial.print("Signal Strength: "); Serial.print(WiFi.RSSI()); Serial.println(" dBm");
  Serial.print("MAC Address: "); Serial.println(WiFi.macAddress());
  Serial.println("==================");
}
