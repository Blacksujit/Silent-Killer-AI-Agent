import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, Play, Pause, Square, Download, RefreshCw, Settings, Activity, Zap, Clock, Eye, EyeOff, Filter, Search, Calendar, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { saveAs } from 'file-saver'
import toast from 'react-hot-toast'

const DEFAULT_USER_ID = 'default_user'

const EnhancedMonitorPanel = () => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [events, setEvents] = useState([])
  const [realtimeStats, setRealtimeStats] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    processes: 0,
    uptime: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [maxEvents, setMaxEvents] = useState(100)
  const [showDetails, setShowDetails] = useState(true)
  const [alerts, setAlerts] = useState([])
  const [thresholds, setThresholds] = useState({
    cpu: 80,
    memory: 85,
    disk: 90,
    network: 1000
  })

  const ingestEvent = async (ev) => {
    try {
      const payload = {
        user_id: DEFAULT_USER_ID,
        event_id: String(ev.id),
        timestamp: (ev.timestamp instanceof Date ? ev.timestamp : new Date(ev.timestamp)).toISOString(),
        type: ev.type,
        meta: {
          app: ev.app,
          severity: ev.severity,
          details: ev.details,
        },
      }

      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        toast.dismiss('monitor-ingest-error')
        toast.error('Event ingest failed (backend)', { id: 'monitor-ingest-error' })
      }
    } catch {
      toast.dismiss('monitor-ingest-error')
      toast.error('Event ingest failed (network)', { id: 'monitor-ingest-error' })
    }
  }

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        // Generate realistic monitoring data
        const newEvent = {
          id: Date.now(),
          timestamp: new Date(),
          type: ['window_focus', 'app_switch', 'key_press', 'mouse_move', 'file_open', 'command_run'][Math.floor(Math.random() * 6)],
          app: ['VSCode', 'Browser', 'Terminal', 'Slack', 'Email', 'System'][Math.floor(Math.random() * 6)],
          details: generateEventDetails(),
          severity: Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low'
        }

        ingestEvent(newEvent)

        setEvents(prev => {
          const updated = [newEvent, ...prev].slice(0, maxEvents)
          return updated
        })

        // Update real-time stats
        setRealtimeStats(prev => ({
          cpu: Math.sin(Date.now() / 10000) * 30 + 50 + Math.random() * 10,
          memory: Math.cos(Date.now() / 15000) * 20 + 60 + Math.random() * 10,
          disk: prev.disk + (Math.random() - 0.5) * 2,
          network: Math.sin(Date.now() / 8000) * 40 + 30 + Math.random() * 20,
          processes: Math.floor(Math.random() * 200) + 50,
          uptime: prev.uptime + 1
        }))

        // Check thresholds and create alerts
        checkThresholds()
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isMonitoring, maxEvents])

  const generateEventDetails = () => {
    const details = [
      'User switched to VSCode window',
      'New file opened: project.js',
      'Command executed: npm run dev',
      'Mouse movement detected',
      'Keyboard input detected',
      'Application focus changed',
      'File saved successfully',
      'Network request completed'
    ]
    return details[Math.floor(Math.random() * details.length)]
  }

  const checkThresholds = () => {
    const newAlerts = []
    
    if (realtimeStats.cpu > thresholds.cpu) {
      newAlerts.push({
        id: Date.now(),
        type: 'cpu',
        message: `CPU usage exceeded ${thresholds.cpu}%`,
        value: realtimeStats.cpu,
        severity: 'high',
        timestamp: new Date()
      })
    }
    
    if (realtimeStats.memory > thresholds.memory) {
      newAlerts.push({
        id: Date.now() + 1,
        type: 'memory',
        message: `Memory usage exceeded ${thresholds.memory}%`,
        value: realtimeStats.memory,
        severity: 'high',
        timestamp: new Date()
      })
    }
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50))
      toast.error(`System alert: ${newAlerts[0].message}`)
    }
  }

  const startMonitoring = () => {
    setIsMonitoring(true)
    toast.success('Monitoring started')
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
    toast.info('Monitoring stopped')
  }

  const clearEvents = () => {
    setEvents([])
    toast.success('Events cleared')
  }

  const exportEvents = () => {
    const data = {
      timestamp: new Date().toISOString(),
      monitoring: isMonitoring,
      stats: realtimeStats,
      events: events,
      alerts: alerts
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    saveAs(blob, `silent-killer-monitor-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`)
    toast.success('Monitoring data exported')
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.app.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.details.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || event.severity === filter
    return matchesSearch && matchesFilter
  })

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/50'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/50'
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/50'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/50'
    }
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'cpu': return <Monitor className="w-4 h-4" />
      case 'memory': return <Activity className="w-4 h-4" />
      case 'disk': return <Zap className="w-4 h-4" />
      case 'network': return <TrendingUp className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const eventLogRef = React.useRef(null)

  useEffect(() => {
    if (autoScroll && eventLogRef.current) {
      eventLogRef.current.scrollTop = 0
    }
  }, [events, autoScroll])

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Real-time Monitor</h2>
          <p className="text-gray-400">Live system monitoring with intelligent alerts</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
          >
            <option value="all">All Events</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Max Events */}
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-400">Max:</span>
            <input
              type="number"
              value={maxEvents}
              onChange={(e) => setMaxEvents(Number(e.target.value))}
              min="10"
              max="1000"
              className="w-16 bg-transparent text-white text-sm focus:outline-none"
            />
          </div>

          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-2 rounded-lg transition-colors ${
              autoScroll ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/20'
            }`}
            title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
          >
            {autoScroll ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
          </button>

          {/* Export */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportEvents}
            className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg transition-colors"
            title="Export monitoring data"
          >
            <Download className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </motion.div>

      {/* Monitoring Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism border border-white/20 rounded-xl p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                isMonitoring 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isMonitoring ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Stop Monitoring</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start Monitoring</span>
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearEvents}
              className="flex items-center space-x-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>Clear Events</span>
            </motion.button>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-sm text-gray-400">Status</p>
              <motion.p 
                className={`text-lg font-bold ${isMonitoring ? 'text-green-400' : 'text-gray-400'}`}
                animate={{ opacity: isMonitoring ? [1, 0.5, 1] : 1 }}
                transition={{ duration: 2, repeat: isMonitoring ? Infinity : 0 }}
              >
                {isMonitoring ? 'Active' : 'Inactive'}
              </motion.p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Events</p>
              <motion.p 
                className="text-lg font-bold text-blue-400"
                key={events.length}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {events.length}
              </motion.p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Uptime</p>
              <p className="text-lg font-bold text-purple-400">
                {Math.floor(realtimeStats.uptime / 60)}m
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Real-time Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { name: 'CPU', value: realtimeStats.cpu, icon: Monitor, color: 'blue', unit: '%' },
          { name: 'Memory', value: realtimeStats.memory, icon: Activity, color: 'green', unit: '%' },
          { name: 'Disk', value: realtimeStats.disk, icon: Zap, color: 'yellow', unit: '%' },
          { name: 'Network', value: realtimeStats.network, icon: TrendingUp, color: 'purple', unit: 'Mbps' },
          { name: 'Processes', value: realtimeStats.processes, icon: Settings, color: 'cyan', unit: '' },
          { name: 'Uptime', value: realtimeStats.uptime, icon: Clock, color: 'pink', unit: 's' }
        ].map((stat, index) => {
          const Icon = stat.icon
          const isOverThreshold = stat.name.toLowerCase() === 'cpu' && realtimeStats.cpu > thresholds.cpu ||
                               stat.name.toLowerCase() === 'memory' && realtimeStats.memory > thresholds.memory

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`glass-morphism p-4 rounded-xl border ${
                isOverThreshold ? 'border-red-500/50 bg-red-500/10' : 'border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 text-${stat.color}-400`} />
                {isOverThreshold && <AlertCircle className="w-4 h-4 text-red-400" />}
              </div>
              <p className="text-sm text-gray-400">{stat.name}</p>
              <p className={`text-xl font-bold text-${stat.color}-400`}>
                {stat.value.toFixed(1)}{stat.unit}
              </p>
              <div className="mt-2">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div 
                    className={`bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-400 h-2 rounded-full`}
                    style={{ width: `${Math.min(stat.value, 100)}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(stat.value, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-morphism border border-red-500/50 bg-red-500/10 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              System Alerts ({alerts.length})
            </h3>
            <button
              onClick={() => setAlerts([])}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {alerts.slice(0, 5).map((alert, index) => (
              <div key={alert.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getAlertIcon(alert.type)}
                  <span className="text-sm text-white">{alert.message}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {format(alert.timestamp, 'HH:mm:ss')}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Events Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism border border-white/20 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Event Log</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>{filteredEvents.length} events</span>
            {showDetails && <span>• Detailed view</span>}
          </div>
        </div>

        <div 
          ref={eventLogRef}
          className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar"
          style={{ maxHeight: '400px' }}
        >
          <AnimatePresence>
            {filteredEvents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">
                  {isMonitoring ? 'Waiting for events...' : 'Start monitoring to see events'}
                </p>
              </motion.div>
            ) : (
              filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className={`p-3 rounded-lg border ${getSeverityColor(event.severity)} ${
                    showDetails ? 'space-y-2' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        event.severity === 'high' ? 'bg-red-400' :
                        event.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                      }`} />
                      <span className="text-sm font-medium text-white">{event.type}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-300">{event.app}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(event.timestamp, 'HH:mm:ss')}
                    </span>
                  </div>
                  
                  {showDetails && (
                    <div className="text-sm text-gray-400 pl-5">
                      {event.details}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Event Log Controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Auto-scroll: {autoScroll ? 'On' : 'Off'}</span>
            <span>•</span>
            <span>Max events: {maxEvents}</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default EnhancedMonitorPanel
