import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Video, Play, Square, Maximize2, Minimize2, Activity, Target, TrendingUp, AlertCircle, CheckCircle, Triangle, RotateCcw, HelpCircle, Hand, HandHeart, Footprints, Zap, User, Info, BarChart3 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { Camera as MediaPipeCamera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import SubjectDetails, { SubjectData } from "./SubjectDetails";
import { analyzePostureWithSubjectData, getStoredSubjectData, isSubjectDataComplete } from "../lib/biomechanics";

interface PostureData {
  forwardHeadAngle: number;
  shoulderTilt: number;
  neckAngle: number;
  spineAlignment: number;
  leftShoulderHeight: number;
  rightShoulderHeight: number;
  headTilt: number;
  sittingPosition: 'straight' | 'hunchback' | 'reclined' | 'unknown';
  handFolding: boolean;
  kneeling: boolean;
  spineAngle: number;
  earToHipAngle: number;
  postureScore: number;
  keypointConfidence: number;
}

interface PostureCorrection {
  type: 'warning' | 'error' | 'success';
  message: string;
  instruction: string;
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

export default function PostureMonitor() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentPosture, setCurrentPosture] = useState<PostureData | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [hasCamera, setHasCamera] = useState(false);
  const [corrections, setCorrections] = useState<PostureCorrection[]>([]);
  const [isMediaPipeLoaded, setIsMediaPipeLoaded] = useState(false);
  const [videoPlayerSize, setVideoPlayerSize] = useState<'half' | 'full'>('half');
  const [recordedSessionData, setRecordedSessionData] = useState<PostureData[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [subjectData, setSubjectData] = useState<SubjectData | null>(null);
  const [showSubjectDetails, setShowSubjectDetails] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const poseRef = useRef<Pose | null>(null);
  const cameraRef = useRef<MediaPipeCamera | null>(null);
  const isRecordingRef = useRef<boolean>(false);

  const analyzePosture = useMutation(api.posture.analyzePosture);

  const startAnalysis = () => {
    startCamera();
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    stopCamera();
    setCurrentPosture(null);
    setCorrections([]);
  };

  useEffect(() => {
    checkCameraAvailability();
    initializeMediaPipe();
    // Load stored subject data
    const storedSubjectData = getStoredSubjectData();
    if (storedSubjectData) {
      setSubjectData(storedSubjectData);
    } else {
      setShowSubjectDetails(true);
    }
    return () => {
      stopCamera();
    };
  }, []);

  const checkCameraAvailability = async () => {
    try {
      // First check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia is not supported');
        setHasCamera(false);
        return;
      }

      // Try to get camera permission first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // If we get here, camera is available
        stream.getTracks().forEach(track => track.stop()); // Stop the test stream
        setHasCamera(true);
        console.log('Camera is available');
      } catch (permissionError) {
        console.log('Camera permission not granted or camera not available:', permissionError);
        // Even if permission is denied, we might still have a camera
        // So we'll set it to true and let the user try to start it
        setHasCamera(true);
      }
    } catch (error) {
      console.error('Error checking camera:', error);
      setHasCamera(false);
    }
  };

  const initializeMediaPipe = async () => {
    try {
      console.log('Initializing MediaPipe...');
      toast.info("Loading AI pose detection...");
      
      const pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults(onPoseResults);
      poseRef.current = pose;
      setIsMediaPipeLoaded(true);
      
      console.log('MediaPipe initialized successfully');
      toast.success("AI pose detection ready!");
    } catch (error) {
      console.error('Error initializing MediaPipe:', error);
      toast.error("Failed to initialize pose detection. Please refresh the page and try again.");
      setIsMediaPipeLoaded(false);
    }
  };

  const onPoseResults = useCallback((results: any) => {
    if (!canvasRef.current || !results.poseLandmarks) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw pose landmarks and connections
    drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: '#00FF00',
      lineWidth: 2
    });
    drawLandmarks(ctx, results.poseLandmarks, {
      color: '#FF0000',
      lineWidth: 1,
      radius: 3
    });

    // Analyze posture
    const postureData = analyzePostureFromLandmarks(results.poseLandmarks);
    setCurrentPosture(postureData);

    // Collect data during recording
    if (isRecordingRef.current) {
      setRecordedSessionData(prev => {
        const newData = [...prev, postureData];
        // Keep only last 1000 data points to prevent memory issues
        return newData.slice(-1000);
      });
    }

    // Generate corrections
    const newCorrections = generatePostureCorrections(postureData);
    setCorrections(newCorrections);
  }, []);

  const analyzePostureFromLandmarks = (landmarks: any[]): PostureData => {
    // Extract key points
    const nose = landmarks[0];
    const leftEye = landmarks[2];
    const rightEye = landmarks[5];
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    // Calculate forward head angle (how far forward the head is from shoulders)
    const earMidpoint = {
      x: (leftEar.x + rightEar.x) / 2,
      y: (leftEar.y + rightEar.y) / 2
    };
    const shoulderMidpoint = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    
    // Calculate horizontal distance between ear and shoulder (forward head posture)
    const horizontalDistance = Math.abs(earMidpoint.x - shoulderMidpoint.x);
    // Convert to a reasonable angle (0-30 degrees is normal range)
    const forwardHeadAngle = Math.min(horizontalDistance * 30, 30);
    
    // Debug logging for posture calculations
    console.log("Posture calculations:", {
      horizontalDistance,
      forwardHeadAngle,
      earMidpoint,
      shoulderMidpoint
    });

    // Calculate shoulder tilt
    const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y) * 100;

    // Calculate spine alignment (how straight the spine is)
    const hipMidpoint = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };
    
    // Calculate the angle of the spine (shoulder to hip line)
    const spineAngle = Math.abs(Math.atan2(
      shoulderMidpoint.x - hipMidpoint.x,
      shoulderMidpoint.y - hipMidpoint.y
    )) * 180 / Math.PI;
    
    // Convert to spine alignment percentage (90° is straight, closer to 90° = better alignment)
    const spineAlignment = Math.max(0, 100 - Math.abs(spineAngle - 90) * 2);

    // Calculate head tilt
    const headTilt = Math.abs(leftEye.y - rightEye.y) * 100;

    // Advanced posture analysis
    const sittingPosition = classifySittingPosition(earMidpoint, shoulderMidpoint, leftHip, rightHip);
    const handFolding = detectHandFolding(landmarks);
    const kneeling = detectKneeling(landmarks);
    const earToHipAngle = calculateEarToHipAngle(earMidpoint, leftHip, rightHip);
    
    // Calculate posture score
    const postureScore = calculatePostureScore(
      forwardHeadAngle, shoulderTilt, spineAlignment, headTilt, sittingPosition
    );

    // Calculate keypoint confidence
    const keypointConfidence = calculateKeypointConfidence(landmarks);

    return {
      forwardHeadAngle,
      shoulderTilt,
      neckAngle: forwardHeadAngle,
      spineAlignment: spineAlignment,
      leftShoulderHeight: leftShoulder.y * 100,
      rightShoulderHeight: rightShoulder.y * 100,
      headTilt,
      sittingPosition,
      handFolding,
      kneeling,
      spineAngle: spineAngle,
      earToHipAngle,
      postureScore,
      keypointConfidence
    };
  };

  const classifySittingPosition = (ear: any, shoulder: any, leftHip: any, rightHip: any): 'straight' | 'hunchback' | 'reclined' | 'unknown' => {
    const hipMidpoint = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
    
    // Calculate horizontal distance from ear to shoulder (forward head posture)
    const horizontalDistance = Math.abs(ear.x - shoulder.x);
    
    // Calculate vertical distance from ear to hip (posture height)
    const verticalDistance = Math.abs(ear.y - hipMidpoint.y);
    
    // If head is significantly forward of shoulders, it's hunchback
    if (horizontalDistance > 0.05) return 'hunchback';
    
    // If head is significantly higher than normal, it's reclined
    if (verticalDistance < 0.3) return 'reclined';
    
    return 'straight';
  };

  const detectHandFolding = (landmarks: any[]): boolean => {
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    
    const distance = Math.sqrt(
      Math.pow(leftWrist.x - rightWrist.x, 2) + Math.pow(leftWrist.y - rightWrist.y, 2)
    );
    
    return distance < 0.1;
  };

  const detectKneeling = (landmarks: any[]): boolean => {
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    
    const leftKneeHeight = leftKnee.y;
    const rightKneeHeight = rightKnee.y;
    const leftAnkleHeight = leftAnkle.y;
    const rightAnkleHeight = rightAnkle.y;
    
    return (leftKneeHeight > leftAnkleHeight && rightKneeHeight > rightAnkleHeight);
  };

  const calculateEarToHipAngle = (ear: any, leftHip: any, rightHip: any): number => {
    const hipMidpoint = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
    return Math.abs(Math.atan2(ear.x - hipMidpoint.x, ear.y - hipMidpoint.y)) * 180 / Math.PI;
  };

  const calculatePostureScore = (
    forwardHead: number,
    shoulderTilt: number,
    spineAlignment: number,
    headTilt: number,
    sittingPosition: string
  ): number => {
    let score = 100;
    
    // Forward head posture (0-30 degrees, lower is better)
    if (forwardHead > 10) score -= Math.min(30, (forwardHead - 10) * 3);
    
    // Shoulder tilt (0-100%, lower is better)
    if (shoulderTilt > 5) score -= Math.min(20, (shoulderTilt - 5) * 2);
    
    // Spine alignment (0-100%, higher is better)
    if (spineAlignment < 80) score -= Math.min(25, (80 - spineAlignment) * 0.5);
    
    // Head tilt (0-100%, lower is better)
    if (headTilt > 5) score -= Math.min(15, (headTilt - 5) * 2);
    
    // Sitting position penalties
    if (sittingPosition === 'hunchback') score -= 25;
    else if (sittingPosition === 'reclined') score -= 15;
    
    return Math.max(0, Math.min(100, score));
  };

  const calculateKeypointConfidence = (landmarks: any[]): number => {
    const totalConfidence = landmarks.reduce((sum, landmark) => sum + (landmark.visibility || 0), 0);
    return (totalConfidence / landmarks.length) * 100;
  };


  const generatePostureCorrections = (posture: PostureData): PostureCorrection[] => {
    const corrections: PostureCorrection[] = [];

    if (posture.forwardHeadAngle > 25) {
      corrections.push({
        type: 'error',
        message: 'Forward head posture detected',
        instruction: 'Pull your head back and align your ears over your shoulders'
      });
    } else if (posture.forwardHeadAngle > 15) {
      corrections.push({
        type: 'warning',
        message: 'Slight forward head posture',
        instruction: 'Gently pull your head back to improve alignment'
      });
    }

    if (posture.shoulderTilt > 10) {
      corrections.push({
        type: 'warning',
        message: 'Uneven shoulders detected',
        instruction: 'Relax your shoulders and try to level them'
      });
    }

    if (posture.spineAlignment > 15) {
      corrections.push({
        type: 'error',
        message: 'Spine misalignment detected',
        instruction: 'Sit up straight and align your spine'
      });
    }

    if (posture.sittingPosition === 'hunchback') {
      corrections.push({
        type: 'error',
        message: 'Hunched posture detected',
        instruction: 'Straighten your back and pull your shoulders back'
      });
    } else if (posture.sittingPosition === 'reclined') {
      corrections.push({
        type: 'warning',
        message: 'Reclined posture detected',
        instruction: 'Sit up more upright for better posture'
      });
    }

    if (posture.handFolding) {
      corrections.push({
        type: 'warning',
        message: 'Hands folded/crossed',
        instruction: 'Keep your hands relaxed at your sides'
      });
    }

    if (posture.kneeling) {
      corrections.push({
        type: 'warning',
        message: 'Kneeling position detected',
        instruction: 'Sit normally with feet flat on the ground'
      });
    }

    if (posture.postureScore < 60) {
      corrections.push({
        type: 'error',
        message: 'Overall posture needs improvement',
        instruction: 'Focus on maintaining a straight back and aligned head'
      });
    } else if (posture.postureScore < 80) {
      corrections.push({
        type: 'warning',
        message: 'Good posture with room for improvement',
        instruction: 'Continue working on maintaining proper alignment'
      });
    } else {
      corrections.push({
        type: 'success',
        message: 'Excellent posture!',
        instruction: 'Keep up the great work maintaining good posture'
      });
    }

    if (posture.keypointConfidence < 60) {
      corrections.push({
        type: 'warning',
        message: 'Low detection confidence',
        instruction: 'Ensure you are fully visible in the camera frame'
      });
    }

    return corrections;
  };

  const startCamera = async () => {
    // Check if subject data is available
    if (!subjectData || !isSubjectDataComplete(subjectData)) {
      toast.error("Please complete subject details before starting analysis");
      setShowSubjectDetails(true);
      return;
    }

    if (!isMediaPipeLoaded) {
      toast.error("Pose detection not ready yet. Please wait a moment and try again.");
      return;
    }

    try {
      console.log('Requesting camera access...');
      toast.info("Requesting camera permission...");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user' // Use front camera if available
        }
      });

      console.log('Camera stream obtained:', stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          
          const camera = new MediaPipeCamera(videoRef.current!, {
            onFrame: async () => {
              if (poseRef.current && videoRef.current) {
                await poseRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });

          cameraRef.current = camera;
          camera.start();
          setIsAnalyzing(true);
          startTimeRef.current = Date.now();

          // Start session timer
          intervalRef.current = setInterval(() => {
            setSessionDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
          }, 1000);

          toast.success("Posture analysis started successfully!");
        };
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      
      let errorMessage = "Failed to start camera";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera permission denied. Please allow camera access and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found. Please connect a camera and try again.";
        } else if (error.name === 'NotReadableError') {
          errorMessage = "Camera is being used by another application. Please close other apps and try again.";
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsAnalyzing(false);
    setSessionDuration(0);
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingStartTime(Date.now());
    setRecordedSessionData([]); // Clear previous data
    isRecordingRef.current = true;
    toast.success("Recording started");
  };

  const stopRecording = () => {
    setIsRecording(false);
    isRecordingRef.current = false;
    const recordingDuration = Date.now() - recordingStartTime;
    setSessionDuration(recordingDuration);
    toast.success(`Recording stopped. Duration: ${Math.round(recordingDuration / 1000)}s`);
  };

  const saveSession = async () => {
    if (recordedSessionData.length === 0) {
      toast.error("No recording data to save. Please record a session first.");
      return;
    }

    try {
      console.log("Starting save session with data points:", recordedSessionData.length);
      console.log("Raw recorded session data:", recordedSessionData);
      
      // Calculate average values from recorded data
      const avgPosture = calculateAveragePosture(recordedSessionData);
      const recordingDuration = sessionDuration || (Date.now() - recordingStartTime);
      
      console.log("Average posture data:", avgPosture);
      console.log("Recording duration:", recordingDuration);
      console.log("About to send to analyzePosture mutation:", {
        forwardHeadAngle: avgPosture.forwardHeadAngle,
        shoulderTilt: avgPosture.shoulderTilt,
        neckAngle: avgPosture.neckAngle,
        spineAlignment: avgPosture.spineAlignment,
        sittingPosition: avgPosture.sittingPosition,
        handFolding: avgPosture.handFolding,
        kneeling: avgPosture.kneeling,
        postureScore: avgPosture.postureScore,
        keypointConfidence: avgPosture.keypointConfidence
      });

      await analyzePosture({
        forwardHeadAngle: avgPosture.forwardHeadAngle,
        shoulderTilt: avgPosture.shoulderTilt,
        neckAngle: avgPosture.neckAngle,
        spineAlignment: avgPosture.spineAlignment,
        sittingPosition: avgPosture.sittingPosition,
        handFolding: avgPosture.handFolding,
        kneeling: avgPosture.kneeling,
        spineAngle: avgPosture.spineAngle,
        earToHipAngle: avgPosture.earToHipAngle,
        postureScore: avgPosture.postureScore,
        keypointConfidence: avgPosture.keypointConfidence,
        duration: recordingDuration,
        rawData: JSON.stringify(recordedSessionData), // Save complete session data
        dataPoints: recordedSessionData.length
      });
      
      toast.success(`Session saved successfully! ${recordedSessionData.length} data points recorded.`);
      
      // Reset recording state
      setRecordedSessionData([]);
      setIsRecording(false);
      setSessionDuration(0);
      isRecordingRef.current = false;
    } catch (error) {
      console.error('Error saving session:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      toast.error(`Failed to save session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const calculateAveragePosture = (data: PostureData[]): PostureData => {
    if (data.length === 0) return {} as PostureData;

    const avg = data.reduce((acc, curr) => ({
      forwardHeadAngle: acc.forwardHeadAngle + curr.forwardHeadAngle,
      shoulderTilt: acc.shoulderTilt + curr.shoulderTilt,
      neckAngle: acc.neckAngle + curr.neckAngle,
      spineAlignment: acc.spineAlignment + curr.spineAlignment,
      leftShoulderHeight: acc.leftShoulderHeight + curr.leftShoulderHeight,
      rightShoulderHeight: acc.rightShoulderHeight + curr.rightShoulderHeight,
      headTilt: acc.headTilt + curr.headTilt,
      spineAngle: acc.spineAngle + curr.spineAngle,
      earToHipAngle: acc.earToHipAngle + curr.earToHipAngle,
      postureScore: acc.postureScore + curr.postureScore,
      keypointConfidence: acc.keypointConfidence + curr.keypointConfidence,
      handFolding: acc.handFolding || curr.handFolding,
      kneeling: acc.kneeling || curr.kneeling,
      sittingPosition: curr.sittingPosition // Use most recent position
    }), {
      forwardHeadAngle: 0,
      shoulderTilt: 0,
      neckAngle: 0,
      spineAlignment: 0,
      leftShoulderHeight: 0,
      rightShoulderHeight: 0,
      headTilt: 0,
      spineAngle: 0,
      earToHipAngle: 0,
      postureScore: 0,
      keypointConfidence: 0,
      handFolding: false,
      kneeling: false,
      sittingPosition: 'unknown' as const
    });

    const count = data.length;
    return {
      forwardHeadAngle: avg.forwardHeadAngle / count,
      shoulderTilt: avg.shoulderTilt / count,
      neckAngle: avg.neckAngle / count,
      spineAlignment: avg.spineAlignment / count,
      leftShoulderHeight: avg.leftShoulderHeight / count,
      rightShoulderHeight: avg.rightShoulderHeight / count,
      headTilt: avg.headTilt / count,
      spineAngle: avg.spineAngle / count,
      earToHipAngle: avg.earToHipAngle / count,
      postureScore: avg.postureScore / count,
      keypointConfidence: avg.keypointConfidence / count,
      handFolding: avg.handFolding,
      kneeling: avg.kneeling,
      sittingPosition: avg.sittingPosition
    };
  };

  const getPostureColor = (value: number, type: string): string => {
    switch (type) {
      case 'forwardHead':
        return value < 15 ? 'text-success-light' : value < 25 ? 'text-warning-light' : 'text-error-light';
      case 'shoulderTilt':
        return value < 5 ? 'text-success-light' : value < 10 ? 'text-warning-light' : 'text-error-light';
      case 'spineAlignment':
        return value < 5 ? 'text-success-light' : value < 10 ? 'text-warning-light' : 'text-error-light';
      case 'headTilt':
        return value < 5 ? 'text-success-light' : value < 10 ? 'text-warning-light' : 'text-error-light';
      default:
        return 'text-secondary-light';
    }
  };

  // Remove the early return - always show the full UI

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
          AI Posture Monitor
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Real-time posture analysis using MediaPipe AI pose detection
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
                    To provide accurate posture analysis, we need your basic information. This helps us:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                    <li>Adjust analysis parameters for your age, height, and weight</li>
                    <li>Provide personalized recommendations based on your activity level</li>
                    <li>Calculate normalized metrics for better accuracy</li>
                    <li>Identify potential risk factors specific to your profile</li>
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
          toast.success("Subject details saved! You can now start analysis.");
        }}
        initialData={subjectData || undefined}
        compact={!showSubjectDetails}
      />

      {/* Uniform Layout: Camera Feed Top Half, 2x2 Grid Bottom Half */}
      <div className="space-y-6">
        {/* Top Half - Camera Feed */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center space-x-2">
                  <Video className="h-5 w-5 text-electric-light dark:text-electric-dark" />
                  <span>Live Camera Feed</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVideoPlayerSize('full')}
                  >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Full Screen
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden h-[45vh]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={400}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ transform: 'scaleX(-1)' }}
                />
                
                <AnimatePresence>
                  {!isAnalyzing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
                    >
                      <Button
                        onClick={startCamera}
                        className="bg-electric-light hover:bg-electric-dark text-white shadow-lg"
                        size="lg"
                        disabled={!isMediaPipeLoaded}
                      >
                        {!isMediaPipeLoaded ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                            />
                            Loading AI...
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            Start Analysis
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 right-4 flex flex-col space-y-2"
                  >
                    {/* Recording Controls */}
                    <div className="flex space-x-2">
                      {!isRecording ? (
                        <Button
                          onClick={startRecording}
                          variant="outline"
                          size="sm"
                          className="bg-red-500 hover:bg-red-600 text-white border-red-500"
                        >
                          <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                          Record
                        </Button>
                      ) : (
                        <Button
                          onClick={stopRecording}
                          variant="outline"
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                        >
                          <Square className="h-3 w-3 mr-2" />
                          Stop Recording
                        </Button>
                      )}
                    </div>

                    {/* Session Controls */}
                    <div className="flex space-x-2">
                      <Button
                        onClick={saveSession}
                        variant="success"
                        size="sm"
                        disabled={recordedSessionData.length === 0}
                      >
                        Save Session ({recordedSessionData.length})
                      </Button>
                      <Button
                        onClick={stopCamera}
                        variant="destructive"
                        size="sm"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                    </div>

                    {/* Recording Status */}
                    {isRecording && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-500/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-2 shadow-lg"
                      >
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span>RECORDING</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom Half - 2x2 Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Metrics */}
          <motion.div variants={itemVariants}>
            <Card className="h-[50vh]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-electric-light dark:text-electric-dark" />
                  <span>Quick Metrics</span>
                </CardTitle>
              </CardHeader>
                <CardContent className="overflow-y-auto">
                  <AnimatePresence>
                    {currentPosture ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        {/* Posture Score */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Posture Score
                          </span>
                          <span className={cn(
                            "text-lg font-bold",
                            currentPosture.postureScore > 80 ? 'text-success-light' :
                            currentPosture.postureScore > 60 ? 'text-warning-light' : 'text-error-light'
                          )}>
                            {currentPosture.postureScore}/100
                          </span>
                        </div>

                        {/* Sitting Position */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Position
                          </span>
                          <span className={cn(
                            "text-sm font-medium",
                            currentPosture.sittingPosition === 'straight' ? 'text-success-light' :
                            currentPosture.sittingPosition === 'hunchback' ? 'text-error-light' :
                            currentPosture.sittingPosition === 'reclined' ? 'text-warning-light' : 'text-gray-600'
                          )}>
                            {currentPosture.sittingPosition.charAt(0).toUpperCase() + currentPosture.sittingPosition.slice(1)}
                          </span>
                        </div>

                        {/* Forward Head Angle */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Head Angle
                          </span>
                          <span className={cn(
                            "text-sm font-medium",
                            currentPosture.forwardHeadAngle < 15 ? 'text-success-light' :
                            currentPosture.forwardHeadAngle < 25 ? 'text-warning-light' : 'text-error-light'
                          )}>
                            {currentPosture.forwardHeadAngle.toFixed(1)}°
                          </span>
                        </div>

                        {/* Shoulder Tilt */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Shoulder Tilt
                          </span>
                          <span className={cn(
                            "text-sm font-medium",
                            currentPosture.shoulderTilt < 5 ? 'text-success-light' :
                            currentPosture.shoulderTilt < 10 ? 'text-warning-light' : 'text-error-light'
                          )}>
                            {currentPosture.shoulderTilt.toFixed(1)}°
                          </span>
                        </div>

                        {/* Keypoint Confidence */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Confidence
                          </span>
                          <span className={cn(
                            "text-sm font-medium",
                            currentPosture.keypointConfidence > 80 ? 'text-success-light' :
                            currentPosture.keypointConfidence > 60 ? 'text-warning-light' : 'text-error-light'
                          )}>
                            {currentPosture.keypointConfidence.toFixed(1)}%
                          </span>
                        </div>

                        {/* Status Indicators */}
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between text-xs">
                            <span className={cn(
                              "flex items-center",
                              currentPosture.handFolding ? 'text-warning-light' : 'text-success-light'
                            )}>
                              <Hand className="w-4 h-4 mr-2" /> Hands
                            </span>
                            <span className={cn(
                              "flex items-center",
                              currentPosture.kneeling ? 'text-warning-light' : 'text-success-light'
                            )}>
                              <Footprints className="w-4 h-4 mr-2" /> Legs
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8 text-gray-500 dark:text-gray-400"
                      >
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                          <Camera className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm">Start camera to see metrics</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

          {/* Real-time Analytics */}
          <motion.div variants={itemVariants}>
            <Card className="h-[50vh]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-electric-light dark:text-electric-dark" />
                <span>Real-time Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {currentPosture ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-gray-900 dark:text-white">Forward Head</span>
                        <span className={cn("font-semibold", getPostureColor(currentPosture.forwardHeadAngle, 'forwardHead'))}>
                          {currentPosture.forwardHeadAngle.toFixed(1)}°
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-gray-900 dark:text-white">Shoulder Tilt</span>
                        <span className={cn("font-semibold", getPostureColor(currentPosture.shoulderTilt, 'shoulderTilt'))}>
                          {currentPosture.shoulderTilt.toFixed(1)}°
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-gray-900 dark:text-white">Spine Alignment</span>
                        <span className={cn("font-semibold", getPostureColor(currentPosture.spineAlignment, 'spineAlignment'))}>
                          {currentPosture.spineAlignment.toFixed(1)}°
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-gray-900 dark:text-white">Head Tilt</span>
                        <span className={cn("font-semibold", getPostureColor(currentPosture.headTilt, 'headTilt'))}>
                          {currentPosture.headTilt.toFixed(1)}°
                        </span>
                      </div>
                    </div>

                    {/* Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex justify-center mb-2">
                          {currentPosture.sittingPosition === 'straight' ? <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" /> :
                           currentPosture.sittingPosition === 'hunchback' ? <Triangle className="h-6 w-6 text-red-600 dark:text-red-400" /> :
                           currentPosture.sittingPosition === 'reclined' ? <RotateCcw className="h-6 w-6 text-amber-600 dark:text-amber-400" /> : <HelpCircle className="h-6 w-6 text-gray-500" />}
                        </div>
                        <p className={cn(
                          "text-sm font-medium",
                          currentPosture.sittingPosition === 'straight' ? 'text-green-700 dark:text-green-300' :
                          currentPosture.sittingPosition === 'hunchback' ? 'text-red-700 dark:text-red-300' :
                          currentPosture.sittingPosition === 'reclined' ? 'text-amber-700 dark:text-amber-300' : 'text-gray-600 dark:text-gray-400'
                        )}>
                          {currentPosture.sittingPosition.charAt(0).toUpperCase() + currentPosture.sittingPosition.slice(1)}
                        </p>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex justify-center mb-2">
                          {currentPosture.handFolding ? <Hand className="h-6 w-6 text-amber-600 dark:text-amber-400" /> : <HandHeart className="h-6 w-6 text-green-600 dark:text-green-400" />}
                        </div>
                        <p className={cn("text-sm font-medium", currentPosture.handFolding ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300')}>
                          {currentPosture.handFolding ? 'Folded/Crossed' : 'Relaxed'}
                        </p>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex justify-center mb-2">
                          {currentPosture.kneeling ? <Footprints className="h-6 w-6 text-amber-600 dark:text-amber-400" /> : <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />}
                        </div>
                        <p className={cn("text-sm font-medium", currentPosture.kneeling ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300')}>
                          {currentPosture.kneeling ? 'Kneeling' : 'Normal'}
                        </p>
                      </div>
                    </div>

                    {/* Session Info */}
                    {isAnalyzing && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-between items-center p-4 bg-electric-light/10 dark:bg-electric-dark/10 rounded-lg"
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Session Duration
                        </span>
                        <span className="text-sm font-bold text-electric-light dark:text-electric-dark">
                          {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-gray-500 dark:text-gray-400"
                  >
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <BarChart3 className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm">Start analysis to see real-time metrics</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

          {/* AI Recommendations - Bottom Half */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="h-[40vh]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-electric-light dark:text-electric-dark" />
                <span>AI Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {corrections.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    {corrections.map((correction, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "p-4 rounded-lg border-l-4",
                          correction.type === 'error' ? 'bg-error-light/10 border-error-light' :
                          correction.type === 'warning' ? 'bg-warning-light/10 border-warning-light' :
                          'bg-success-light/10 border-success-light'
                        )}
                      >
                        <p className={cn(
                          "font-medium mb-1",
                          correction.type === 'error' ? 'text-error-light' :
                          correction.type === 'warning' ? 'text-warning-light' :
                          'text-success-light'
                        )}>
                          {correction.message}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {correction.instruction}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex justify-center mb-4">
                      <AlertCircle className="h-12 w-12 text-electric-light dark:text-electric-dark" />
                    </div>
                    <p className="text-sm">Start analysis to get AI recommendations</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
