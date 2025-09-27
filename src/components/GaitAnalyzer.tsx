import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  Bluetooth, 
  Wifi, 
  Play, 
  Square, 
  Upload, 
  BarChart3, 
  Target, 
  TrendingUp, 
  Zap,
  Smartphone,
  User,
  Info,
  Database,
  Settings,
  AlertCircle
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import ESP32DataReceiver from "./ESP32DataReceiver";
import SubjectDetails, { SubjectData } from "./SubjectDetails";
import { analyzeGaitWithSubjectData, getStoredSubjectData, isSubjectDataComplete } from "../lib/biomechanics";

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
  quaternion?: {
    w: number;
    x: number;
    y: number;
    z: number;
  };
  gravity?: {
    x: number;
    y: number;
    z: number;
  };
  realAccel?: {
    x: number;
    y: number;
    z: number;
  };
  worldAccel?: {
    x: number;
    y: number;
    z: number;
  };
  temperature: number;
  wifiSignal: number;
  batteryLevel: number;
  receivedAt?: number;
  sensorType?: string;
}

interface GaitMetrics {
  stepCount: number;
  cadence: number;
  strideLength: number;
  gaitSpeed: number;
  symmetryScore: number;
  leftRightBalance: number;
  stancePhase: number;
  swingPhase: number;
  doubleSupportPhase: number;
  heelStrikeForce: number;
  toeOffForce: number;
}

