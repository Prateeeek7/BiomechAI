import React from 'react'
import { motion } from 'framer-motion'
import { Activity, Camera, BarChart3, MessageCircle, FileText, Zap } from 'lucide-react'
import { ThemeToggle } from './ui/theme-toggle'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'posture', label: 'Posture Monitor', icon: Camera },
  { id: 'gait', label: 'Gait Analyzer', icon: BarChart3 },
  { id: 'chat', label: 'AI Assistant', icon: MessageCircle },
  { id: 'reports', label: 'Reports', icon: FileText },
]

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex items-center space-x-3"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden shadow-lg">
              <img 
                src="/logo.png" 
                alt="BiomechAI Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                BiomechAI
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Professional Analysis
              </p>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <div className="hidden md:flex items-center space-x-1">
            {tabs.map((tab, index) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                >
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-electric-light dark:bg-electric-dark text-white shadow-lg"
                        : "text-gray-600 dark:text-gray-300 hover:text-electric-light dark:hover:text-electric-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </Button>
                </motion.div>
              )
            })}
          </div>

          {/* Theme Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <ThemeToggle />
          </motion.div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="grid grid-cols-3 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex flex-col items-center space-y-1 p-3 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-electric-light dark:bg-electric-dark text-white shadow-lg"
                      : "text-gray-600 dark:text-gray-300 hover:text-electric-light dark:hover:text-electric-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
