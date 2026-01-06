import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Activity, Zap, Eye, EyeOff, Settings, RefreshCw, AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDeviceId } from '../hooks/useDeviceId'

const AmbientMonitor = () => {
  const { deviceId, userId } = useDeviceId()
  const [isObserving, setIsObserving] = useState(false)
  const [insights, setInsights] = useState(null)
  const [ambientScore, setAmbientScore] = useState(0)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [lastAnalysis, setLastAnalysis] = useState(null)
  const [autoOptimize, setAutoOptimize] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const intervalRef = useRef(null)
  const contextRef = useRef(null)

  // Collect system context
  const collectContext = async () => {
    try {
      // Get active window (simulated - would use actual system API)
      const activeWindow = document.title || 'Unknown Window'
      
      // Get browser tabs (simulated)
      const browserTabs = window.length || 1
      
      // Get running apps (simulated)
      const runningApps = ['VSCode', 'Chrome', 'Terminal', 'Slack']
      
      // Get notifications (simulated)
      const notifications = Math.floor(Math.random() * 5)
      
      // Get recent activity
      const recentActivity = {
        keystrokes: Math.floor(Math.random() * 1000),
        mouse_clicks: Math.floor(Math.random() * 500),
        window_switches: Math.floor(Math.random() * 10)
      }
      
      const context = {
        timestamp: new Date().toISOString(),
        active_window: activeWindow,
        browser_tabs: browserTabs,
        running_apps: runningApps,
        notifications: notifications,
        recent_activity: recentActivity,
        focus_level: calculateFocusLevel(),
        energy_level: calculateEnergyLevel()
      }
      
      return context
    } catch (error) {
      console.error('Error collecting context:', error)
      return null
    }
  }

  const calculateFocusLevel = () => {
    // Simple focus calculation based on time of day and activity
    const hour = new Date().getHours()
    if (hour >= 9 && hour <= 11) return 0.9  // Morning peak
    if (hour >= 14 && hour <= 16) return 0.8  // Afternoon peak
    if (hour >= 19 && hour <= 21) return 0.7  // Evening
    return 0.5
  }

  const calculateEnergyLevel = () => {
    // Simple energy calculation
    const hour = new Date().getHours()
    if (hour >= 6 && hour <= 10) return 0.9
    if (hour >= 10 && hour <= 12) return 0.8
    if (hour >= 12 && hour <= 14) return 0.6  // Lunch dip
    if (hour >= 14 && hour <= 17) return 0.7
    if (hour >= 17 && hour <= 20) return 0.5
    return 0.4
  }

  // Send context to ambient intelligence
  const sendContext = async () => {
    if (!userId) return
    
    try {
      const context = await collectContext()
      if (!context) return
      
      const response = await fetch('/api/ambient/observe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          context: {
            ...context,
            device_id: deviceId,
          },
        })
      })
      
      if (response.ok) {
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error sending context:', error)
    }
  }

  // Get ambient insights
  const fetchInsights = async () => {
    if (!userId) return
    
    try {
      const response = await fetch(`/api/ambient/insights/${encodeURIComponent(userId)}`)
      const data = await response.json()
      
      if (data.success) {
        setInsights(data.insights)
        setAmbientScore(data.insights.ambient_score || 0)
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
    }
  }

  // Start/stop observation
  const toggleObservation = () => {
    if (isObserving) {
      stopObservation()
    } else {
      startObservation()
    }
  }

  const startObservation = () => {
    setIsObserving(true)
    toast.success('Ambient intelligence activated')
    
    // Send initial context
    sendContext()
    
    // Set up periodic context collection
    intervalRef.current = setInterval(() => {
      sendContext()
      fetchInsights()
    }, 30000) // Every 30 seconds
  }

  const stopObservation = () => {
    setIsObserving(false)
    toast.info('Ambient intelligence paused')
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // Trigger manual analysis
  const triggerAnalysis = async () => {
    if (!userId) return
    
    try {
      const response = await fetch(`/api/ambient/trigger-analysis/${encodeURIComponent(userId)}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast.success('Analysis triggered')
        fetchInsights()
        setLastAnalysis(new Date())
      }
    } catch (error) {
      toast.error('Failed to trigger analysis')
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Auto-start observation
  useEffect(() => {
    if (userId && !isObserving) {
      startObservation()
    }
  }, [userId])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Ambient Intelligence
          </h2>
          <p className="text-gray-400">Silent observation and automatic workflow optimization</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full border ${
              isObserving 
                ? 'border-green-500/30 bg-green-500/10 text-green-300' 
                : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
            }`}>
              {isObserving ? '🧠 Observing' : '⏸ Paused'}
            </span>
            {lastUpdate && (
              <span className="text-xs px-2 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300">
                Updated {Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s ago
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={toggleObservation}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isObserving
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isObserving ? 'Pause' : 'Start'}
          </button>
          
          <button
            onClick={triggerAnalysis}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Analyze
          </button>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
          >
            <Settings className="w-4 h-4 inline mr-2" />
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>
      </motion.div>

      {/* Ambient Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-md p-6 border border-purple-500/30 rounded-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Ambient Intelligence Score</h3>
            <p className="text-gray-400 text-sm">How well the system understands your work patterns</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-purple-400">{Math.round(ambientScore * 100)}%</div>
            <div className="text-xs text-gray-400">Understanding</div>
          </div>
        </div>
        {/* High-level analysis meta */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-300">
          <div>
            <div className="text-gray-400">Data points observed</div>
            <div className="font-medium">{insights?.data_points ?? 0}</div>
          </div>
          <div>
            <div className="text-gray-400">Last analysis</div>
            <div className="font-medium">
              {lastAnalysis ? lastAnalysis.toLocaleTimeString() : 'Not run yet'}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Status</div>
            <div className="font-medium truncate max-w-xs">
              {insights?.message || 'Collecting context...'}
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${ambientScore * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Insights */}
      {insights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {/* Learned Patterns */}
          <div className="bg-gray-900/50 backdrop-blur-md p-4 border border-gray-700 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-purple-400" />
              <h4 className="text-lg font-semibold text-white">Learned Patterns</h4>
            </div>
            <div className="space-y-2">
              {insights.learned_patterns?.slice(0, 3).map((pattern, index) => (
                <div key={index} className="text-sm text-gray-300">
                  • {pattern}
                </div>
              ))}
              {(!insights.learned_patterns || insights.learned_patterns.length === 0) && (
                <div className="text-sm text-gray-500">Learning patterns...</div>
              )}
            </div>
          </div>

          {/* Recent Improvements */}
          <div className="bg-gray-900/50 backdrop-blur-md p-4 border border-gray-700 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h4 className="text-lg font-semibold text-white">Recent Improvements</h4>
            </div>
            <div className="space-y-2">
              {insights.recent_improvements?.slice(0, 3).map((improvement, index) => (
                <div key={index} className="text-sm text-gray-300">
                  • {improvement}
                </div>
              ))}
              {(!insights.recent_improvements || insights.recent_improvements.length === 0) && (
                <div className="text-sm text-gray-500">No improvements yet</div>
              )}
            </div>
          </div>

          {/* Auto-Optimization Status */}
          <div className="bg-gray-900/50 backdrop-blur-md p-4 border border-gray-700 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h4 className="text-lg font-semibold text-white">Auto-Optimization</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Status</span>
                <span className={`text-sm font-medium ${autoOptimize ? 'text-green-400' : 'text-yellow-400'}`}>
                  {autoOptimize ? 'Active' : 'Paused'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Last Action</span>
                <span className="text-sm text-gray-400">
                  {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Details Panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-900/50 backdrop-blur-md p-6 border border-gray-700 rounded-xl"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Ambient Intelligence Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">What It Observes</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Active applications</li>
                  <li>• Window switching patterns</li>
                  <li>• Notification frequency</li>
                  <li>• Work session duration</li>
                  <li>• Energy levels</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Automatic Improvements</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Workspace organization</li>
                  <li>• Focus time scheduling</li>
                  <li>• Notification management</li>
                  <li>• Task batching</li>
                  <li>• Break reminders</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Ambient intelligence works silently in the background. No prompts needed.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AmbientMonitor
