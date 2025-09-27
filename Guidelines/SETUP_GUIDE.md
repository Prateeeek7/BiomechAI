# BiomechAI Setup Guide

This guide will walk you through setting up the complete BiomechAI system, including the web application, ESP32 hardware, and all dependencies.

## 📋 Prerequisites

### Software Requirements
- **Node.js** 18+ and npm
- **Arduino IDE** or **PlatformIO** (recommended)
- **Git** for version control
- **Webcam** for posture analysis
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Hardware Requirements
- **ESP32 development board** (ESP32-WROOM-32 or similar)
- **MPU6050 IMU sensor** (6-axis accelerometer + gyroscope)
- **Jumper wires** (4x)
- **Breadboard** (optional but recommended)
- **USB cable** for ESP32 programming

## 🚀 Step-by-Step Setup

### 1. Clone and Setup Project

```bash
# Clone the repository
git clone <repository-url>
cd biomech-final

# Install Node.js dependencies
npm install

# Copy environment template
cp env.template .env.local
```

### 2. Configure Environment Variables

Edit `.env.local` with your actual values:

```bash
# Required: Get from Convex dashboard after deployment
VITE_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=your-deployment-name
CONVEX_DEPLOY_KEY=your-deploy-key

# Required: Google Gemini API key
GEMINI_API_KEY=AIzaSyBq1e0QeZoclwogw6alBYQodjF8dDu2orM

# Optional: Other AI APIs
OPENAI_API_KEY=your_openai_key
GROK_API_KEY=your_grok_key
```

### 3. Setup Convex Backend

```bash
# Install Convex CLI globally
npm install -g convex

# Login to Convex
npx convex login

# Deploy your backend
npx convex dev
```

This will:
- Create a new Convex deployment
- Generate your environment variables
- Deploy all backend functions

### 4. Hardware Setup

#### Wiring Diagram
```
ESP32 Pin    MPU6050 Pin
----------   -----------
3.3V      -> VCC
GND       -> GND  
D21 (SDA) -> SDA
D22 (SCL) -> SCL
```

#### Physical Setup
1. Place ESP32 and MPU6050 on breadboard
2. Connect power (3.3V and GND)
3. Connect I2C pins (SDA to D21, SCL to D22)
4. Double-check all connections

### 5. ESP32 Code Setup

#### Option A: Using PlatformIO (Recommended)

```bash
# Install PlatformIO CLI
pip install platformio

# Navigate to ESP32 project
cd esp32_project

# Install dependencies
pio lib install

# Upload code
pio run --target upload

# Monitor serial output
pio device monitor
```

#### Option B: Using Arduino IDE

1. Install ESP32 board package
2. Install libraries:
   - ArduinoJson
   - MPU6050
3. Open `esp32_project/src/main.cpp`
4. Update WiFi credentials
5. Select ESP32 board and upload

### 6. Configure WiFi

Edit the ESP32 code (`esp32_project/src/main.cpp`):

```cpp
// Update these with your WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### 7. Start the Application

```bash
# Start both frontend and backend
npm run dev
```

This will:
- Start the React development server (port 5173)
- Start Convex backend
- Open your browser automatically

## 🔧 Configuration Details

### ESP32 Configuration

#### Sensor Calibration
The MPU6050 sensor may need calibration. Monitor serial output for:
```
MPU6050 initialized successfully
Calibrating sensor...
Calibration complete
```

#### Data Transmission
- Default transmission rate: 50Hz
- Data format: JSON with timestamp, accelerometer, and gyroscope data
- Endpoint: Your Convex deployment URL

### Web Application Configuration

#### Camera Permissions
- Ensure camera permissions are granted
- Use HTTPS in production for camera access
- Test with different browsers if issues occur

#### Real-time Data
- ESP32 data streams to Convex backend
- Frontend polls for new data every 100ms
- Data is processed and displayed in real-time

## 🧪 Testing the Setup

### 1. Test ESP32 Connection

Monitor serial output for:
```
WiFi connected!
IP address: 192.168.1.xxx
Starting HTTP server...
```

### 2. Test Web Application

1. Open browser to `http://localhost:5173`
2. Navigate to Dashboard
3. Check for "ESP32 Connected" status
4. Verify sensor data is updating

### 3. Test Posture Analysis

1. Go to Posture Monitor
2. Allow camera permissions
3. Click "Start Analysis"
4. Verify pose detection is working
5. Check real-time metrics

### 4. Test Gait Analysis

1. Go to Gait Analyzer
2. Click "Start Recording"
3. Walk normally for 10-15 seconds
4. Stop recording
5. Verify analysis results

### 5. Test AI Chatbot

1. Open AI Chatbot
2. Ask: "How can I improve my posture?"
3. Verify AI response is received
4. Check for personalized recommendations

## 🐛 Troubleshooting

### ESP32 Issues

**Problem**: ESP32 won't connect to WiFi
**Solution**: 
- Check WiFi credentials
- Verify 2.4GHz network (ESP32 doesn't support 5GHz)
- Check signal strength

**Problem**: Sensor data not updating
**Solution**:
- Check wiring connections
- Verify MPU6050 is powered (3.3V)
- Monitor serial output for errors

**Problem**: Upload fails
**Solution**:
- Hold BOOT button during upload
- Check USB cable (data, not just power)
- Try different USB port

### Web Application Issues

**Problem**: Camera not working
**Solution**:
- Grant camera permissions
- Use HTTPS in production
- Try different browser

**Problem**: ESP32 data not showing
**Solution**:
- Check Convex backend is running
- Verify environment variables
- Check browser network tab

**Problem**: AI responses not working
**Solution**:
- Verify API keys in environment
- Check Convex logs for errors
- Test API keys independently

### Network Issues

**Problem**: ESP32 can't reach server
**Solution**:
- Check firewall settings
- Verify network connectivity
- Use local IP if needed

**Problem**: CORS errors
**Solution**:
- Check Convex CORS configuration
- Verify deployment URL
- Clear browser cache

## 📊 Performance Optimization

### ESP32 Optimization
- Increase CPU frequency to 240MHz
- Optimize sensor reading frequency
- Use efficient JSON serialization

### Web Application Optimization
- Enable production builds
- Use CDN for static assets
- Optimize image loading

### Database Optimization
- Index frequently queried fields
- Use efficient queries
- Implement data cleanup

## 🔒 Security Considerations

### API Keys
- Never commit API keys to version control
- Use environment variables
- Rotate keys regularly

### Network Security
- Use HTTPS in production
- Implement proper CORS policies
- Validate all input data

### Data Privacy
- No personal data is stored
- Anonymous sessions only
- Local processing where possible

## 📈 Monitoring and Logs

### ESP32 Logs
Monitor serial output for:
- WiFi connection status
- Sensor calibration
- Data transmission errors

### Web Application Logs
Check browser console for:
- JavaScript errors
- Network request failures
- Performance issues

### Backend Logs
Monitor Convex dashboard for:
- Function execution logs
- Database queries
- API call responses

## 🚀 Production Deployment

### Frontend Deployment
1. Build production version: `npm run build`
2. Deploy to Vercel, Netlify, or similar
3. Configure environment variables
4. Set up custom domain

### Backend Deployment
1. Deploy to Convex: `npx convex deploy --prod`
2. Configure production environment
3. Set up monitoring and alerts

### ESP32 Production
1. Test thoroughly with target hardware
2. Implement error recovery
3. Add status LEDs for debugging
4. Consider battery power for mobile use

## 📞 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review the main README.md
3. Check GitHub issues
4. Verify all prerequisites are met
5. Test each component individually

---

**Happy biomechanical analysis!** 🦾
