/*
 * BiomechAI ESP32 WiFi Data Sender (Simplified Test)
 * Sends basic data to test connection
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <esp_system.h>

// WiFi Credentials
const char* ssid = "Akashesp";
const char* password = "0987654321";

// Server Configuration
const char* serverURL = "http://10.209.11.147:3000";
const char* endpoint = "/api/esp32-data";

// ESP32 Device Configuration
String deviceId = "ESP32-" + String((uint32_t)ESP.getEfuseMac(), HEX);
String deviceName = "BiomechAI-RightAnkle";
String sensorType = "ankle";
String bodyPosition = "right_ankle";

// Data transmission settings
const unsigned long SEND_INTERVAL = 1000;  // Send data every 1 second
const unsigned long RECONNECT_INTERVAL = 30000;

// Variables
unsigned long lastSendTime = 0;
unsigned long lastReconnectTime = 0;
bool isConnected = false;

// Function declarations
void connectToWiFi();
void sendTestData();

void setup() {
  Serial.begin(115200);
  Serial.println("BiomechAI ESP32 Test Starting...");

  // Connect to WiFi
  connectToWiFi();

  Serial.println("BiomechAI ESP32 Test Ready!");
  Serial.println("Device ID: " + deviceId);
  Serial.println("Server URL: " + String(serverURL));
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
    sendTestData();
    lastSendTime = millis();
  }

  delay(100);
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

void sendTestData() {
  if (!isConnected || WiFi.status() != WL_CONNECTED) {
    return;
  }

  // Create test data
  StaticJsonDocument<512> jsonDoc;
  jsonDoc["deviceId"] = deviceId;
  jsonDoc["deviceName"] = deviceName;
  jsonDoc["sensorType"] = sensorType;
  jsonDoc["bodyPosition"] = bodyPosition;
  jsonDoc["timestamp"] = millis();
  jsonDoc["receivedAt"] = millis();

  // Test acceleration data
  JsonObject accel = jsonDoc.createNestedObject("acceleration");
  accel["x"] = 0.1 + (millis() % 1000) / 1000.0;
  accel["y"] = 0.2 + (millis() % 2000) / 2000.0;
  accel["z"] = 9.8 + (millis() % 500) / 500.0;

  // Test gyroscope data
  JsonObject gyro = jsonDoc.createNestedObject("gyroscope");
  gyro["x"] = (millis() % 100) / 1000.0;
  gyro["y"] = (millis() % 150) / 1000.0;
  gyro["z"] = (millis() % 200) / 1000.0;

  // Test angles
  JsonObject angles = jsonDoc.createNestedObject("angles");
  angles["yaw"] = (millis() / 100) % 360;
  angles["pitch"] = (millis() / 200) % 180 - 90;
  angles["roll"] = (millis() / 300) % 180 - 90;

  // Additional data
  jsonDoc["temperature"] = 25.0 + (millis() % 100) / 100.0;
  jsonDoc["wifiSignal"] = WiFi.RSSI();
  jsonDoc["batteryLevel"] = 100;

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