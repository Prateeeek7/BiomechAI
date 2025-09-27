# BiomechAI Requirements

Complete list of all software, hardware, and system requirements for the BiomechAI platform.

## 🖥️ Software Requirements

### Core Development Tools
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher (comes with Node.js)
- **Git** 2.30.0 or higher
- **Modern Web Browser** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### ESP32 Development Environment

#### Option 1: PlatformIO (Recommended)
```bash
# Install PlatformIO CLI
pip install platformio

# Or install PlatformIO IDE extension in VS Code
# Extension ID: platformio.platformio-ide
```

#### Option 2: Arduino IDE
- **Arduino IDE** 2.0.0 or higher
- **ESP32 Board Package** for Arduino IDE
- **ArduinoJson Library** 7.0.4 or higher
- **MPU6050 Library** 1.2.0 or higher

### Backend Services
- **Convex Account** (free tier available)
- **Convex CLI** (installed via npm)
- **Google Gemini API Key** (free tier available)
- **OpenAI API Key** (optional, for fallback)
- **Grok API Key** (optional, for fallback)

## 🔧 Hardware Requirements

### Primary Hardware
- **ESP32 Development Board**
  - ESP32-WROOM-32 (recommended)
  - ESP32-S3 (alternative)
  - ESP32-C3 (alternative)
  - Minimum: 4MB Flash, 520KB RAM

- **MPU6050 IMU Sensor**
  - 6-axis accelerometer + gyroscope
  - I2C interface
  - 3.3V operation

### Connectivity
- **WiFi Network** (2.4GHz, ESP32 doesn't support 5GHz)
- **USB Cable** (data cable, not just power)
- **Internet Connection** for web application

### Optional Hardware
- **Breadboard** (for prototyping)
- **Jumper Wires** (4x male-to-male)
- **Resistors** (4.7kΩ pull-up resistors for I2C, optional)
- **LEDs** (for status indication)
- **Battery Pack** (for mobile operation)

## 📦 Node.js Dependencies

### Production Dependencies
```json
{
  "@convex-dev/auth": "^0.0.80",
  "@mediapipe/camera_utils": "^0.3.1675466862",
  "@mediapipe/drawing_utils": "^0.3.1675466124",
  "@mediapipe/pose": "^0.5.1675469404",
  "@radix-ui/react-slot": "^1.2.3",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "convex": "^1.24.2",
  "cors": "^2.8.5",
  "express": "^5.1.0",
  "framer-motion": "^12.23.12",
  "lucide-react": "^0.544.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "sonner": "^2.0.3",
  "tailwind-merge": "^3.3.1"
}
```

### Development Dependencies
```json
{
  "@eslint/js": "^9.21.0",
  "@types/node": "^22.13.10",
  "@types/react": "^19.0.10",
  "@types/react-dom": "^19.0.4",
  "@vitejs/plugin-react": "^4.3.4",
  "autoprefixer": "~10",
  "dotenv": "^16.4.7",
  "eslint": "^9.21.0",
  "eslint-plugin-react-hooks": "^5.1.0",
  "eslint-plugin-react-refresh": "^0.4.19",
  "globals": "^15.15.0",
  "npm-run-all": "^4.1.5",
  "postcss": "~8",
  "prettier": "^3.5.3",
  "tailwindcss": "~3",
  "typescript": "~5.7.2",
  "typescript-eslint": "^8.24.1",
  "vite": "^6.2.0"
}
```

## 🔌 ESP32 PlatformIO Dependencies

### Core Libraries
```ini
lib_deps = 
    bblanchon/ArduinoJson@^7.0.4
    ElectronicCats/MPU6050@^1.2.0
    adafruit/Adafruit Unified Sensor@^1.1.9
```

### ESP32 Configuration
- **Platform**: espressif32
- **Framework**: arduino
- **Board**: esp32doit-devkit-v1 (or compatible)
- **Upload Speed**: 921600 baud
- **Monitor Speed**: 115200 baud

## 🌐 API Requirements

### Google Gemini API
- **Endpoint**: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
- **Authentication**: API Key
- **Rate Limits**: Free tier includes generous limits
- **Model**: gemini-2.0-flash

### OpenAI API (Optional)
- **Endpoint**: https://api.openai.com/v1/chat/completions
- **Authentication**: Bearer Token
- **Model**: gpt-3.5-turbo
- **Rate Limits**: Pay-per-use

### Grok API (Optional)
- **Endpoint**: https://api.x.ai/v1/chat/completions
- **Authentication**: Bearer Token
- **Model**: grok-beta
- **Rate Limits**: Pay-per-use

## 🖥️ System Requirements

### Operating System
- **Windows** 10/11 (64-bit)
- **macOS** 10.15+ (Intel or Apple Silicon)
- **Linux** Ubuntu 20.04+ or equivalent

### Hardware Specifications
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 2GB free space
- **CPU**: Dual-core 2.0GHz minimum
- **USB Ports**: At least one for ESP32 programming

### Network Requirements
- **Internet Connection**: Stable broadband connection
- **WiFi**: 2.4GHz network for ESP32
- **Ports**: 
  - 5173 (Vite dev server)
  - 3001 (optional local ESP32 server)
  - 80/443 (HTTP/HTTPS for production)

## 📱 Browser Compatibility

### Supported Browsers
- **Google Chrome** 90+
- **Mozilla Firefox** 88+
- **Safari** 14+
- **Microsoft Edge** 90+

### Required Features
- **WebRTC** for camera access
- **WebGL** for 3D rendering
- **ES6+ JavaScript** support
- **Local Storage** for caching
- **Fetch API** for HTTP requests

## 🔐 Security Requirements

### API Keys
- Secure storage of API keys
- Environment variable configuration
- No hardcoded credentials
- Key rotation capability

### Network Security
- HTTPS in production
- CORS configuration
- Input validation
- Rate limiting

### Data Privacy
- No personal data storage
- Anonymous sessions
- Local data processing
- GDPR compliance considerations

## 📊 Performance Requirements

### Real-time Processing
- **ESP32**: 50Hz sensor data rate
- **Web App**: <100ms response time
- **Camera**: 30fps pose detection
- **Database**: <50ms query response

### Scalability
- Support for multiple concurrent users
- Efficient data processing
- Optimized memory usage
- Background task processing

## 🧪 Testing Requirements

### Development Testing
- Unit tests for core functions
- Integration tests for API calls
- Hardware-in-the-loop testing
- Cross-browser compatibility testing

### Performance Testing
- Load testing for concurrent users
- Memory usage monitoring
- Battery life testing (ESP32)
- Network latency testing

## 📋 Installation Commands

### Quick Setup
```bash
# Install Node.js dependencies
npm install

# Install Convex CLI
npm install -g convex

# Install PlatformIO (for ESP32)
pip install platformio

# Install ESP32 libraries
cd esp32_project
pio lib install
```

### Environment Setup
```bash
# Copy environment template
cp env.template .env.local

# Configure Convex
npx convex dev

# Build and upload ESP32 code
pio run --target upload
```

## 🔄 Update Requirements

### Regular Updates
- **Node.js**: Check for security updates monthly
- **Dependencies**: Update npm packages quarterly
- **ESP32 Libraries**: Update when new features needed
- **API Keys**: Rotate annually or when compromised

### Version Compatibility
- Maintain backward compatibility
- Test updates in development environment
- Document breaking changes
- Provide migration guides

---

**Note**: This requirements list ensures a complete, functional BiomechAI system. All components are tested and verified to work together seamlessly.
