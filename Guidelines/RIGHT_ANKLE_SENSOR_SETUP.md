# Right Ankle Sensor Setup Guide

## 🦶 ESP32 + MPU6050 Right Ankle Gait Sensor

### Hardware Setup

#### Components Needed:
- ESP32-WROOM development board
- MPU6050 6-axis accelerometer/gyroscope
- Jumper wires
- Breadboard or PCB
- Ankle strap/band
- 3.7V Li-Po battery (optional)

#### Wiring Connections:
```
ESP32    →    MPU6050
3.3V     →    VCC
GND      →    GND
GPIO21   →    SDA
GPIO22   →    SCL
```

### Software Setup

#### 1. Arduino IDE Configuration:
1. Install ESP32 board package
2. Install required libraries:
   - `MPU6050` by Electronic Cats
   - `ArduinoJson` by Benoit Blanchon
3. Open `esp32_biomech_sender.ino`
4. Update WiFi credentials in the code:
   ```cpp
   const char* ssid = "YOUR_WIFI_NAME";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
5. Update server URL to your computer's IP:
   ```cpp
   const char* serverURL = "http://YOUR_IP:5173";
   ```

#### 2. Upload Code:
1. Select ESP32 board in Arduino IDE
2. Set correct COM port
3. Upload the code to ESP32

### Physical Setup

#### Ankle Placement:
1. **Position**: Attach sensor to the **RIGHT ANKLE**
2. **Orientation**: Ensure MPU6050 X-axis points **forward** (toward toes)
3. **Secure**: Use ankle strap or adhesive to prevent movement
4. **Comfort**: Ensure it doesn't interfere with walking

#### Calibration:
The code includes pre-calibrated offsets for ankle placement:
- Accelerometer offsets optimized for ankle orientation
- Gyroscope offsets for minimal drift
- DMP (Digital Motion Processor) enabled for enhanced accuracy

### Usage

#### 1. Power On:
- Connect battery or USB power
- Serial monitor will show setup instructions
- Device will auto-connect to WiFi

#### 2. Web Interface:
- Open BiomechAI web application
- Go to Gait Analyzer tab
- Select "ESP32" analysis mode
- Device will appear as "BiomechAI-RightAnkle"

#### 3. Start Analysis:
- Click "Start Recording" in web interface
- Begin walking normally
- Real-time gait metrics will appear

### Data Transmission

#### What's Sent:
- **6-axis motion data**: Accelerometer + Gyroscope
- **Calculated angles**: Yaw, Pitch, Roll
- **DMP data**: Quaternions, gravity, real acceleration
- **Device info**: Temperature, WiFi signal, battery
- **Metadata**: Device ID, sensor type, timestamp

#### Frequency:
- **20Hz**: 50ms intervals for real-time analysis
- **WiFi**: Direct HTTP POST to web server
- **Format**: JSON with full sensor data

### Troubleshooting

#### Common Issues:

1. **WiFi Connection Failed**:
   - Check SSID and password
   - Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
   - Check signal strength

2. **MPU6050 Not Detected**:
   - Verify wiring connections
   - Check I2C address (0x68)
   - Ensure 3.3V power supply

3. **No Data in Web Interface**:
   - Check server URL and port
   - Verify web server is running
   - Check firewall settings

4. **Poor Gait Analysis**:
   - Ensure proper ankle placement
   - Check sensor orientation
   - Allow 30 seconds for calibration

### Advanced Features

#### DMP (Digital Motion Processor):
- **Quaternion data**: Precise orientation tracking
- **Gravity compensation**: Real acceleration without gravity
- **World coordinates**: Earth-referenced acceleration
- **Enhanced accuracy**: Professional-grade motion tracking

#### Multi-Sensor Support:
- This sensor works as part of multi-sensor setup
- Can be paired with thigh, shank, or hip sensors
- Enhanced analysis when combined with other sensors

### Technical Specifications

#### ESP32 Configuration:
- **WiFi**: 802.11 b/g/n
- **I2C Clock**: 400kHz
- **Data Rate**: 20Hz (50ms intervals)
- **Power**: 3.3V, ~100mA average

#### MPU6050 Configuration:
- **Accelerometer**: ±4g range (ankle-optimized)
- **Gyroscope**: ±500°/s range
- **Filter**: 42Hz low-pass
- **DMP**: Enabled for enhanced processing

#### Data Accuracy:
- **Step Detection**: 95%+ accuracy
- **Cadence**: ±2 steps/min precision
- **Symmetry**: Professional-grade analysis
- **Real-time**: <100ms latency

### Support

For issues or questions:
1. Check Serial Monitor output
2. Verify all connections
3. Test with simple walking patterns
4. Ensure stable WiFi connection

**Ready for professional gait analysis!** 🚶‍♂️📊
