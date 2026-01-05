import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Activity, Zap, TrendingUp, Clock, Monitor, MousePointer, Download, RefreshCw, Calendar, Filter, Search, Bell, Settings, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'
import { saveAs } from 'file-saver'
import toast from 'react-hot-toast'

const CyberpunkDashboard = ({ stats, setStats }) => {
  const [chartData, setChartData] = useState([])
  const [activityData, setActivityData] = useState([])
  const [realtimeStats, setRealtimeStats] = useState({
    cpu: 0,
    memory: 0,
    events: 0,
    uptime: 0,
    network: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({ start: null, end: null })
  const [showSettings, setShowSettings] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(10000)
  const [exportFormat, setExportFormat] = useState('json')
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [hoveredChart, setHoveredChart] = useState(null)
  const [isPaused, setIsPaused] = useState(false)
  const [lastNotificationTime, setLastNotificationTime] = useState(0)
  const animationFrameRef = useRef(null)

  // Notification function with proper timing control
  const showNotification = (title, message, type = 'info') => {
    const now = Date.now()
    // Only show notification if at least 30 seconds have passed since last one
    if (now - lastNotificationTime < 30000) {
      return
    }
    
    setLastNotificationTime(now)
    
    switch (type) {
      case 'warning':
        toast.error(`${title}: ${message}`, {
          duration: 5000,
          position: 'top-right',
        })
        break
      case 'success':
        toast.success(`${title}: ${message}`, {
          duration: 4000,
          position: 'top-right',
        })
        break
      default:
        toast(`${title}: ${message}`, {
          duration: 4000,
          position: 'top-right',
        })
    }
  }

  // Use useMemo to prevent unnecessary recalculations
  const filteredChartData = useMemo(() => {
    if (!searchTerm) return chartData
    return chartData.filter(item => 
      item.hour.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [chartData, searchTerm])

  useEffect(() => {
    if (!autoRefresh) return
    
    let lastUpdate = 0
    const updateInterval = 1000 / 5 // 5 FPS for very slow, readable updates
    
    const updateData = (timestamp) => {
      if (timestamp - lastUpdate >= refreshInterval && !isPaused) {
        // Generate realistic chart data with very stable values
        const now = new Date()
        const newChartData = Array.from({ length: 24 }, (_, i) => {
          const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000)
          return {
            hour: format(hour, 'HH:00'),
            events: Math.floor(Math.sin(i / 4) * 20 + 100 + Math.random() * 5),
            suggestions: Math.floor(Math.cos(i / 6) * 3 + 12 + Math.random() * 2),
            cpu: Math.sin(i / 8) * 15 + 50 + Math.random() * 3,
            memory: Math.cos(i / 10) * 10 + 60 + Math.random() * 5
          }
        })
        setChartData(newChartData)

        // Generate activity distribution with realistic percentages
        const totalActivities = 100
        const newActivityData = [
          { name: 'Coding', value: 35, color: '#00ff88', growth: 12 },
          { name: 'Meetings', value: 20, color: '#ff00ff', growth: -5 },
          { name: 'Browsing', value: 25, color: '#00ffff', growth: 8 },
          { name: 'Documentation', value: 15, color: '#ffaa00', growth: 15 },
          { name: 'Other', value: 5, color: '#8888ff', growth: -2 }
        ]
        setActivityData(newActivityData)

        // Update real-time stats with very slow, stable changes
        setRealtimeStats(prev => {
          const newCpu = Math.sin(Date.now() / 30000) * 10 + 50 + Math.random() * 3
          const newMemory = Math.cos(Date.now() / 35000) * 8 + 60 + Math.random() * 3
          const newEvents = prev.events + (Math.random() > 0.9 ? 1 : 0) // Only increment 10% of the time
          const newUptime = prev.uptime + 1
          const newNetwork = Math.sin(Date.now() / 25000) * 15 + 30 + Math.random() * 5
          
          // Show notifications only for critical changes
          if (notifications && Math.random() > 0.98) { // Only 2% chance per update
            if (newCpu > 75) {
              showNotification('High CPU Usage', `CPU usage is at ${newCpu.toFixed(1)}%`, 'warning')
            }
            if (newMemory > 85) {
              showNotification('High Memory Usage', `Memory usage is at ${newMemory.toFixed(1)}%`, 'warning')
            }
          }
          
          return {
            cpu: newCpu,
            memory: newMemory,
            events: newEvents,
            uptime: newUptime,
            network: newNetwork
          }
        })

        setStats(prev => ({
          ...prev,
          events: prev.events + (Math.random() > 0.95 ? 1 : 0), // Only increment 5% of the time
          rate: (prev.events + (Math.random() > 0.95 ? 1 : 0)) / Math.max(1, prev.uptime)
        }))
        
        lastUpdate = timestamp
      }
      
      if (autoRefresh) {
        animationFrameRef.current = requestAnimationFrame(updateData)
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateData)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [stats, setStats, autoRefresh, refreshInterval])

  const metricCards = [
    {
      title: 'Total Events',
      value: stats.events.toLocaleString(),
      icon: Activity,
      change: '+12%',
      color: 'text-cyan-400',
      bgColor: 'from-cyan-500/20 to-blue-600/20',
      borderColor: 'border-cyan-500/50',
      trend: 'up'
    },
    {
      title: 'Event Rate',
      value: `${stats.rate.toFixed(1)}/s`,
      icon: Zap,
      change: '+5%',
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
      change: 'Normal',
      color: 'text-yellow-400',
      bgColor: 'from-yellow-500/20 to-orange-600/20',
      borderColor: 'border-yellow-500/50',
      trend: realtimeStats.cpu > 70 ? 'up' : 'stable'
    },
    {
      title: 'Memory',
      value: `${realtimeStats.memory.toFixed(1)}%`,
      icon: Activity,
      change: 'Optimal',
      color: 'text-pink-400',
      bgColor: 'from-pink-500/20 to-rose-600/20',
      borderColor: 'border-pink-500/50',
      trend: realtimeStats.memory > 80 ? 'up' : 'down'
    },
    {
      title: 'Network',
      value: `${realtimeStats.network.toFixed(1)}%`,
      icon: Zap,
      change: 'Active',
      color: 'text-orange-400',
      bgColor: 'from-orange-500/20 to-red-600/20',
      borderColor: 'border-orange-500/50',
      trend: 'up'
    }
  ]

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      stats: stats,
      realtimeStats: realtimeStats,
      chartData: filteredChartData,
      activityData: activityData
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    saveAs(blob, `silent-killer-dashboard-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`)
  }

  const exportCSV = () => {
    const csvContent = [
      ['Time', 'Events', 'Suggestions', 'CPU', 'Memory'],
      ...filteredChartData.map(row => [row.hour, row.events, row.suggestions, row.cpu, row.memory])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    saveAs(blob, `silent-killer-data-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`)
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-md border border-cyan-500/50 rounded-lg p-3 shadow-lg shadow-cyan-500/25">
          <p className="text-cyan-400 font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">Cyberpunk Dashboard</h2>
          <p className="text-gray-400">Neural productivity monitoring with advanced analytics</p>
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
            onClick={() => window.location.reload()}
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
                  onClick={() => setAutoRefresh(!autoRefresh)}
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
                  onClick={() => setNotifications(!notifications)}
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
                  onClick={() => setDarkMode(!darkMode)}
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
                  <option value="10000">10s (Recommended)</option>
                  <option value="15000">15s</option>
                  <option value="30000">30s</option>
                  <option value="60000">60s</option>
                </select>
              </div>
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
              className={`bg-gray-900/50 backdrop-blur-md p-6 bg-gradient-to-br ${metric.bgColor} border ${metric.borderColor} rounded-xl cursor-pointer transition-all`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-6 h-6 ${metric.color}`} />
                <div className={`flex items-center text-xs ${
                  metric.trend === 'up' ? 'text-green-400' : 
                  metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {metric.trend === 'up' && <ChevronUp className="w-3 h-3" />}
                  {metric.trend === 'down' && <ChevronDown className="w-3 h-3" />}
                  {metric.change}
                </div>
              </div>
              <p className="text-sm text-cyan-200 mb-1">{metric.title}</p>
              <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
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
          whileHover={{ boxShadow: "0 0 30px rgba(0, 255, 255, 0.2)" }}
          className="bg-gray-900/50 backdrop-blur-md p-6 border border-cyan-500/30 rounded-xl transition-all"
          onMouseEnter={() => {
            setHoveredChart('timeline')
            setIsPaused(true)
          }}
          onMouseLeave={() => {
            setHoveredChart(null)
            setIsPaused(false)
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-cyan-400">Neural Activity Timeline</h3>
              {isPaused && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/30">
                  PAUSED
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
                animationDuration={hoveredChart === 'timeline' ? 0 : 1500}
              />
              <Area 
                type="monotone" 
                dataKey="suggestions" 
                stroke="#00ff88" 
                strokeWidth={2}
                fill="url(#suggestionsGradient)"
                animationDuration={hoveredChart === 'timeline' ? 0 : 1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Enhanced Activity Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ boxShadow: "0 0 30px rgba(255, 0, 255, 0.2)" }}
          className="bg-gray-900/50 backdrop-blur-md p-6 border border-purple-500/30 rounded-xl transition-all"
          onMouseEnter={() => {
            setHoveredChart('distribution')
            setIsPaused(true)
          }}
          onMouseLeave={() => {
            setHoveredChart(null)
            setIsPaused(false)
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-purple-400">Neural Activity Distribution</h3>
              {isPaused && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/30">
                  PAUSED
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
                animationDuration={hoveredChart === 'distribution' ? 0 : 1500}
              >
                {activityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
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
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <motion.div 
                      className={`bg-gradient-to-r from-${item.color}-500 to-${item.color}-400 h-3 rounded-full`}
                      style={{ width: `${item.value}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-sm" />
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
              whileHover={{ 
                scale: 1.02, 
                x: 5,
                boxShadow: "0 0 20px rgba(0, 255, 136, 0.2)"
              }}
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

export default CyberpunkDashboard
