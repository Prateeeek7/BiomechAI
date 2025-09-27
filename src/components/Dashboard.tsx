import { motion } from "framer-motion";
import { Activity, TrendingUp, Users, Clock, Target, Zap, BarChart3, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

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

export default function Dashboard() {
  // Fetch real session data
  const postureSessions = useQuery(api.posture.getPostureHistory, { limit: 50 }) || [];
  const gaitSessions = useQuery(api.gait.getGaitHistory, { limit: 50 }) || [];
  
  // Calculate real statistics from session data
  const totalSessions = postureSessions.length + gaitSessions.length;
  
  // Posture statistics
  const postureStats = {
    totalSessions: postureSessions.length,
    averageScore: postureSessions.length > 0 
      ? postureSessions.reduce((sum: number, session: any) => sum + (session.postureScore || 0), 0) / postureSessions.length
      : 0,
    improvementRate: 0, // TODO: Calculate based on historical data
    averageForwardHead: postureSessions.length > 0
      ? postureSessions.reduce((sum: number, session: any) => sum + session.forwardHeadAngle, 0) / postureSessions.length
      : 0,
    averageShoulderTilt: postureSessions.length > 0
      ? postureSessions.reduce((sum: number, session: any) => sum + Math.abs(session.shoulderTilt), 0) / postureSessions.length
      : 0
  };
  
  // Gait statistics
  const gaitStats = {
    totalSessions: gaitSessions.length,
    averageSymmetry: gaitSessions.length > 0
      ? gaitSessions.reduce((sum: number, session: any) => sum + session.symmetryScore, 0) / gaitSessions.length
      : 0,
    averageCadence: gaitSessions.length > 0
      ? gaitSessions.reduce((sum: number, session: any) => sum + session.cadence, 0) / gaitSessions.length
      : 0,
    averageStrideLength: gaitSessions.length > 0
      ? gaitSessions.reduce((sum: number, session: any) => sum + (session.strideLength || 0), 0) / gaitSessions.length
      : 0
  };
  
  // Overall stats
  const effectiveStats = { 
    totalSessions, 
    activeUsers: 1 // Since we're using anonymous user
  };
  
  // Check if user has no data
  const hasNoData = totalSessions === 0;

  const StatCard = ({ title, value, icon: Icon, color, trend, onClick }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    trend?: string;
    onClick?: () => void;
  }) => (
    <motion.div 
      variants={itemVariants}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-300 hover:shadow-xl border-2 hover:border-electric-light/30 dark:hover:border-electric-dark/30",
          onClick && "hover:bg-gradient-to-br hover:from-electric-light/5 hover:to-electric-dark/5"
        )}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {title}
          </CardTitle>
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <Icon className={cn("h-5 w-5", color)} />
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            {value || 0}
          </motion.div>
          {trend && (
            <motion.p 
              className="text-xs text-gray-500 dark:text-gray-400 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {trend}
            </motion.p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );


  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center space-y-6">
        <div className="flex items-center justify-center space-x-6 mb-6">
          <motion.div 
            className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border-4 border-electric-light/20"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img 
              src="/logo.png" 
              alt="BiomechAI Logo" 
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="text-left">
            <motion.h1 
              className="text-5xl font-bold bg-gradient-to-r from-electric-light to-electric-dark bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              BiomechAI
            </motion.h1>
            <motion.p 
              className="text-lg text-gray-600 dark:text-gray-400 font-medium"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Advanced Biomechanical Analysis
            </motion.p>
          </div>
        </div>
        <motion.p 
          className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Monitor posture, analyze gait patterns, and get AI-powered insights for better health and performance.
        </motion.p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Sessions"
            value={effectiveStats.totalSessions}
            icon={Activity}
            color="text-electric-light dark:text-electric-dark"
            trend={hasNoData ? "Start your first session" : "+12% from last month"}
          />
          <StatCard
            title="Average Posture Score"
            value={`${postureStats.averageScore.toFixed(1)}/100`}
            icon={Target}
            color="text-success-light dark:text-success-dark"
            trend={hasNoData ? "No data yet" : `${postureStats.totalSessions} sessions recorded`}
          />
          <StatCard
            title="Gait Sessions"
            value={gaitStats.totalSessions}
            icon={BarChart3}
            color="text-warning-light dark:text-warning-dark"
            trend={hasNoData ? "Connect your ESP32" : `${gaitStats.averageSymmetry.toFixed(1)}% avg symmetry`}
          />
          <StatCard
            title="Active Users"
            value={effectiveStats.activeUsers}
            icon={Users}
            color="text-accent-light dark:text-accent-dark"
            trend="Growing community"
          />
        </div>
      </motion.div>

      {/* Getting Started Section - Show when no data */}
      {hasNoData && (
        <motion.div 
          variants={itemVariants}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <div className="bg-gradient-to-br from-electric-light/10 via-electric-dark/5 to-electric-light/10 dark:from-electric-light/20 dark:via-electric-dark/10 dark:to-electric-light/20 rounded-2xl p-8 border-2 border-electric-light/20 shadow-2xl">
            <div className="text-center space-y-8">
              <motion.div 
                className="w-24 h-24 mx-auto bg-gradient-to-br from-electric-light/20 to-electric-dark/20 rounded-full flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Zap className="w-12 h-12 text-electric-light" />
              </motion.div>
              <div>
                <motion.h3 
                  className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  Ready to Begin Analysis
                </motion.h3>
                <motion.p 
                  className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto text-lg leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  Your BiomechAI dashboard is ready! Start your first analysis session to begin monitoring your posture and gait patterns. 
                  Your dashboard will populate with insights and recommendations as you use the system.
                </motion.p>
              </div>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <motion.div 
                  className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-6 text-center border border-electric-light/20 hover:border-electric-light/40 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Camera className="w-10 h-10 text-electric-light mx-auto mb-3" />
                  </motion.div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">Posture Analysis</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Use your webcam to analyze your sitting posture in real-time with AI-powered insights
                  </p>
                </motion.div>
                <motion.div 
                  className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-6 text-center border border-electric-light/20 hover:border-electric-light/40 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <BarChart3 className="w-10 h-10 text-electric-light mx-auto mb-3" />
                  </motion.div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">Gait Analysis</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Connect ESP32 sensors to analyze your walking patterns and movement biomechanics
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Posture Overview */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5 text-electric-light dark:text-electric-dark" />
                <span>Posture Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {hasNoData ? (
                <div className="text-center py-8">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Posture Data Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Start your first posture analysis session to see your data here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">Average Score</span>
                    <span className={cn(
                      "text-2xl font-bold",
                      postureStats.averageScore > 80 ? "text-success-light" :
                      postureStats.averageScore > 60 ? "text-warning-light" : "text-error-light"
                    )}>
                      {postureStats.averageScore.toFixed(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {postureStats.totalSessions}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Sessions</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {postureStats.averageForwardHead.toFixed(1)}°
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Avg Head Angle</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {postureStats.averageShoulderTilt.toFixed(1)}°
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Avg Shoulder Tilt</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {postureSessions.length > 0 ? Math.round(postureSessions.reduce((sum: number, session: any) => sum + (session.duration || 0), 0) / postureSessions.length / 60) : 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Avg Duration (min)</div>
                    </div>
                  </div>
                </div>
              )}
              
              <Button 
                className="w-full bg-electric-light hover:bg-electric-dark text-white"
                onClick={() => {/* Navigate to posture monitor */}}
              >
                {hasNoData ? "Start Your First Posture Analysis" : "Start Posture Analysis"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Gait Overview */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-electric-light dark:text-electric-dark" />
                <span>Gait Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {hasNoData ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Gait Data Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Connect your ESP32 sensors or upload CSV data to start gait analysis.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">Average Symmetry</span>
                    <span className={cn(
                      "text-2xl font-bold",
                      gaitStats.averageSymmetry > 80 ? "text-success-light" :
                      gaitStats.averageSymmetry > 60 ? "text-warning-light" : "text-error-light"
                    )}>
                      {gaitStats.averageSymmetry.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {gaitStats.totalSessions}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Sessions</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {gaitStats.averageCadence.toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Steps/min</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {gaitStats.averageStrideLength.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Avg Stride (m)</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {gaitSessions.length > 0 ? Math.round(gaitSessions.reduce((sum: number, session: any) => sum + session.stepCount, 0) / gaitSessions.length) : 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Avg Steps</div>
                    </div>
                  </div>
                </div>
              )}
              
              <Button 
                className="w-full bg-electric-light hover:bg-electric-dark text-white"
                onClick={() => {/* Navigate to gait analyzer */}}
              >
                {hasNoData ? "Start Your First Gait Analysis" : "Start Gait Analysis"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-electric-light dark:text-electric-dark" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasNoData ? (
              <div className="text-center py-8">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Recent Activity
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your recent analysis sessions and activity will appear here.
                </p>
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <p>• Complete your first posture analysis</p>
                  <p>• Connect ESP32 for gait monitoring</p>
                  <p>• Upload CSV data for analysis</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Show recent posture sessions */}
                {postureSessions.slice(0, 3).map((session: any, index: number) => {
                  const timeAgo = Math.round((Date.now() - session.timestamp) / (1000 * 60)); // minutes ago
                  return (
                    <motion.div 
                      key={`posture-${session._id}`}
                      className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-success-light/20"
                      whileHover={{ scale: 1.02, x: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <motion.div 
                        className="w-3 h-3 bg-success-light rounded-full shadow-lg"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                      ></motion.div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Posture session completed
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Score: {(session.postureScore || 0).toFixed(1)}/100 • {timeAgo} minutes ago
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
                
                {/* Show recent gait sessions */}
                {gaitSessions.slice(0, 2).map((session: any, index: number) => {
                  const timeAgo = Math.round((Date.now() - session.timestamp) / (1000 * 60)); // minutes ago
                  return (
                    <motion.div 
                      key={`gait-${session._id}`}
                      className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-warning-light/20"
                      whileHover={{ scale: 1.02, x: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <motion.div 
                        className="w-3 h-3 bg-warning-light rounded-full shadow-lg"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: (index + postureSessions.length) * 0.5 }}
                      ></motion.div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Gait analysis completed
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Symmetry: {session.symmetryScore.toFixed(1)}% • {timeAgo} minutes ago
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
                
                {/* Show summary if no recent activity */}
                {postureSessions.length === 0 && gaitSessions.length === 0 && (
                  <motion.div 
                    className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-electric-light/20"
                    whileHover={{ scale: 1.02, x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.div 
                      className="w-3 h-3 bg-electric-light rounded-full shadow-lg"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    ></motion.div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Ready for analysis
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Start your first session to see activity here
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}