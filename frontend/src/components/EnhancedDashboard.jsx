import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Activity, Zap, TrendingUp, Clock, Monitor, MousePointer, Download, RefreshCw, Calendar, Filter, Search, Bell, Settings, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'
import { saveAs } from 'file-saver'

const EnhancedDashboard = ({ stats, setStats }) => {
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
  const [refreshInterval, setRefreshInterval] = useState(2000)
  const [exportFormat, setExportFormat] = useState('json')
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      // Generate realistic chart data
      const now = new Date()
      const newChartData = Array.from({ length: 24 }, (_, i) => {
        const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000)
        return {
          hour: format(hour, 'HH:00'),
          events: Math.floor(Math.sin(i / 4) * 50 + 100 + Math.random() * 20),
          suggestions: Math.floor(Math.cos(i / 6) * 8 + 12 + Math.random() * 5),
          cpu: Math.sin(i / 8) * 30 + 50 + Math.random() * 10,
          memory: Math.cos(i / 10) * 20 + 60 + Math.random() * 15
        }
      })
      setChartData(newChartData)

      // Generate activity distribution
      const newActivityData = [
        { name: 'Coding', value: 35 + Math.random() * 10, color: '#3B82F6', growth: 12 },
        { name: 'Meetings', value: 20 + Math.random() * 5, color: '#10B981', growth: -5 },
        { name: 'Browsing', value: 25 + Math.random() * 8, color: '#F59E0B', growth: 8 },
        { name: 'Documentation', value: 15 + Math.random() * 5, color: '#8B5CF6', growth: 15 },
        { name: 'Other', value: 5 + Math.random() * 3, color: '#6B7280', growth: -2 }
      ]
      setActivityData(newActivityData)

      // Update real-time stats with realistic values
      setRealtimeStats({
        cpu: Math.sin(Date.now() / 10000) * 30 + 50 + Math.random() * 10,
        memory: Math.cos(Date.now() / 15000) * 20 + 60 + Math.random() * 10,
        events: stats.events + Math.floor(Math.random() * 3),
        uptime: stats.uptime + 1,
        network: Math.sin(Date.now() / 8000) * 40 + 30 + Math.random() * 20
      })

      setStats(prev => ({
        ...prev,
        events: prev.events + Math.floor(Math.random() * 2),
        rate: prev.events / Math.max(1, prev.uptime)
      }))
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [stats, setStats, autoRefresh, refreshInterval])

  const metricCards = [
    {
      title: 'Total Events',
      value: stats.events.toLocaleString(),
      icon: Activity,
      change: '+12%',
      color: 'text-blue-400',
      bgColor: 'from-blue-500/20 to-blue-600/20',
      trend: 'up'
    },
    {
      title: 'Event Rate',
      value: `${stats.rate.toFixed(1)}/s`,
      icon: Zap,
      change: '+5%',
      color: 'text-green-400',
      bgColor: 'from-green-500/20 to-green-600/20',
      trend: 'up'
    },
    {
      title: 'Uptime',
      value: `${Math.floor(stats.uptime / 60)}m`,
      icon: Clock,
      change: 'Active',
      color: 'text-purple-400',
      bgColor: 'from-purple-500/20 to-purple-600/20',
      trend: 'stable'
    },
    {
      title: 'CPU Usage',
      value: `${realtimeStats.cpu.toFixed(1)}%`,
      icon: Monitor,
      change: 'Normal',
      color: 'text-yellow-400',
      bgColor: 'from-yellow-500/20 to-yellow-600/20',
      trend: realtimeStats.cpu > 70 ? 'up' : 'stable'
    },
    {
      title: 'Memory',
      value: `${realtimeStats.memory.toFixed(1)}%`,
      icon: Activity,
      change: 'Optimal',
      color: 'text-cyan-400',
      bgColor: 'from-cyan-500/20 to-cyan-600/20',
      trend: realtimeStats.memory > 80 ? 'up' : 'down'
    },
    {
      title: 'Network',
      value: `${realtimeStats.network.toFixed(1)}%`,
      icon: Zap,
      change: 'Active',
      color: 'text-pink-400',
      bgColor: 'from-pink-500/20 to-pink-600/20',
      trend: 'up'
    }
  ]

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      stats: stats,
      realtimeStats: realtimeStats,
      chartData: chartData,
      activityData: activityData
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    saveAs(blob, `silent-killer-dashboard-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`)
  }

  const exportCSV = () => {
    const csvContent = [
      ['Time', 'Events', 'Suggestions', 'CPU', 'Memory'],
      ...chartData.map(row => [row.hour, row.events, row.suggestions, row.cpu, row.memory])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    saveAs(blob, `silent-killer-data-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`)
  }

  const filteredChartData = chartData.filter(item => 
    item.hour.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Enhanced Dashboard</h2>
          <p className="text-gray-400">Real-time productivity monitoring with advanced analytics</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              className="bg-transparent text-white text-sm focus:outline-none"
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              className="bg-transparent text-white text-sm focus:outline-none"
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>

          {/* Export Options */}
          <div className="flex items-center gap-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportFormat === 'json' ? exportData : exportCSV}
              className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg transition-colors"
              title="Export data"
            >
              <Download className="w-4 h-4 text-white" />
            </motion.button>
          </div>

          {/* Settings Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(!showSettings)}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-white" />
          </motion.button>

          {/* Refresh */}
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-white" />
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
            className="glass-morphism border border-white/20 rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Dashboard Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Auto Refresh</span>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    autoRefresh ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    autoRefresh ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Notifications</span>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notifications ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Dark Mode</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    darkMode ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Refresh Rate</span>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-sm"
                >
                  <option value="1000">1s</option>
                  <option value="2000">2s</option>
                  <option value="5000">5s</option>
                  <option value="10000">10s</option>
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
              whileHover={{ scale: 1.05, y: -5 }}
              className={`glass-morphism p-6 bg-gradient-to-br ${metric.bgColor} border border-white/20 rounded-xl cursor-pointer`}
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
              <p className="text-sm text-gray-300 mb-1">{metric.title}</p>
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
          className="glass-morphism p-6 border border-white/20 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Activity Timeline</h3>
            <div className="flex items-center gap-2">
              <button className="text-gray-400 hover:text-white transition-colors">
                <Eye className="w-4 h-4" />
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">
                <Bell className="w-4 h-4" />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredChartData}>
              <defs>
                <linearGradient id="eventsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="suggestionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Area 
                type="monotone" 
                dataKey="events" 
                stroke="#3B82F6" 
                strokeWidth={2}
                fill="url(#eventsGradient)"
              />
              <Area 
                type="monotone" 
                dataKey="suggestions" 
                stroke="#10B981" 
                strokeWidth={2}
                fill="url(#suggestionsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Enhanced Activity Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-morphism p-6 border border-white/20 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Activity Distribution</h3>
            <div className="text-sm text-gray-400">
              <span className="text-green-400">↑ 12%</span> from last week
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
                label={({ name, value, growth }) => `${name}: ${value.toFixed(1)}% (${growth > 0 ? '+' : ''}${growth}%)`}
              >
                {activityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#F3F4F6' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Real-time System Monitoring */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism p-6 border border-white/20 rounded-xl"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Real-time System Monitoring</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'CPU Usage', value: realtimeStats.cpu, color: 'blue', icon: Monitor },
            { name: 'Memory Usage', value: realtimeStats.memory, color: 'green', icon: Activity },
            { name: 'Network I/O', value: realtimeStats.network, color: 'purple', icon: Zap },
            { name: 'Event Rate', value: stats.rate * 10, color: 'yellow', icon: MousePointer }
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 text-${item.color}-400`} />
                    <span className="text-sm text-gray-300">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{item.value.toFixed(1)}%</span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <motion.div 
                      className={`bg-gradient-to-r from-${item.color}-500 to-${item.color}-400 h-3 rounded-full`}
                      style={{ width: `${item.value}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-sm" />
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
        className="glass-morphism p-6 border border-white/20 rounded-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Events</h3>
          <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
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
              whileHover={{ scale: 1.02, x: 5 }}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  event.severity === 'high' ? 'bg-red-400' :
                  event.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                }`} />
                <span className="text-sm text-gray-300">{event.type}</span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-white font-medium">{event.app}</span>
              </div>
              <span className="text-xs text-gray-500">{event.time}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default EnhancedDashboard
