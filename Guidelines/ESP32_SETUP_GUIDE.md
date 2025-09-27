# ESP32 WiFi Setup Guide for BiomechAI

## 🚀 Quick Setup Instructions

### 1. Hardware Connections
Connect your ESP32-WROOM to MPU6050 sensor:

```
ESP32-WROOM    MPU6050
3.3V        -> VCC
GND         -> GND
GPIO21      -> SDA
GPIO22      -> SCL
```

### 2. Arduino IDE Setup
1. Install ESP32 board package in Arduino IDE
2. Install required libraries:
   - `MPU6050` by Electronic Cats
   - `ArduinoJson` by Benoit Blanchon
   - `WiFi` (included with ESP32)

### 3. Upload Code
1. Open `esp32_biomech_sender.ino` in Arduino IDE
2. Select your ESP32-WROOM board
3. Update WiFi credentials (already set for your iPhone hotspot)
4. Upload the code

### 4. WiFi Configuration
The ESP32 is configured to connect to:
- **SSID**: "Pratik's iPhone"
- **Password**: "1234567890"
- **Server**: http://172.20.10.4:5173

### 5. Test the Connection
1. Power on your ESP32
2. Open Serial Monitor (115200 baud)
3. You should see:
   ```
   WiFi connected successfully!
   IP address: [ESP32_IP]
   BiomechAI ESP32 Data Sender Ready!
   Data sent successfully. Response: {"success":true}
   ```

## 📊 Data Transmission Details

### Data Format
The ESP32 sends 6-axis sensor data every 50ms (20Hz):
```json
{
  "deviceId": "ESP32-WROOM-001",
  "deviceName": "ESP32-BiomechAI-Sensor",
  "timestamp": 1234567890,
  "acceleration": {
    "x": 0.1, "y": 9.8, "z": -0.2
  },
  "gyroscope": {
    "x": 0.05, "y": -0.1, "z": 0.02
  },
  "angles": {
    "yaw": 15.2, "pitch": -2.1, "roll": 1.5
  },
  "temperature": 28.5,
  "wifiSignal": -45,
  "batteryLevel": 100
}
```

### Real-time Analysis
- **Step Detection**: Advanced peak detection with filtering
- **Gait Metrics**: Cadence, stride length, symmetry analysis
- **Posture Analysis**: Body position and movement patterns
- **Health Insights**: Real-time recommendations

## 🔧 Troubleshooting

### ESP32 Won't Connect to WiFi
1. Check WiFi credentials in the code
2. Ensure your iPhone hotspot is active
3. Check signal strength (should be > -70 dBm)

### No Data Received
1. Verify ESP32 IP address in Serial Monitor
2. Check that your computer is on the same network
3. Test server endpoint: http://172.20.10.4:5173/api/esp32-status

### MPU6050 Issues
1. Check wiring connections
2. Verify I2C address (usually 0x68)
3. Test with I2C scanner if needed

## 📱 Using the System

1. **Start BiomechAI**: Open http://localhost:5173
2. **Go to Gait Analyzer**: Click the "Gait" tab
3. **Select ESP32 Mode**: Choose "ESP32 MPU6050"
4. **Attach Sensor**: Secure ESP32 to your ankle or waist
5. **Start Recording**: Click "Start ESP32 Recording"
6. **Walk Normally**: Move around for 30-60 seconds
7. **View Results**: See real-time gait analysis and metrics

## 🎯 Advanced Features

### Real-time Metrics
- **Steps**: Automatic step counting with validation
- **Cadence**: Steps per minute calculation
- **Stride Length**: Gyroscope-based estimation
- **Symmetry**: Left-right balance analysis
- **Gait Phases**: Stance, swing, double support detection

### Health Insights
- **Posture Scoring**: 0-100 comprehensive assessment
- **Recommendations**: AI-powered health advice
- **Trend Analysis**: Historical data tracking
- **Export Data**: CSV download for further analysis

## 🔄 Data Flow

```
ESP32 (MPU6050) -> WiFi -> Your Computer -> BiomechAI -> Real-time Analysis
```

1. ESP32 reads 6-axis data from MPU6050
2. Data transmitted via WiFi HTTP POST
3. BiomechAI receives and processes data
4. Advanced algorithms analyze gait patterns
5. Real-time feedback and recommendations displayed

## 📈 Next Steps

1. **Calibrate Sensor**: Run calibration for your specific setup
2. **Adjust Sensitivity**: Modify thresholds for your walking style
3. **Export Data**: Download CSV files for medical analysis
4. **Track Progress**: Monitor improvements over time

Your ESP32-WROOM is now ready to provide professional-grade gait analysis! 🚀
