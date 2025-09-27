import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Download, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Users,
  Calendar,
  Sparkles,
  Award,
  Zap,
  Heart,
  Brain,
  Shield,
  Trash2
} from "lucide-react";

export default function Reports() {
  const [selectedType, setSelectedType] = useState<'posture' | 'gait' | 'combined'>('combined');
  const [reportTitle, setReportTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const reports = useQuery(api.reports.getUserReports);
  const postureHistory = useQuery(api.posture.getPostureHistory, { limit: 10 });
  const gaitHistory = useQuery(api.gait.getGaitHistory, { limit: 10 });
  const generateReport = useMutation(api.reports.generateReport);
  const deleteReport = useMutation(api.reports.deleteReport);
  const deleteAllPostureSessions = useMutation(api.reports.deleteAllPostureSessions);
  const deleteAllGaitSessions = useMutation(api.reports.deleteAllGaitSessions);

  const handleGenerateReport = async () => {
    if (!reportTitle.trim()) {
      toast.error("Please enter a report title");
      return;
    }

    setIsGenerating(true);
    try {
      const sessionIds: string[] = [];
      
      if (selectedType === 'posture' || selectedType === 'combined') {
        sessionIds.push(...(postureHistory?.slice(0, 5).map(s => s._id) || []));
      }
      
      if (selectedType === 'gait' || selectedType === 'combined') {
        sessionIds.push(...(gaitHistory?.slice(0, 5).map(s => s._id) || []));
      }

      await generateReport({
        sessionIds,
        type: selectedType,
        title: reportTitle,
      });

      toast.success("Report generated successfully!");
      setReportTitle('');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewReport = (report: any) => {
    // Create a beautiful React-style report view
    const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${report.title} - BiomechAI Report</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; }
            .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .glass { backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.1); }
            .animate-fade-in { animation: fadeIn 0.6s ease-out; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            .animate-slide-up { animation: slideUp 0.8s ease-out; }
            @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            .metric-card { background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%); }
            .risk-high { background: linear-gradient(145deg, #fee2e2 0%, #fecaca 100%); }
            .risk-moderate { background: linear-gradient(145deg, #fef3c7 0%, #fde68a 100%); }
            .risk-low { background: linear-gradient(145deg, #d1fae5 0%, #a7f3d0 100%); }
          </style>
        </head>
        <body class="bg-gray-50 min-h-screen">
          <!-- Header -->
          <div class="gradient-bg text-white py-8 px-6">
            <div class="max-w-6xl mx-auto">
              <div class="flex items-center justify-between">
                <div class="animate-fade-in">
                  <h1 class="text-4xl font-bold mb-2">${report.title}</h1>
                  <div class="flex items-center space-x-4 text-blue-100">
                    <span class="flex items-center space-x-1">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                      </svg>
                      <span>${formatDate(report.createdAt)}</span>
                    </span>
                    <span class="flex items-center space-x-1">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                      </svg>
                      <span>${report.sessionIds.length} sessions</span>
                    </span>
                    <span class="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                      ${report.type.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div class="animate-fade-in">
                  <div class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Report Content -->
          <div class="max-w-6xl mx-auto px-6 py-8">
            <div class="animate-slide-up">
              <!-- Executive Summary -->
              <div class="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
                <div class="flex items-center space-x-3 mb-6">
                  <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                    </svg>
                  </div>
                  <h2 class="text-2xl font-bold text-gray-900">Executive Summary</h2>
                </div>
                <div class="prose prose-lg max-w-none">
                  <div class="whitespace-pre-line text-gray-700 leading-relaxed">${report.summary}</div>
                </div>
              </div>

              <!-- Key Metrics -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                ${generateMetricsCards(report)}
              </div>

              <!-- Recommendations -->
              <div class="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
                <div class="flex items-center space-x-3 mb-6">
                  <div class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                  </div>
                  <h2 class="text-2xl font-bold text-gray-900">Recommendations</h2>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  ${report.recommendations.map((rec: string, index: number) => `
                    <div class="metric-card rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                      <div class="flex items-start space-x-3">
                        <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span class="text-white font-bold text-sm">${index + 1}</span>
                        </div>
                        <p class="text-gray-700 leading-relaxed">${rec}</p>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Footer -->
              <div class="text-center py-8">
                <div class="inline-flex items-center space-x-2 text-gray-500">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                  <span>Generated by BiomechAI - Advanced Biomechanical Analysis System</span>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const generateMetricsCards = (report: any) => {
    const summary = report.summary;
    
    // Extract key metrics from summary
    const postureScoreMatch = summary.match(/Overall Posture Score: ([\d.]+)\/100/);
    const gaitSymmetryMatch = summary.match(/Overall Symmetry: ([\d.]+)%/);
    const riskLevelMatch = summary.match(/Risk Level: (LOW|MODERATE|HIGH)/);
    const sessionsCount = report.sessionIds.length;
    
    const postureScore = postureScoreMatch ? parseFloat(postureScoreMatch[1]) : null;
    const gaitSymmetry = gaitSymmetryMatch ? parseFloat(gaitSymmetryMatch[1]) : null;
    const riskLevel = riskLevelMatch ? riskLevelMatch[1] : 'UNKNOWN';
    
    const cards = [];
    
    if (postureScore !== null) {
      const scoreColor = postureScore >= 85 ? 'from-green-500 to-emerald-600' : 
                        postureScore >= 70 ? 'from-yellow-500 to-orange-600' : 
                        'from-red-500 to-pink-600';
      cards.push(`
        <div class="metric-card rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-gradient-to-r ${scoreColor} rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
            </div>
            <span class="text-2xl font-bold text-gray-900">${postureScore.toFixed(1)}</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-1">Posture Score</h3>
          <p class="text-sm text-gray-600">Overall posture quality rating</p>
        </div>
      `);
    }
    
    if (gaitSymmetry !== null) {
      const symmetryColor = gaitSymmetry >= 90 ? 'from-green-500 to-emerald-600' : 
                           gaitSymmetry >= 80 ? 'from-yellow-500 to-orange-600' : 
                           'from-red-500 to-pink-600';
      cards.push(`
        <div class="metric-card rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-gradient-to-r ${symmetryColor} rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <span class="text-2xl font-bold text-gray-900">${gaitSymmetry.toFixed(1)}%</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-1">Gait Symmetry</h3>
          <p class="text-sm text-gray-600">Walking pattern balance</p>
        </div>
      `);
    }
    
    const riskColor = riskLevel === 'HIGH' ? 'from-red-500 to-pink-600' : 
                     riskLevel === 'MODERATE' ? 'from-yellow-500 to-orange-600' : 
                     'from-green-500 to-emerald-600';
    cards.push(`
      <div class="metric-card rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-gradient-to-r ${riskColor} rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <span class="text-lg font-bold text-gray-900">${riskLevel}</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-1">Risk Level</h3>
        <p class="text-sm text-gray-600">Health risk assessment</p>
      </div>
    `);
    
    cards.push(`
      <div class="metric-card rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <span class="text-2xl font-bold text-gray-900">${sessionsCount}</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-1">Sessions Analyzed</h3>
        <p class="text-sm text-gray-600">Total data points</p>
      </div>
    `);
    
    return cards.join('');
  };

  const handleDownloadReport = (report: any) => {
    // Create a downloadable report
    const reportContent = `
BIOMECHAI ANALYSIS REPORT
========================

Title: ${report.title}
Type: ${report.type}
Generated: ${formatDate(report.createdAt)}
Sessions Analyzed: ${report.sessionIds.length}

SUMMARY
-------
${report.summary}

RECOMMENDATIONS
---------------
${report.recommendations.map((rec: string, index: number) => `${index + 1}. ${rec}`).join('\n')}

---
Generated by BiomechAI
For more information, visit the BiomechAI application.
    `.trim();

    // Create and download file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date(report.createdAt).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success("Report downloaded successfully!");
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteReport({ reportId });
      toast.success("Report deleted successfully");
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error("Failed to delete report");
    }
  };

  const handleCleanupPostureSessions = async () => {
    if (!confirm('Are you sure you want to delete ALL posture sessions? This action cannot be undone.')) {
      return;
    }
    
    try {
      const result = await deleteAllPostureSessions({});
      toast.success(`Deleted ${result.deletedCount} posture sessions`);
    } catch (error) {
      console.error('Error deleting posture sessions:', error);
      toast.error("Failed to delete posture sessions");
    }
  };

  const handleCleanupGaitSessions = async () => {
    if (!confirm('Are you sure you want to delete ALL gait sessions? This action cannot be undone.')) {
      return;
    }
    
    try {
      const result = await deleteAllGaitSessions({});
      toast.success(`Deleted ${result.deletedCount} gait sessions`);
    } catch (error) {
      console.error('Error deleting gait sessions:', error);
      toast.error("Failed to delete gait sessions");
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'posture': return '🧍';
      case 'gait': return '🚶';
      case 'combined': return '📊';
      default: return '📋';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white"
      >
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-3 flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <span>Biomechanical Reports</span>
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                Generate comprehensive analysis reports with advanced biomechanical insights and personalized recommendations
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-32 bg-white bg-opacity-10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <BarChart3 className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Data Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Data Overview</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-6 rounded-2xl border border-blue-200 dark:border-blue-700"
          >
            <div className="absolute top-4 right-4 w-16 h-16 bg-blue-500 bg-opacity-10 rounded-full"></div>
            <div className="relative">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-blue-900 dark:text-blue-100">Posture Sessions</h4>
                  <p className="text-blue-700 dark:text-blue-200">
                    {postureHistory ? `${postureHistory.length} sessions available` : 'Loading...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-300">
                  <CheckCircle className="w-4 h-4" />
                  <span>Ready for analysis</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCleanupPostureSessions}
                  className="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg transition-all duration-200 flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-6 rounded-2xl border border-green-200 dark:border-green-700"
          >
            <div className="absolute top-4 right-4 w-16 h-16 bg-green-500 bg-opacity-10 rounded-full"></div>
            <div className="relative">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-green-900 dark:text-green-100">Gait Sessions</h4>
                  <p className="text-green-700 dark:text-green-200">
                    {gaitHistory ? `${gaitHistory.length} sessions available` : 'Loading...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-300">
                  <CheckCircle className="w-4 h-4" />
                  <span>Ready for analysis</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCleanupGaitSessions}
                  className="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg transition-all duration-200 flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Generate New Report */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Generate New Report</h3>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Report Title
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="e.g., Weekly Posture Assessment"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white text-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Report Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'posture', label: 'Posture Only', icon: Users, desc: 'Focus on posture analysis', color: 'from-blue-500 to-blue-600' },
                { id: 'gait', label: 'Gait Only', icon: TrendingUp, desc: 'Focus on gait analysis', color: 'from-green-500 to-green-600' },
                { id: 'combined', label: 'Combined', icon: BarChart3, desc: 'Both posture and gait', color: 'from-purple-500 to-purple-600' },
              ].map((type) => {
                const IconComponent = type.icon;
                return (
                  <motion.button
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedType(type.id as any)}
                    className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                      selectedType === type.id
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${type.color} rounded-xl flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{type.label}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{type.desc}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateReport}
            disabled={isGenerating || !reportTitle.trim()}
            className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-3 font-semibold text-lg shadow-lg"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating Report...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Comprehensive Report</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Recent Reports */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Reports</h3>
        </div>
        
        {!reports ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : reports.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Reports Yet</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Generate your first comprehensive report to get started</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Use the form above to create detailed biomechanical analysis reports</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reports.map((report, index) => (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="absolute top-4 right-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    {report.type === 'posture' ? <Users className="w-6 h-6 text-white" /> :
                     report.type === 'gait' ? <TrendingUp className="w-6 h-6 text-white" /> :
                     <BarChart3 className="w-6 h-6 text-white" />}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2 pr-16">
                    {report.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {report.summary.length > 150 ? report.summary.substring(0, 150) + '...' : report.summary}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(report.createdAt)}</span>
                  </span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium">
                    {report.type.toUpperCase()}
                  </span>
                  <span className="flex items-center space-x-1">
                    <Activity className="w-3 h-3" />
                    <span>{report.sessionIds.length} sessions</span>
                  </span>
                </div>
                
                {report.recommendations.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span>Key Insights:</span>
                    </h5>
                    <div className="space-y-1">
                      {report.recommendations.slice(0, 2).map((rec, recIndex) => (
                        <div key={recIndex} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="line-clamp-1">{rec}</span>
                        </div>
                      ))}
                      {report.recommendations.length > 2 && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                          +{report.recommendations.length - 2} more recommendations
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleViewReport(report)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownloadReport(report)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-2 text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteReport(report._id)}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center space-x-2 text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM6 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd"></path>
                    </svg>
                    <span>Delete</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Report Templates */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Report Templates</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Daily Assessment",
              description: "Quick daily posture and gait summary with key insights",
              icon: Calendar,
              type: "combined",
              color: "from-blue-500 to-blue-600",
              bgColor: "from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800"
            },
            {
              title: "Weekly Progress",
              description: "Comprehensive weekly analysis with detailed trends",
              icon: TrendingUp,
              type: "combined",
              color: "from-green-500 to-green-600",
              bgColor: "from-green-50 to-green-100 dark:from-green-900 dark:to-green-800"
            },
            {
              title: "Posture Focus",
              description: "Detailed posture analysis and ergonomic recommendations",
              icon: Users,
              type: "posture",
              color: "from-purple-500 to-purple-600",
              bgColor: "from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800"
            },
            {
              title: "Gait Analysis",
              description: "In-depth gait pattern evaluation and movement insights",
              icon: Activity,
              type: "gait",
              color: "from-teal-500 to-teal-600",
              bgColor: "from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-800"
            },
            {
              title: "Medical Report",
              description: "Professional report format for healthcare providers",
              icon: Heart,
              type: "combined",
              color: "from-red-500 to-red-600",
              bgColor: "from-red-50 to-red-100 dark:from-red-900 dark:to-red-800"
            },
            {
              title: "Fitness Tracking",
              description: "Movement quality analysis for fitness and wellness goals",
              icon: Zap,
              type: "combined",
              color: "from-yellow-500 to-yellow-600",
              bgColor: "from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800"
            },
          ].map((template, index) => {
            const IconComponent = template.icon;
            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedType(template.type as any);
                  setReportTitle(template.title);
                }}
                className={`relative overflow-hidden p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 text-left bg-gradient-to-br ${template.bgColor} group`}
              >
                <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-r from-white to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
                  <IconComponent className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </div>
                
                <div className="relative">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${template.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                      {template.title}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {template.description}
                  </p>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className="px-3 py-1 bg-white bg-opacity-50 dark:bg-gray-800 dark:bg-opacity-50 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                      {template.type.toUpperCase()}
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>Quick Start</span>
                      <Sparkles className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
