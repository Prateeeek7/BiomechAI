<div align="center">

# BiomechAI - Advanced Biomechanics Analysis Platform

<img src="public/logo.png" alt="BiomechAI Logo" width="200" height="200"/>

*A comprehensive web application that combines ESP32 sensor data collection with AI-powered posture and gait analysis for real-time biomechanical assessment.*

[![React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue.svg)](https://www.typescriptlang.org/)
[![ESP32](https://img.shields.io/badge/ESP32-Arduino-green.svg)](https://www.espressif.com/)
[![AI](https://img.shields.io/badge/AI-Google%20Gemini-purple.svg)](https://ai.google.dev/)

</div>

## 🌟 Features

<div align="center">

### 🔬 **Real-time Biomechanical Analysis**

| **Posture Monitoring** | **Gait Analysis** | **AI Insights** |
|:---:|:---:|:---:|
| 📹 Webcam-based pose detection | 📡 ESP32 sensor data collection | 🤖 Google Gemini AI integration |
| Real-time posture metrics | Step detection & analysis | Personalized recommendations |
| MediaPipe technology | IMU sensor processing | Expert biomechanics advice |

</div>

### 🔧 Hardware Integration
- **ESP32 Microcontroller**: Wireless sensor data transmission
- **MPU6050 IMU Sensor**: 6-axis accelerometer and gyroscope data
- **WiFi Connectivity**: Real-time data streaming to web application

### 🎨 Modern Web Interface
- **React + TypeScript**: Modern, responsive web application
- **Real-time Dashboard**: Live data visualization and statistics
- **Professional Reports**: Comprehensive biomechanical assessment reports
- **AI Chatbot**: Interactive biomechanics expert assistant

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Arduino IDE or PlatformIO
- ESP32 development board
- MPU6050 IMU sensor
- Webcam for posture analysis

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd biomech-final
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Add your Convex deployment URL and API keys to `.env.local`

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Set up Convex backend**
   ```bash
   npx convex dev
   ```

## 🔌 ESP32 Hardware Setup

### Components Required
- ESP32 development board
- MPU6050 IMU sensor
- Jumper wires
- Breadboard (optional)

### Wiring Diagram
```
ESP32    MPU6050
-----    -------
3.3V  -> VCC
GND   -> GND
D21   -> SDA
D22   -> SCL
```

### ESP32 Code Setup

1. **Install Arduino IDE or PlatformIO**
2. **Install required libraries**:
   - WiFi
   - ArduinoJson
   - MPU6050
   - Wire

3. **Upload the code** from `esp32_project/src/main.cpp`

4. **Configure WiFi** in the code:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```

5. **Upload and monitor** the serial output for connection status

## 🏗️ Project Structure

```
biomech-final/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx          # Main dashboard with statistics
│   │   ├── PostureMonitor.tsx     # Real-time posture analysis
│   │   ├── GaitAnalyzer.tsx       # ESP32 gait analysis
│   │   ├── BiomechChatbot.tsx     # AI assistant interface
│   │   ├── ESP32DataReceiver.tsx  # ESP32 data handling
│   │   └── Reports.tsx            # Report generation and viewing
│   ├── lib/
│   │   └── utils.ts               # Utility functions
│   └── App.tsx                    # Main application component
├── convex/
│   ├── schema.ts                  # Database schema
│   ├── posture.ts                 # Posture analysis functions
│   ├── gait.ts                    # Gait analysis functions
│   ├── chat.ts                    # AI chatbot backend
│   ├── reports.ts                 # Report generation
│   └── http.ts                    # ESP32 API endpoints
├── esp32_project/
│   ├── src/
│   │   └── main.cpp               # ESP32 sensor code
│   └── platformio.ini             # PlatformIO configuration
└── README.md
```

## 🔧 Configuration

### Environment Variables
```bash
# Convex Backend
VITE_CONVEX_URL=your_convex_deployment_url
CONVEX_DEPLOYMENT=your_deployment_name
CONVEX_DEPLOY_KEY=your_deploy_key
CONVEX_SITE_URL=your_site_url

# AI APIs
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
GROK_API_KEY=your_grok_api_key
```

### ESP32 Configuration
- Update WiFi credentials in `main.cpp`
- Adjust sensor thresholds if needed
- Configure data transmission frequency

## 📱 Usage

### Posture Analysis
1. Navigate to the Posture Monitor
2. Allow camera permissions
3. Position yourself in front of the camera
4. Click "Start Analysis" to begin monitoring
5. View real-time posture metrics and AI recommendations

### Gait Analysis
1. Ensure ESP32 is connected and streaming data
2. Navigate to the Gait Analyzer
3. Click "Start Recording" to begin gait analysis
4. Walk normally while the system records data
5. Stop recording to view analysis results

### AI Assistant
1. Open the AI Chatbot
2. Ask questions about posture, gait, or biomechanics
3. Get personalized recommendations based on your data
4. Access expert biomechanical insights

### Reports
1. Generate comprehensive reports from your sessions
2. View detailed analysis and recommendations
3. Download reports for professional consultation
4. Track progress over time

## 🧠 AI Integration

### Google Gemini API
- Primary AI provider for chatbot responses
- Comprehensive biomechanical knowledge base
- Personalized recommendations based on user data

### Fallback Systems
- OpenAI API as secondary option
- Internal expert system as final fallback
- Ensures reliable responses at all times

## 📊 Data Analysis

### Posture Metrics
- Forward head angle
- Shoulder tilt
- Spinal alignment
- Sitting position classification
- Posture quality scoring

### Gait Metrics
- Step detection and cadence
- Stride length analysis
- Left-right symmetry
- Stance/swing phase analysis
- Gait pattern classification

## 🔒 Security & Privacy

- No authentication required (open app)
- Anonymous user sessions
- Local data processing where possible
- Secure API key management
- No personal data storage

## 🛠️ Development

### Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Convex (serverless functions)
- **Hardware**: ESP32, MPU6050, Arduino framework
- **AI**: Google Gemini API, OpenAI API
- **Database**: Convex real-time database

### Development Commands
```bash
# Start development server
npm run dev

# Start Convex backend
npx convex dev

# Build for production
npm run build

# Deploy to Convex
npx convex deploy
```

## 📈 Performance

### Optimization Features
- Real-time data streaming
- Efficient sensor data processing
- Optimized AI response caching
- Responsive UI with smooth animations
- Background data processing

## 🐛 Troubleshooting

### Common Issues

1. **ESP32 Connection Issues**
   - Check WiFi credentials
   - Verify sensor wiring
   - Monitor serial output for errors

2. **Camera Not Working**
   - Ensure camera permissions are granted
   - Check browser compatibility
   - Try different browsers

3. **AI Responses Not Working**
   - Verify API keys in environment variables
   - Check Convex deployment status
   - Monitor backend logs

4. **Data Not Streaming**
   - Check ESP32 WiFi connection
   - Verify Convex backend is running
   - Check network connectivity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- MediaPipe for pose detection
- Convex for backend infrastructure
- Google Gemini for AI capabilities
- Arduino community for ESP32 support

## 📞 Support

For support and questions:
- Check the troubleshooting section
- Review the documentation
- Open an issue on GitHub
- Contact: pratik2002singh@gmail.com

---

**BiomechAI** - Transforming biomechanical analysis with AI and IoT technology.