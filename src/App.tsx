import { Toaster } from "sonner";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import PostureMonitor from "./components/PostureMonitor";
import GaitAnalyzer from "./components/GaitAnalyzer";
import Reports from "./components/Reports";
import BiomechChatbot from "./components/BiomechChatbot";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
}

const pageTransition = {
  duration: 0.3
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "posture":
        return <PostureMonitor />;
      case "gait":
        return <GaitAnalyzer />;
      case "chat":
        return <BiomechChatbot />;
      case "reports":
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            {renderActiveComponent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              &copy; 2025 BiomechAI. Advanced AI-powered biomechanical analysis for better health.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Powered by MediaPipe AI • Real-time Analysis • Professional Grade
            </p>
          </div>
        </div>
      </footer>
      
      <Toaster position="top-right" />
    </div>
  );
}