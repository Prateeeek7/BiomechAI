import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface ESP32Data {
  deviceId: string;
  deviceName: string;
  timestamp: number;
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  gyroscope: {
    x: number;
    y: number;
    z: number;
  };
  angles: {
    yaw: number;
    pitch: number;
    roll: number;
  };
  temperature: number;
  wifiSignal: number;
  batteryLevel: number;
  receivedAt: number;
}

interface ESP32DataReceiverProps {
  onDataReceived: (data: ESP32Data) => void;
  isActive: boolean;
}

export default function ESP32DataReceiver({ onDataReceived, isActive }: ESP32DataReceiverProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastDataReceived, setLastDataReceived] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [dataCount, setDataCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      // Add a small delay to allow the backend to be ready
      const timer = setTimeout(() => {
        startDataReceiver();
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      stopDataReceiver();
    }

    return () => {
      stopDataReceiver();
    };
  }, [isActive]);

  const startDataReceiver = () => {
    setConnectionStatus('connecting');
    
    // Check ESP32 endpoint status
    checkESP32Status();
    
    // Start polling for data
    intervalRef.current = setInterval(() => {
      pollForData();
    }, 1000); // Poll every 1 second to match ESP32 data rate
    
    // Status check every 5 seconds
    statusCheckRef.current = setInterval(() => {
      checkConnectionStatus();
    }, 5000);
  };

  const stopDataReceiver = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (statusCheckRef.current) {
      clearInterval(statusCheckRef.current);
      statusCheckRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const checkESP32Status = async () => {
    try {
      // Use local server where ESP32 is sending real data
      const convexUrl = 'http://localhost:3000';
      
      console.log('Checking ESP32 status at:', `${convexUrl}/api/esp32-status`);
      
      const response = await fetch(`${convexUrl}/api/esp32-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors', // Enable CORS
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('ESP32 Status:', data);
          setConnectionStatus('connected');
          toast.success('ESP32 endpoint ready');
        } else {
          console.log('ESP32 endpoint returned non-JSON response');
          setConnectionStatus('disconnected');
        }
      } else {
        console.log('ESP32 endpoint not available, response status:', response.status);
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.log('ESP32 status check failed (endpoint may not be available yet):', error);
      setConnectionStatus('disconnected');
      // Don't show error toast for this - it's expected during development
    }
  };

  const pollForData = async () => {
    try {
      // Try to get real ESP32 data from local server
      const localServerUrl = 'http://localhost:3000';
      
      try {
        const response = await fetch(`${localServerUrl}/api/esp32-latest`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors', // Enable CORS
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.deviceId) {
            // Check if data is recent (within last 10 seconds)
            const dataAge = Date.now() - (data.receivedAt || 0);
            const isRecentData = dataAge < 10000; // 10 seconds
            
            console.log('ESP32 data received from local server:', {
              data,
              dataAge: dataAge + 'ms',
              isRecentData
            });
            
            if (isRecentData) {
              // Convert server data to our format
              const realData: ESP32Data = {
                deviceId: data.deviceId,
                deviceName: data.deviceName || 'ESP32-BiomechAI-Sensor',
                timestamp: data.timestamp,
                acceleration: data.acceleration,
                gyroscope: data.gyroscope,
                angles: data.angles,
                temperature: data.temperature,
                wifiSignal: data.wifiSignal,
                batteryLevel: data.batteryLevel,
                receivedAt: data.receivedAt || Date.now()
              };
              
              setLastDataReceived(new Date());
              setDataCount(prev => prev + 1);
              setIsConnected(true);
              setConnectionStatus('connected');
              onDataReceived(realData);
              return;
            } else {
              console.log('ESP32 data is too old, treating as disconnected');
              setIsConnected(false);
              setConnectionStatus('disconnected');
              return;
            }
          }
        }
      } catch (serverError) {
        console.log('Local server not available, using realistic simulation');
      }
      
      // Only use simulation if server is completely unavailable
      console.log('Local server not available, skipping data update');
      setIsConnected(false);
      setConnectionStatus('disconnected');
    } catch (error) {
      console.error('Data polling error:', error);
      setErrorCount(prev => prev + 1);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  };

  const checkConnectionStatus = () => {
    if (!lastDataReceived || Date.now() - lastDataReceived.getTime() > 5000) {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  };


  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'disconnected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-blue-500 dark:text-blue-400 mb-4">
        ESP32 WiFi Data Receiver
      </h3>
      
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-gray-900 dark:text-gray-100">Connection Status:</span>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getStatusIcon()}</span>
            <span className={`font-semibold ${getStatusColor()}`}>
              {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
            </span>
          </div>
        </div>

        {/* Data Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Data Received</p>
            <p className="text-2xl font-bold text-blue-600">{dataCount}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Errors</p>
            <p className="text-2xl font-bold text-red-600">{errorCount}</p>
          </div>
        </div>

        {/* Last Data Received */}
        {lastDataReceived && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Last Data Received:</p>
            <p className="font-semibold text-blue-500 dark:text-blue-400">
              {lastDataReceived.toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={checkESP32Status}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Check Status
          </button>
        </div>

        {/* Connection Info */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>• ESP32 connects to WiFi: "Akashesp"</p>
          <p>• Local Server: http://localhost:3000</p>
          <p>• Data Rate: 1Hz (1 second intervals)</p>
          <p>• Protocol: HTTP POST to /api/esp32-data</p>
          <p>• Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
        </div>
      </div>
    </div>
  );
}
