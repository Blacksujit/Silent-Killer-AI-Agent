import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Activity, Zap, TrendingUp, Clock, Monitor, MousePointer, Download, RefreshCw, Calendar, Filter, Search, Bell, Settings, ChevronUp, ChevronDown, Eye, EyeOff, Pause, Play } from 'lucide-react'
import { format } from 'date-fns'
import { saveAs } from 'file-saver'
import toast from 'react-hot-toast'

const FreshDashboard = ({ stats, setStats }) => {
  // Core state
  const [chartData, setChartData] = useState([])
  const [activityData, setActivityData] = useState([])
  const [realtimeStats, setRealtimeStats] = useState({
    cpu: 0,
    memory: 0,
    events: 0,
    uptime: 0,
    network: 0
  })
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({ start: null, end: null })
  const [showSettings, setShowSettings] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(15000) // 15 seconds default
  const [exportFormat, setExportFormat] = useState('json')
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  
  // Hover and interaction state
  const [hoveredChart, setHoveredChart] = useState(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isHoveringTimeline, setIsHoveringTimeline] = useState(false)
  const [isHoveringPie, setIsHoveringPie] = useState(false)
  
  // Notification timing
  const [lastNotificationTime, setLastNotificationTime] = useState(0)
  const [notificationQueue, setNotificationQueue] = useState([])
  const animationFrameRef = useRef(null)

  // Notification system for specific triggers only
  const showNotification = (title, message, type = 'info') => {
    const now = Date.now()
    
    // Check if enough time has passed since last notification
    if (now - lastNotificationTime < 30000) { // 30 second cooldown
      return
    }
    
    // Clear any existing timeout
    if (window.notificationTimeout) {
      clearTimeout(window.notificationTimeout)
    }
    
    // Schedule notification with delay
    window.notificationTimeout = setTimeout(() => {
      setLastNotificationTime(Date.now())
      
      switch (type) {
        case 'warning':
          toast.error(`${title}: ${message}`, {
            duration: 6000,
            position: 'top-right',
            style: {
              background: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(255, 0, 102, 0.5)',
              color: '#ff0066',
              backdropFilter: 'blur(10px)',
            },
          })
          break
        case 'success':
          toast.success(`${title}: ${message}`, {
            duration: 5000,
            position: 'top-right',
            style: {
              background: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(0, 255, 136, 0.5)',
              color: '#00ff88',
              backdropFilter: 'blur(10px)',
            },
          })
          break
        case 'info':
          toast(`${title}: ${message}`, {
            duration: 5000,
            position: 'top-right',
            style: {
              background: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(0, 255, 255, 0.5)',
              color: '#00ffff',
              backdropFilter: 'blur(10px)',
            },
          })
          break
      }
    }, 500) // 0.5 second delay to prevent overlapping
  }

  // Specific trigger notifications
  const triggerExportNotification = (format) => {
    showNotification('Export Complete', `Dashboard data exported as ${format.toUpperCase()}`, 'success')
  }

  const triggerSettingsNotification = (setting, value) => {
    showNotification('Setting Changed', `${setting} ${value ? 'enabled' : 'disabled'}`, 'info')
  }

  const triggerRefreshNotification = () => {
    showNotification('Dashboard Refreshed', 'All data has been updated', 'info')
  }

  // Memoized filtered data
  const filteredChartData = useMemo(() => {
    if (!searchTerm) return chartData
    return chartData.filter(item => 
      item.hour.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [chartData, searchTerm])

  // Initialize data
  useEffect(() => {
    // Generate initial stable data
    const now = new Date()
    const initialChartData = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000)
      return {
        hour: format(hour, 'HH:00'),
        events: Math.floor(Math.sin(i / 4) * 15 + 100 + Math.random() * 3),
        suggestions: Math.floor(Math.cos(i / 6) * 2 + 12 + Math.random() * 1),
        cpu: Math.sin(i / 8) * 10 + 50 + Math.random() * 2,
        memory: Math.cos(i / 10) * 8 + 60 + Math.random() * 2
      }
    })
    setChartData(initialChartData)

    // Set stable activity data
    const stableActivityData = [
      { name: 'Coding', value: 35, color: '#00ff88', growth: 12 },
      { name: 'Meetings', value: 20, color: '#ff00ff', growth: -5 },
      { name: 'Browsing', value: 25, color: '#00ffff', growth: 8 },
      { name: 'Documentation', value: 15, color: '#ffaa00', growth: 15 },
      { name: 'Other', value: 5, color: '#8888ff', growth: -2 }
    ]
    setActivityData(stableActivityData)
  }, [])

  // Main update loop
  useEffect(() => {
    if (!autoRefresh || isPaused) return
    
    let lastUpdate = 0
    const updateInterval = 1000 / 3 // 3 FPS for very slow, stable updates
    
    const updateData = (timestamp) => {
      if (timestamp - lastUpdate >= refreshInterval) {
        // Update chart data with minimal changes
        setChartData(prev => prev.map(item => ({
          ...item,
          events: item.events + (Math.random() > 0.95 ? (Math.random() > 0.5 ? 1 : -1) : 0),
          suggestions: item.suggestions + (Math.random() > 0.98 ? (Math.random() > 0.5 ? 1 : -1) : 0),
          cpu: Math.max(0, Math.min(100, item.cpu + (Math.random() > 0.9 ? (Math.random() - 0.5) * 2 : 0))),
          memory: Math.max(0, Math.min(100, item.memory + (Math.random() > 0.9 ? (Math.random() - 0.5) * 2 : 0)))
        })))

        // Update real-time stats very slowly (no automatic notifications)
        setRealtimeStats(prev => {
          const newCpu = Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 1))
          const newMemory = Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 1))
          const newEvents = prev.events + (Math.random() > 0.98 ? 1 : 0) // Only 2% chance
          const newUptime = prev.uptime + 1
          const newNetwork = Math.max(0, prev.network + (Math.random() - 0.5) * 2)
          
          // No automatic notifications - only triggered by user actions
          
          return {
            cpu: newCpu,
            memory: newMemory,
            events: newEvents,
            uptime: newUptime,
            network: newNetwork
          }
        })

        // Update main stats very slowly
        setStats(prev => ({
          ...prev,
          events: prev.events + (Math.random() > 0.99 ? 1 : 0), // Only 1% chance
          rate: prev.rate + (Math.random() - 0.5) * 0.01
        }))
        
        lastUpdate = timestamp
      }
      
      if (autoRefresh && !isPaused) {
        animationFrameRef.current = requestAnimationFrame(updateData)
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateData)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (window.notificationTimeout) {
        clearTimeout(window.notificationTimeout)
      }
    }
  }, [stats, setStats, autoRefresh, refreshInterval, isPaused, notifications])

  // Export functions
  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      chartData: filteredChartData,
      activityData: activityData,
      realtimeStats: realtimeStats,
      stats: stats
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    saveAs(blob, `silent-killer-dashboard-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`)
    triggerExportNotification('JSON')
  }

  const exportCSV = () => {
    const csv = [
      ['Hour', 'Events', 'Suggestions', 'CPU', 'Memory'],
      ...filteredChartData.map(item => [
        item.hour,
        item.events,
        item.suggestions,
        item.cpu.toFixed(1),
        item.memory.toFixed(1)
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    saveAs(blob, `silent-killer-dashboard-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`)
    triggerExportNotification('CSV')
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3 shadow-lg">
          <p className="text-cyan-400 font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-cyan-200 text-sm">
              {entry.name}: {entry.value.toFixed(1)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Metric cards data
  const metricCards = [
    {
      title: 'Total Events',
      value: stats.events.toLocaleString(),
      icon: Activity,
      change: '+8%',
      color: 'text-cyan-400',
      bgColor: 'from-cyan-500/20 to-blue-600/20',
      borderColor: 'border-cyan-500/50',
      trend: 'up'
    },
    {
      title: 'Event Rate',
      value: `${stats.rate.toFixed(2)}/s`,
      icon: Zap,
      change: '+3%',
      color: 'text-green-400',
      bgColor: 'from-green-500/20 to-emerald-600/20',
      borderColor: 'border-green-500/50',
      trend: 'up'
    },
    {
      title: 'Uptime',
      value: `${Math.floor(stats.uptime / 60)}m`,
      icon: Clock,
      change: 'Active',
      color: 'text-purple-400',
      bgColor: 'from-purple-500/20 to-pink-600/20',
      borderColor: 'border-purple-500/50',
      trend: 'stable'
    },
    {
      title: 'CPU Usage',
      value: `${realtimeStats.cpu.toFixed(1)}%`,
      icon: Monitor,
      change: realtimeStats.cpu > 70 ? 'High' : 'Normal',
      color: realtimeStats.cpu > 70 ? 'text-red-400' : 'text-yellow-400',
      bgColor: realtimeStats.cpu > 70 ? 'from-red-500/20 to-rose-600/20' : 'from-yellow-500/20 to-orange-600/20',
      borderColor: realtimeStats.cpu > 70 ? 'border-red-500/50' : 'border-yellow-500/50',
      trend: realtimeStats.cpu > 70 ? 'up' : 'stable'
    },
    {
      title: 'Memory',
      value: `${realtimeStats.memory.toFixed(1)}%`,
      icon: Activity,
      change: realtimeStats.memory > 80 ? 'High' : 'Optimal',
      color: realtimeStats.memory > 80 ? 'text-red-400' : 'text-pink-400',
      bgColor: realtimeStats.memory > 80 ? 'from-red-500/20 to-rose-600/20' : 'from-pink-500/20 to-rose-600/20',
      borderColor: realtimeStats.memory > 80 ? 'border-red-500/50' : 'border-pink-500/50',
      trend: realtimeStats.memory > 80 ? 'up' : 'stable'
    },
    {
      title: 'Network',
      value: `${realtimeStats.network.toFixed(1)}%`,
      icon: MousePointer,
      change: 'Normal',
      color: 'text-blue-400',
      bgColor: 'from-blue-500/20 to-indigo-600/20',
      borderColor: 'border-blue-500/50',
      trend: 'stable'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">Neural Dashboard</h2>
          <p className="text-gray-400">Advanced monitoring with real-time analytics</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <input
              type="text"
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-900/50 border border-cyan-500/30 rounded-lg text-cyan-100 placeholder-cyan-600 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/25 transition-all"
            />
          </div>

          {/* Export Options */}
          <div className="flex items-center gap-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="bg-gray-900/50 border border-cyan-500/30 rounded-lg px-3 py-2 text-cyan-100 text-sm focus:outline-none focus:border-cyan-400"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0, 255, 136, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={exportFormat === 'json' ? exportData : exportCSV}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 p-2 rounded-lg transition-all shadow-lg shadow-cyan-500/25"
              title="Export data"
            >
              <Download className="w-4 h-4 text-white" />
            </motion.button>
          </div>

          {/* Pause/Play Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsPaused(!isPaused)
              triggerSettingsNotification('Auto Refresh', !isPaused)
            }}
            className={`p-2 rounded-lg transition-all ${
              isPaused 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500' 
                : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500'
            }`}
            title={isPaused ? "Resume updates" : "Pause updates"}
          >
            {isPaused ? <Play className="w-4 h-4 text-white" /> : <Pause className="w-4 h-4 text-white" />}
          </motion.button>

          {/* Settings Toggle */}
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(!showSettings)}
            className="bg-gray-900/50 border border-cyan-500/30 hover:bg-gray-800/50 p-2 rounded-lg transition-all"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
          </motion.button>

          {/* Refresh */}
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerRefreshNotification()
              window.location.reload()
            }}
            className="bg-gray-900/50 border border-cyan-500/30 hover:bg-gray-800/50 p-2 rounded-lg transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
          </motion.button>
        </div>
      </motion.div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-900/50 backdrop-blur-md border border-cyan-500/30 rounded-lg p-6 shadow-lg shadow-cyan-500/25"
          >
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">Dashboard Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-cyan-100">Auto Refresh</span>
                <button
                  onClick={() => {
                    setAutoRefresh(!autoRefresh)
                    triggerSettingsNotification('Auto Refresh', !autoRefresh)
                  }}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    autoRefresh ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    autoRefresh ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-cyan-100">Notifications</span>
                <button
                  onClick={() => {
                    setNotifications(!notifications)
                    triggerSettingsNotification('Notifications', !notifications)
                  }}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notifications ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-cyan-100">Dark Mode</span>
                <button
                  onClick={() => {
                    setDarkMode(!darkMode)
                    triggerSettingsNotification('Dark Mode', !darkMode)
                  }}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    darkMode ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-cyan-100">Refresh Rate</span>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="bg-gray-800/50 border border-cyan-500/30 rounded px-3 py-1 text-cyan-100 text-sm"
                >
                  <option value="10000">10s</option>
                  <option value="15000">15s (Recommended)</option>
                  <option value="30000">30s</option>
                  <option value="60000">60s</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Indicator */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <Pause className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Dashboard Updates Paused</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.05, 
                y: -5,
                boxShadow: "0 10px 30px rgba(0, 255, 136, 0.3)"
              }}
              className={`bg-gray-900/50 backdrop-blur-md p-4 bg-gradient-to-br ${metric.bgColor} border ${metric.borderColor} rounded-xl cursor-pointer transition-all`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${metric.color}`} />
                <div className={`flex items-center text-xs ${
                  metric.trend === 'up' ? 'text-green-400' : 
                  metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {metric.trend === 'up' && <ChevronUp className="w-3 h-3" />}
                  {metric.trend === 'down' && <ChevronDown className="w-3 h-3" />}
                  {metric.change}
                </div>
              </div>
              <p className="text-xs text-cyan-200 mb-1">{metric.title}</p>
              <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Enhanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline with Area Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ 
            scale: 1.02,
            boxShadow: "0 0 40px rgba(0, 255, 255, 0.3)",
            borderColor: "rgb(0, 255, 255)"
          }}
          onHoverStart={() => {
            setIsHoveringTimeline(true)
            setHoveredChart('timeline')
          }}
          onHoverEnd={() => {
            setIsHoveringTimeline(false)
            setHoveredChart(null)
          }}
          className="bg-gray-900/50 backdrop-blur-md p-6 border border-cyan-500/30 rounded-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-cyan-400">Neural Activity Timeline</h3>
              {(isPaused || isHoveringTimeline) && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/30">
                  {isPaused ? 'PAUSED' : 'HOVERING'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                <Eye className="w-4 h-4" />
              </button>
              <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                <Bell className="w-4 h-4" />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="eventsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ffff" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00ffff" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="suggestionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a3d3d" />
              <XAxis dataKey="hour" stroke="#00ffff" />
              <YAxis stroke="#00ffff" />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="events" 
                stroke="#00ffff" 
                strokeWidth={2}
                fill="url(#eventsGradient)"
                animationDuration={isHoveringTimeline ? 0 : 2000}
              />
              <Area 
                type="monotone" 
                dataKey="suggestions" 
                stroke="#00ff88" 
                strokeWidth={2}
                fill="url(#suggestionsGradient)"
                animationDuration={isHoveringTimeline ? 0 : 2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Enhanced Activity Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ 
            scale: 1.02,
            boxShadow: "0 0 40px rgba(255, 0, 255, 0.3)",
            borderColor: "rgb(255, 0, 255)"
          }}
          onHoverStart={() => {
            setIsHoveringPie(true)
            setHoveredChart('distribution')
          }}
          onHoverEnd={() => {
            setIsHoveringPie(false)
            setHoveredChart(null)
          }}
          className="bg-gray-900/50 backdrop-blur-md p-6 border border-purple-500/30 rounded-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-purple-400">Neural Activity Distribution</h3>
              {(isPaused || isHoveringPie) && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/30">
                  {isPaused ? 'PAUSED' : 'HOVERING'}
                </span>
              )}
            </div>
            <div className="text-sm text-cyan-400">
              <span className="text-green-400">↑ 12%</span> from last cycle
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                key={`pie-chart-${activityData.length}-${Date.now()}`}
                data={activityData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value, growth }) => {
                  const percentage = value.toFixed(0);
                  const growthSymbol = growth > 0 ? '↑' : growth < 0 ? '↓' : '→';
                  return `${name}: ${percentage}% ${growthSymbol}${Math.abs(growth)}%`;
                }}
                labelLine={false}
                animationBegin={0}
                animationDuration={isHoveringPie ? 0 : 2500}
                animationEasing="ease-in-out"
              >
                {activityData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Real-time System Monitoring */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 backdrop-blur-md p-6 border border-cyan-500/30 rounded-xl"
      >
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Neural System Monitoring</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'CPU Usage', value: realtimeStats.cpu, color: 'cyan', icon: Monitor },
            { name: 'Memory Usage', value: realtimeStats.memory, color: 'green', icon: Activity },
            { name: 'Network I/O', value: stats.rate * 10, color: 'purple', icon: Zap },
            { name: 'Event Rate', value: stats.rate * 10, color: 'yellow', icon: MousePointer }
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 text-${item.color}-400`} />
                    <span className="text-sm text-cyan-200">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-cyan-100">{item.value.toFixed(1)}%</span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-400`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, item.value)}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Enhanced Recent Events */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 backdrop-blur-md p-6 border border-cyan-500/30 rounded-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-cyan-400">Neural Event Log</h3>
          <button className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
            View All
          </button>
        </div>
        <div className="space-y-2">
          {[
            { type: 'window_focus', app: 'VSCode', time: '2 seconds ago', severity: 'low' },
            { type: 'command_run', app: 'Terminal', time: '15 seconds ago', severity: 'medium' },
            { type: 'file_open', app: 'Browser', time: '1 minute ago', severity: 'low' },
            { type: 'app_switch', app: 'Slack', time: '2 minutes ago', severity: 'high' },
            { type: 'notification', app: 'System', time: '3 minutes ago', severity: 'medium' }
          ].map((event, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-cyan-500/20 hover:bg-gray-700/50 transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  event.severity === 'high' ? 'bg-red-400' :
                  event.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                }`} />
                <span className="text-sm text-cyan-200">{event.type}</span>
                <span className="text-sm text-cyan-600">•</span>
                <span className="text-sm text-cyan-100 font-medium">{event.app}</span>
              </div>
              <span className="text-xs text-cyan-600">{event.time}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default FreshDashboard
