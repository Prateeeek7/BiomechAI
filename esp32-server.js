const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Store ESP32 data
let latestData = null;
let dataCount = 0;

// ESP32 Data Reception Endpoint
app.post('/api/esp32-data', (req, res) => {
  try {
    const data = req.body;
    
    // Validate required fields
    if (!data.deviceId || !data.timestamp || !data.acceleration || !data.gyroscope) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Store the latest data
    latestData = {
      ...data,
      receivedAt: Date.now(),
      serverTimestamp: new Date().toISOString()
    };
    
    dataCount++;
    
    console.log(`ESP32 Data #${dataCount} received:`, {
      deviceId: data.deviceId,
      timestamp: data.timestamp,
      acceleration: data.acceleration,
      gyroscope: data.gyroscope,
      temperature: data.temperature
    });
    
    res.json({ 
      success: true, 
      message: 'ESP32 data received successfully',
      dataCount: dataCount
    });
  } catch (error) {
    console.error('Error processing ESP32 data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ESP32 Status Endpoint
app.get('/api/esp32-status', (req, res) => {
  res.json({
    status: 'ready',
    message: 'ESP32 endpoint is operational',
    latestData: latestData,
    dataCount: dataCount,
    timestamp: new Date().toISOString()
  });
});

// Get Latest Data Endpoint
app.get('/api/esp32-latest', (req, res) => {
  res.json(latestData);
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`ESP32 Data Server running on http://0.0.0.0:${port}`);
  console.log(`ESP32 should send data to: http://10.209.11.147:${port}/api/esp32-data`);
});