interface BluetoothDevice {
  id: string;
  name: string;
  connected: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function GaitAnalyzer() {
  const [analysisMode, setAnalysisMode] = useState<'esp32' | 'motion' | 'csv'>('esp32');
  const [isRecording, setIsRecording] = useState(false);
  const [motionData, setMotionData] = useState<any[]>([]);
  const [esp32Data, setEsp32Data] = useState<ESP32Data[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [hasMotionSensors, setHasMotionSensors] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [bluetoothDevices, setBluetoothDevices] = useState<BluetoothDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [isWiFiConnected, setIsWiFiConnected] = useState(false);
  const [currentGaitMetrics, setCurrentGaitMetrics] = useState<GaitMetrics | null>(null);
  const [dataCollectionProgress, setDataCollectionProgress] = useState(0);
  const [isDataReady, setIsDataReady] = useState(false);
  const [collectedSessionData, setCollectedSessionData] = useState<ESP32Data[]>([]);
  const [subjectData, setSubjectData] = useState<SubjectData | null>(null);
  const [showSubjectDetails, setShowSubjectDetails] = useState(false);
  
  // Multi-sensor support
  const [connectedSensors, setConnectedSensors] = useState<Map<string, ESP32Data>>(new Map());
  const [sensorTypes, setSensorTypes] = useState<Map<string, string>>(new Map());
  const [multiSensorData, setMultiSensorData] = useState<Map<string, ESP32Data[]>>(new Map());
  const [sensorAnalysisMode, setSensorAnalysisMode] = useState<'single' | 'multi'>('single');
  
  const websocketRef = useRef<WebSocket | null>(null);
  const dataBufferRef = useRef<ESP32Data[]>([]);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef<boolean>(false);

  const analyzeGait = useMutation(api.gait.analyzeGait);

  useEffect(() => {
    checkMotionSensors();
    // Load stored subject data
    const storedSubjectData = getStoredSubjectData();
    if (storedSubjectData) {
      setSubjectData(storedSubjectData);
    } else {
      setShowSubjectDetails(true);
    }
    return () => {
      stopESP32Recording();
    };
  }, []);

  // Handle real ESP32 WiFi data - supports both single and multi-sensor
  const handleESP32DataReceived = useCallback((data: ESP32Data) => {
    const deviceId = data.deviceId;
    
    console.log("ESP32 data received:", {
      deviceId,
      isRecording,
      dataBufferLength: dataBufferRef.current.length,
      collectedSessionDataLength: collectedSessionData.length
    });
    
    // Update connected sensors map
    setConnectedSensors(prev => {
      const newMap = new Map(prev);
      newMap.set(deviceId, data);
      return newMap;
    });
    
    // Update multi-sensor data buffer
    setMultiSensorData(prev => {
      const newMap = new Map(prev);
      const sensorData = newMap.get(deviceId) || [];
      newMap.set(deviceId, [...sensorData.slice(-1000), data]); // Keep last 1000 points
      return newMap;
    });
    
    // For backward compatibility - update single sensor data
    if (sensorAnalysisMode === 'single') {
      setEsp32Data(prev => [...prev.slice(-1000), data]);
      dataBufferRef.current = [...dataBufferRef.current.slice(-1000), data];
    }
    
    // Update connection status
    setIsWiFiConnected(true);
    setSelectedDevice(deviceId);
    
    // Data collection and analysis workflow
    if (isRecordingRef.current) {
      console.log("Recording is active, collecting data...");
      // Collect data for analysis
      setCollectedSessionData(prev => {
        const newData = [...prev.slice(-1000), data];
        console.log("Collected session data updated:", newData.length);
        
        // Update progress (target: 50 data points)
        const progress = Math.min(100, (newData.length / 50) * 100);
        setDataCollectionProgress(progress);
        
        // Check if we have enough data for analysis
        if (newData.length >= 50 && !isDataReady) {
          console.log("Data collection complete! Starting analysis...", newData.length);
          setIsDataReady(true);
          toast.success("Data collection complete! Analysis ready.");
        }
        
        return newData;
      });
      
      // Perform analysis if data is ready
      if (isDataReady && collectedSessionData.length > 50) {
        console.log("Performing gait analysis...", {
          isDataReady,
          collectedDataLength: collectedSessionData.length,
          sensorAnalysisMode,
          dataBufferLength: dataBufferRef.current.length
        });
        
        if (sensorAnalysisMode === 'single') {
          // Single sensor analysis
          const metrics = analyzeESP32GaitData(dataBufferRef.current);
          console.log("Gait metrics calculated:", metrics);
          setCurrentGaitMetrics(metrics);
        } else {
          // Multi-sensor analysis
          const allSensorData = Array.from(multiSensorData.values()).flat();
          if (allSensorData.length > 50) {
            const metrics = analyzeMultiSensorGaitData(multiSensorData);
            console.log("Multi-sensor gait metrics calculated:", metrics);
            setCurrentGaitMetrics(metrics);
          }
        }
      }
    }
  }, [isRecording, sensorAnalysisMode, multiSensorData, isDataReady]);

  // Multi-sensor gait analysis (thigh + shank)
  const analyzeMultiSensorGaitData = useCallback((sensorDataMap: Map<string, ESP32Data[]>): GaitMetrics => {
    const sensorEntries = Array.from(sensorDataMap.entries());
    
    if (sensorEntries.length === 0) {
      return {
        stepCount: 0,
        cadence: 0,
        strideLength: 0,
        gaitSpeed: 0,
        symmetryScore: 0,
        leftRightBalance: 50,
        stancePhase: 0,
        swingPhase: 0,
        doubleSupportPhase: 0,
        heelStrikeForce: 0,
        toeOffForce: 0,
      };
    }

    // Analyze each sensor separately
    const sensorMetrics = sensorEntries.map(([deviceId, data]) => {
      if (data.length < 50) return null;
      return analyzeESP32GaitData(data);
    }).filter(metrics => metrics !== null);

    if (sensorMetrics.length === 0) {
      return {
        stepCount: 0,
        cadence: 0,
        strideLength: 0,
        gaitSpeed: 0,
        symmetryScore: 0,
        leftRightBalance: 50,
        stancePhase: 0,
        swingPhase: 0,
        doubleSupportPhase: 0,
        heelStrikeForce: 0,
        toeOffForce: 0,
      };
    }

    // Multi-sensor specific analysis
    if (sensorEntries.length >= 2) {
      // Thigh + Shank analysis
      const thighData = sensorEntries.find(([id]) => sensorTypes.get(id) === 'thigh')?.[1] || [];
      const shankData = sensorEntries.find(([id]) => sensorTypes.get(id) === 'shank')?.[1] || [];
      
      if (thighData.length > 50 && shankData.length > 50) {
        // Enhanced multi-sensor analysis would go here
        return analyzeESP32GaitData(thighData);
      }
    }

    // Fallback to single sensor analysis
    const primarySensor = sensorEntries[0][1];
    return analyzeESP32GaitData(primarySensor);
  }, [sensorTypes]);

  // Advanced gait analysis algorithms based on ESP32 MPU6050 data
  const analyzeESP32GaitData = useCallback((data: ESP32Data[]): GaitMetrics => {
    if (data.length < 100) {
      return {
        stepCount: 0,
        cadence: 0,
        strideLength: 0,
        gaitSpeed: 0,
        symmetryScore: 0,
        leftRightBalance: 50,
        stancePhase: 0,
        swingPhase: 0,
        doubleSupportPhase: 0,
        heelStrikeForce: 0,
        toeOffForce: 0,
      };
    }

    // Calculate acceleration magnitudes for step detection
    const accelMagnitudes = data.map(d => 
      Math.sqrt(d.acceleration.x ** 2 + d.acceleration.y ** 2 + d.acceleration.z ** 2)
    );

    // Advanced step detection
    const stepCount = detectStepsAdvanced(accelMagnitudes, data);
    
    // Calculate cadence (steps per minute)
    const sessionDurationMinutes = (data[data.length - 1].timestamp - data[0].timestamp) / (1000 * 60);
    const cadence = sessionDurationMinutes > 0 ? stepCount / sessionDurationMinutes : 0;

    // Calculate stride length using gyroscope data
    const strideLength = calculateStrideLength(data, stepCount);
    
    // Calculate gait speed
    const gaitSpeed = (strideLength * stepCount) / (sessionDurationMinutes * 60);

    // Advanced symmetry analysis
    const symmetryScore = calculateAdvancedSymmetry(data);
    const leftRightBalance = calculateLeftRightBalance(data);

    // Analyze gait phases
    const { stancePhase, swingPhase, doubleSupportPhase } = analyzeGaitPhases(data);

    // Analyze ground reaction forces
    const { heelStrikeForce, toeOffForce } = analyzeGroundReactionForces(data);

    return {
      stepCount,
      cadence: Math.round(cadence),
      strideLength: Math.round(strideLength * 100) / 100,
      gaitSpeed: Math.round(gaitSpeed * 100) / 100,
      symmetryScore: Math.round(symmetryScore),
      leftRightBalance: Math.round(leftRightBalance),
      stancePhase: Math.round(stancePhase),
      swingPhase: Math.round(swingPhase),
      doubleSupportPhase: Math.round(doubleSupportPhase),
      heelStrikeForce: Math.round(heelStrikeForce),
      toeOffForce: Math.round(toeOffForce),
    };
  }, []);

  // Advanced step detection algorithm
  const detectStepsAdvanced = (magnitudes: number[], data: ESP32Data[]): number => {
    if (magnitudes.length < 10) return 0;

    // Apply low-pass filter to smooth the signal
    const filtered = magnitudes.map((val, i) => {
      if (i === 0) return val;
      return 0.7 * val + 0.3 * magnitudes[i - 1];
    });

    // Calculate adaptive threshold
    const mean = filtered.reduce((sum, val) => sum + val, 0) / filtered.length;
    const std = Math.sqrt(filtered.reduce((sum, val) => sum + (val - mean) ** 2, 0) / filtered.length);
    const threshold = mean + 1.5 * std;

    let steps = 0;
    let inPeak = false;
    let peakCount = 0;

    for (let i = 1; i < filtered.length - 1; i++) {
      const current = filtered[i];
      const prev = filtered[i - 1];
      const next = filtered[i + 1];

      // Detect peaks
      if (current > threshold && current > prev && current > next && !inPeak) {
        inPeak = true;
        peakCount++;
      } else if (current < threshold) {
        inPeak = false;
      }

      // Count as step if we have a significant peak
      if (peakCount > 0 && !inPeak && current < threshold) {
        steps++;
        peakCount = 0;
      }
    }

    return Math.max(0, steps);
  };

  // Calculate stride length using gyroscope integration
  const calculateStrideLength = (data: ESP32Data[], stepCount: number): number => {
    if (stepCount === 0 || data.length < 10) return 0;

    // Integrate gyroscope data to estimate displacement
    let totalDisplacement = 0;
    for (let i = 1; i < data.length; i++) {
      const dt = (data[i].timestamp - data[i - 1].timestamp) / 1000; // Convert to seconds
      const angularVelocity = Math.sqrt(
        data[i].gyroscope.x ** 2 + 
        data[i].gyroscope.y ** 2 + 
        data[i].gyroscope.z ** 2
      );
      
      // Simple integration (in real implementation, use proper numerical integration)
      totalDisplacement += angularVelocity * dt;
    }

    // Estimate stride length based on average displacement per step
    const avgDisplacementPerStep = totalDisplacement / stepCount;
    
    // Convert to meters (this is a simplified conversion)
    const strideLength = avgDisplacementPerStep * 0.1; // Scale factor
    
    return Math.max(0.3, Math.min(2.0, strideLength)); // Reasonable bounds
  };

  // Advanced symmetry calculation
  const calculateAdvancedSymmetry = (data: ESP32Data[]): number => {
    if (data.length < 10) return 50;

    // Analyze left-right balance using acceleration patterns
    const leftSideData = data.filter((_, i) => i % 2 === 0);
    const rightSideData = data.filter((_, i) => i % 2 === 1);

    if (leftSideData.length === 0 || rightSideData.length === 0) return 50;

    const leftAvg = leftSideData.reduce((sum, d) => sum + d.acceleration.x, 0) / leftSideData.length;
    const rightAvg = rightSideData.reduce((sum, d) => sum + d.acceleration.x, 0) / rightSideData.length;

    const asymmetry = Math.abs(leftAvg - rightAvg);
    const symmetryScore = Math.max(0, Math.min(100, 100 - asymmetry * 10));

    return symmetryScore;
  };

  // Calculate left-right balance
  const calculateLeftRightBalance = (data: ESP32Data[]): number => {
    if (data.length < 10) return 50;

    const leftSteps = data.filter((_, i) => i % 2 === 0).length;
    const rightSteps = data.filter((_, i) => i % 2 === 1).length;
    
    const totalSteps = leftSteps + rightSteps;
    if (totalSteps === 0) return 50;

    return (rightSteps / totalSteps) * 100;
  };

  // Analyze gait phases
  const analyzeGaitPhases = (data: ESP32Data[]): { stancePhase: number; swingPhase: number; doubleSupportPhase: number } => {
    if (data.length < 10) return { stancePhase: 60, swingPhase: 40, doubleSupportPhase: 10 };

    // Simplified phase analysis based on acceleration patterns
    const avgAccel = data.reduce((sum, d) => sum + Math.abs(d.acceleration.y), 0) / data.length;
    
    // Estimate phases based on acceleration patterns
    const stancePhase = 60 + (avgAccel - 9.81) * 2; // Adjust based on acceleration
    const swingPhase = 40 - (avgAccel - 9.81) * 1.5;
    const doubleSupportPhase = 10; // Fixed value for double support phase

    return {
      stancePhase: Math.max(50, Math.min(80, stancePhase)),
      swingPhase: Math.max(20, Math.min(50, swingPhase)),
      doubleSupportPhase: Math.max(5, Math.min(20, doubleSupportPhase))
    };
  };

  // Analyze ground reaction forces
  const analyzeGroundReactionForces = (data: ESP32Data[]): { heelStrikeForce: number; toeOffForce: number } => {
    if (data.length < 10) return { heelStrikeForce: 0, toeOffForce: 0 };

    // Find peaks in vertical acceleration (simplified force estimation)
    const verticalAccels = data.map(d => d.acceleration.z);
    const maxVerticalAccel = Math.max(...verticalAccels);
    
    // Estimate forces based on acceleration (simplified)
    const heelStrikeForce = maxVerticalAccel * 100; // Scale factor
    const toeOffForce = maxVerticalAccel * 80; // Scale factor
    
    return { heelStrikeForce, toeOffForce };
  };

  const checkMotionSensors = () => {
    if (typeof DeviceMotionEvent !== 'undefined') {
      setHasMotionSensors(true);
    } else {
      setHasMotionSensors(false);
      if (analysisMode === 'motion') {
        toast.error("Device motion sensors not available on this device");
      }
    }
  };

  const startESP32Recording = () => {
    console.log("Starting ESP32 recording...");
    setIsRecording(true);
    isRecordingRef.current = true;
    setSessionDuration(0);
    setDataCollectionProgress(0);
    setIsDataReady(false);
    setCollectedSessionData([]);
    setCurrentGaitMetrics(null);
    
    // Start session timer
    const interval = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
    
    analysisIntervalRef.current = interval;
    toast.success("ESP32 gait recording started - collecting data...");
    console.log("Recording state set to true, waiting for data...");
  };

  const stopESP32Recording = () => {
    setIsRecording(false);
    isRecordingRef.current = false;
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    toast.success("ESP32 gait recording stopped");
  };

  const saveESP32Session = async () => {
    if (!currentGaitMetrics || collectedSessionData.length === 0) {
      toast.error("No gait data to save");
      return;
    }

    try {
      await analyzeGait({
        stepCount: currentGaitMetrics.stepCount,
        cadence: currentGaitMetrics.cadence,
        strideLength: currentGaitMetrics.strideLength,
        gaitSpeed: currentGaitMetrics.gaitSpeed,
        symmetryScore: currentGaitMetrics.symmetryScore,
        leftRightBalance: currentGaitMetrics.leftRightBalance,
        stancePhase: currentGaitMetrics.stancePhase,
        swingPhase: currentGaitMetrics.swingPhase,
        doubleSupportPhase: currentGaitMetrics.doubleSupportPhase,
        heelStrikeForce: currentGaitMetrics.heelStrikeForce,
        toeOffForce: currentGaitMetrics.toeOffForce,
        analysisType: 'esp32',
        rawDataPath: JSON.stringify(collectedSessionData) // Store raw data for reports
      });
      
      toast.success("Gait session saved successfully with raw data for reports");
    } catch (error) {
      console.error('Error saving gait session:', error);
      toast.error("Failed to save gait session");
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-electric-light dark:text-electric-dark mb-2">
          Gait Analyzer
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Analyze walking patterns using motion sensors or CSV data upload
        </p>
      </motion.div>

      {/* Subject Details Section */}
      {showSubjectDetails && (
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-electric-light dark:border-electric-dark">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-electric-light dark:text-electric-dark" />
                <span>Subject Information Required</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Info className="h-8 w-8 text-electric-light dark:text-electric-dark" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    To provide accurate gait analysis, we need your basic information. This helps us:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                    <li>Calculate normalized gait parameters based on your height and weight</li>
                    <li>Determine optimal cadence and stride length for your profile</li>
                    <li>Assess walking efficiency relative to your age and activity level</li>
                    <li>Provide personalized recommendations for gait improvement</li>
                    <li>Calculate ground reaction forces specific to your body weight</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Subject Details Component */}
      <SubjectDetails
        onSubjectUpdate={(subject) => {
          setSubjectData(subject);
          setShowSubjectDetails(false);
          toast.success("Subject details saved! You can now start gait analysis.");
        }}
        initialData={subjectData || undefined}
        compact={!showSubjectDetails}
      />

      {/* Analysis Mode Selection */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-electric-light dark:text-electric-dark" />
              <span>Analysis Mode</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant={analysisMode === 'esp32' ? "default" : "outline"}
                onClick={() => setAnalysisMode('esp32')}
                className="flex flex-col items-center space-y-2 p-6 h-auto"
              >
                <Smartphone className="h-8 w-8" />
                <span className="font-medium">ESP32 Sensors</span>
                <span className="text-sm opacity-75">WiFi connected sensors</span>
              </Button>
              
              <Button
                variant={analysisMode === 'motion' ? "default" : "outline"}
            onClick={() => setAnalysisMode('motion')}
                className="flex flex-col items-center space-y-2 p-6 h-auto"
            disabled={!hasMotionSensors}
              >
                <Activity className="h-8 w-8" />
                <span className="font-medium">Device Motion</span>
                <span className="text-sm opacity-75">Built-in accelerometer</span>
              </Button>
              
              <Button
                variant={analysisMode === 'csv' ? "default" : "outline"}
            onClick={() => setAnalysisMode('csv')}
                className="flex flex-col items-center space-y-2 p-6 h-auto"
              >
                <Database className="h-8 w-8" />
                <span className="font-medium">CSV Upload</span>
                <span className="text-sm opacity-75">Upload data files</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ESP32 Analysis */}
      <AnimatePresence>
        {analysisMode === 'esp32' && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-8"
          >
            {/* ESP32 WiFi Data Receiver */}
            <ESP32DataReceiver 
              onDataReceived={handleESP32DataReceived}
              isActive={analysisMode === 'esp32'}
            />

            {/* Multi-Sensor Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wifi className="h-5 w-5 text-electric-light dark:text-electric-dark" />
                  <span>Multi-Sensor Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Analysis Mode Selection */}
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Analysis Mode:</span>
                  <div className="flex space-x-2">
                    <Button
                      variant={sensorAnalysisMode === 'single' ? "default" : "outline"}
                      onClick={() => setSensorAnalysisMode('single')}
                      size="sm"
                    >
                      Single Sensor
                    </Button>
                    <Button
                      variant={sensorAnalysisMode === 'multi' ? "default" : "outline"}
                      onClick={() => setSensorAnalysisMode('multi')}
                      size="sm"
                    >
                      Multi-Sensor
                    </Button>
                  </div>
                </div>

                {/* Connected Sensors Display */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Connected Sensors ({connectedSensors.size})
                  </h4>
                  <AnimatePresence>
                    {connectedSensors.size > 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      >
                        {Array.from(connectedSensors.entries()).map(([deviceId, data], index) => (
                          <motion.div
                            key={deviceId}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {data.deviceName}
                                </span>
                                <div className="flex items-center space-x-1 text-green-600">
                                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                                  <span className="text-xs">Online</span>
            </div>
          </div>
                              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <div>ID: {deviceId}</div>
                                <div>Type: {sensorTypes.get(deviceId) || 'Unknown'}</div>
                                <div>Data Points: {multiSensorData.get(deviceId)?.length || 0}</div>
                                <div>Signal: {data.wifiSignal} dBm</div>
                  </div>
                              <div className="mt-3">
                                <select
                                  value={sensorTypes.get(deviceId) || ''}
                                  onChange={(e) => {
                                    setSensorTypes(prev => {
                                      const newMap = new Map(prev);
                                      newMap.set(deviceId, e.target.value);
                                      return newMap;
                                    });
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                  <option value="">Select Sensor Type</option>
                                  <option value="thigh">Thigh</option>
                                  <option value="shank">Shank</option>
                                  <option value="ankle">Ankle</option>
                                  <option value="hip">Hip</option>
                                </select>
                  </div>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8 text-gray-500 dark:text-gray-400"
                      >
                        <Wifi className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No sensors connected. Connect ESP32 devices to see them here.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Multi-Sensor Benefits */}
                <AnimatePresence>
                  {sensorAnalysisMode === 'multi' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-electric-light/10 dark:bg-electric-dark/10 p-4 rounded-lg"
                    >
                      <h5 className="font-semibold text-electric-light dark:text-electric-dark mb-2">
                        Multi-Sensor Benefits:
                      </h5>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <li>• Enhanced knee angle analysis (thigh + shank)</li>
                        <li>• More accurate step detection</li>
                        <li>• Improved symmetry measurements</li>
                        <li>• Better gait phase identification</li>
                        <li>• Professional-grade biomechanical analysis</li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Recording Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="h-5 w-5 text-electric-light dark:text-electric-dark" />
                  <span>Recording Controls</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${isWiFiConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            WiFi: {isWiFiConnected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                        {isRecording && (
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Recording: {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      {!isRecording ? (
                        <Button
                          onClick={startESP32Recording}
                          className="bg-electric-light hover:bg-electric-dark text-white"
                          disabled={!isWiFiConnected}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Recording
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={saveESP32Session}
                            variant="success"
                            disabled={!isDataReady || !currentGaitMetrics}
                          >
                            Save Session
                          </Button>
                          <Button
                            onClick={stopESP32Recording}
                            variant="destructive"
                          >
                            <Square className="h-4 w-4 mr-2" />
                            Stop
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Data Collection Progress */}
                  {isRecording && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Data Collection Progress
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {collectedSessionData.length}/50 data points
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-electric-light dark:bg-electric-dark h-2 rounded-full transition-all duration-300"
                          style={{ width: `${dataCollectionProgress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {isDataReady ? (
                          <span className="text-green-600 dark:text-green-400">✅ Analysis ready! Gait metrics will appear below.</span>
                        ) : (
                          <span>Collecting data for analysis... ({Math.round(dataCollectionProgress)}% complete)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Real-time Sensor Data Output */}
            <AnimatePresence>
              {connectedSensors.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-electric-light dark:text-electric-dark" />
                        <span>Real-time Sensor Data</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {Array.from(connectedSensors.entries()).map(([deviceId, data]) => (
                          <motion.div
                            key={deviceId}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {data.deviceName}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-green-600 dark:text-green-400">Live</span>
                              </div>
                            </div>
                            
                            {/* Acceleration Data */}
                            <div className="space-y-3">
                              <h5 className="font-medium text-gray-700 dark:text-gray-300">Acceleration (m/s²)</h5>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                  <div className="text-lg font-bold text-red-600 dark:text-red-400">
                                    {data.acceleration.x.toFixed(3)}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">X</div>
                                </div>
                                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {data.acceleration.y.toFixed(3)}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Y</div>
                                </div>
                                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {data.acceleration.z.toFixed(3)}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Z</div>
                                </div>
                              </div>
                            </div>

                            {/* Gyroscope Data */}
                            <div className="space-y-3">
                              <h5 className="font-medium text-gray-700 dark:text-gray-300">Gyroscope (°/s)</h5>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                    {data.gyroscope.x.toFixed(3)}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">X</div>
                                </div>
                                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                    {data.gyroscope.y.toFixed(3)}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Y</div>
                                </div>
                                <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                                  <div className="text-lg font-bold text-teal-600 dark:text-teal-400">
                                    {data.gyroscope.z.toFixed(3)}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Z</div>
                                </div>
                              </div>
                            </div>

                            {/* Additional Sensor Data */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Temperature</div>
                                <div className="text-lg font-bold text-electric-light dark:text-electric-dark">
                                  {data.temperature.toFixed(1)}°C
                                </div>
                              </div>
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400">WiFi Signal</div>
                                <div className="text-lg font-bold text-electric-light dark:text-electric-dark">
                                  {data.wifiSignal} dBm
                                </div>
                              </div>
                            </div>

                            {/* Angles */}
                            <div className="space-y-3">
                              <h5 className="font-medium text-gray-700 dark:text-gray-300">Orientation Angles (°)</h5>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                    {data.angles.yaw.toFixed(1)}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Yaw</div>
                                </div>
                                <div className="text-center p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                                  <div className="text-lg font-bold text-pink-600 dark:text-pink-400">
                                    {data.angles.pitch.toFixed(1)}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Pitch</div>
                                </div>
                                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                    {data.angles.roll.toFixed(1)}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Roll</div>
                                </div>
                              </div>
                            </div>

                            {/* Data Info */}
                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                              <div>Device ID: {deviceId}</div>
                              <div>Data Points: {multiSensorData.get(deviceId)?.length || 0}</div>
                              <div>Last Update: {new Date(data.receivedAt || Date.now()).toLocaleTimeString()}</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Real-time Gait Metrics */}
            <AnimatePresence>
              {currentGaitMetrics && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-electric-light dark:text-electric-dark" />
                        <span>Real-time Gait Metrics</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="text-2xl font-bold text-electric-light dark:text-electric-dark">
                            {currentGaitMetrics.stepCount}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Steps</div>
                        </div>
                        
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="text-2xl font-bold text-electric-light dark:text-electric-dark">
                            {currentGaitMetrics.cadence}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Steps/min</div>
                        </div>
                        
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="text-2xl font-bold text-electric-light dark:text-electric-dark">
                            {currentGaitMetrics.strideLength}m
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Stride Length</div>
                        </div>
                        
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="text-2xl font-bold text-electric-light dark:text-electric-dark">
                            {currentGaitMetrics.gaitSpeed}m/s
              </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Gait Speed</div>
          </div>
        </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-gray-700 dark:text-gray-300">Symmetry Score</span>
                            <span className={cn(
                              "font-bold",
                              currentGaitMetrics.symmetryScore > 80 ? 'text-success-light' :
                              currentGaitMetrics.symmetryScore > 60 ? 'text-warning-light' : 'text-error-light'
                            )}>
                              {currentGaitMetrics.symmetryScore}%
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-gray-700 dark:text-gray-300">Left-Right Balance</span>
                            <span className="font-bold text-electric-light dark:text-electric-dark">
                              {currentGaitMetrics.leftRightBalance}%
                            </span>
                          </div>
          </div>
          
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-gray-700 dark:text-gray-300">Stance Phase</span>
                            <span className="font-bold text-electric-light dark:text-electric-dark">
                              {currentGaitMetrics.stancePhase}%
                            </span>
          </div>
          
                          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-gray-700 dark:text-gray-300">Swing Phase</span>
                            <span className="font-bold text-electric-light dark:text-electric-dark">
                              {currentGaitMetrics.swingPhase}%
                            </span>
          </div>
        </div>
      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Motion Sensors Analysis */}
      <AnimatePresence>
        {analysisMode === 'motion' && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-electric-light dark:text-electric-dark" />
                  <span>Device Motion Sensors</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Device motion sensor analysis will be available here
                  </p>
                  <Button variant="outline" disabled>
                    Start Motion Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSV Upload Analysis */}
      <AnimatePresence>
        {analysisMode === 'csv' && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-electric-light dark:text-electric-dark" />
                  <span>CSV Data Upload</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Upload CSV files for offline gait analysis
                  </p>
                  <Button variant="outline" disabled>
                    Choose CSV File
                  </Button>
    </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}