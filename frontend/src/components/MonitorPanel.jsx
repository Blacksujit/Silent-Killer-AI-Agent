import React, { useState, useEffect } from 'react'
import { Play, Pause, Square, Activity, Monitor, MousePointer, Keyboard, FileText } from 'lucide-react'

const MonitorPanel = () => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [stats, setStats] = useState({
    events: 0,
    uptime: 0,
    rate: 0,
    cpu: 0,
    memory: 0
  })
  const [recentEvents, setRecentEvents] = useState([])
  const [log, setLog] = useState([])

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        // Simulate monitoring data
        setStats(prev => ({
          events: prev.events + Math.floor(Math.random() * 5),
          uptime: prev.uptime + 1,
          rate: (prev.events + Math.floor(Math.random() * 5)) / Math.max(1, prev.uptime + 1),
          cpu: Math.random() * 100,
          memory: Math.random() * 100
        }))

        // Add recent events
        const eventTypes = ['mouse_move', 'key_press', 'window_focus', 'file_open', 'app_switch']
        const apps = ['VSCode', 'Browser', 'Terminal', 'Slack', 'Email']
        
        const newEvent = {
          id: Date.now(),
          type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          app: apps[Math.floor(Math.random() * apps.length)],
          timestamp: new Date().toLocaleTimeString(),
          details: 'User activity detected'
        }
        
        setRecentEvents(prev => [newEvent, ...prev.slice(0, 9)])
        
        // Add log entry
        setLog(prev => [`[${new Date().toLocaleTimeString()}] ${newEvent.type} - ${newEvent.app}`, ...prev.slice(0, 49)])
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isMonitoring])

  const startMonitoring = () => {
    setIsMonitoring(true)
    setLog(prev => [`[${new Date().toLocaleTimeString()}] Monitoring started`, ...prev])
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
    setLog(prev => [`[${new Date().toLocaleTimeString()}] Monitoring stopped`, ...prev])
  }

  const clearLog = () => {
    setLog([])
  }

  const getEventIcon = (type) => {
    switch (type) {
      case 'mouse_move': return <MousePointer className="w-4 h-4 text-blue-400" />
      case 'key_press': return <Keyboard className="w-4 h-4 text-green-400" />
      case 'window_focus': return <Monitor className="w-4 h-4 text-purple-400" />
      case 'file_open': return <FileText className="w-4 h-4 text-yellow-400" />
      default: return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="glass-morphism p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Activity Monitor</h2>
            <p className="text-gray-400">Real-time system and user activity tracking</p>
          </div>
          <div className="flex items-center space-x-4">
            {!isMonitoring ? (
              <button
                onClick={startMonitoring}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white flex items-center space-x-2 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Start Monitoring</span>
              </button>
            ) : (
              <button
                onClick={stopMonitoring}
                className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-white flex items-center space-x-2 transition-colors"
              >
                <Square className="w-4 h-4" />
                <span>Stop Monitoring</span>
              </button>
            )}
            <button
              onClick={clearLog}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded-lg text-white transition-colors"
            >
              Clear Log
            </button>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-white">
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
            </span>
          </div>
          {isMonitoring && (
            <div className="text-sm text-gray-400">
              Uptime: {Math.floor(stats.uptime)}s | Events: {stats.events} | Rate: {stats.rate.toFixed(1)}/s
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-morphism p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Events</p>
              <p className="text-2xl font-bold text-blue-400">{stats.events.toLocaleString()}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="glass-morphism p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Event Rate</p>
              <p className="text-2xl font-bold text-green-400">{stats.rate.toFixed(1)}/s</p>
            </div>
            <MousePointer className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="glass-morphism p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">CPU Usage</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.cpu.toFixed(1)}%</p>
            </div>
            <Monitor className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="glass-morphism p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Memory Usage</p>
              <p className="text-2xl font-bold text-purple-400">{stats.memory.toFixed(1)}%</p>
            </div>
            <Activity className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <div className="glass-morphism p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Events</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No events yet. Start monitoring to see activity.</p>
            ) : (
              recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getEventIcon(event.type)}
                    <div>
                      <p className="text-sm text-white">{event.type}</p>
                      <p className="text-xs text-gray-400">{event.app}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{event.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="glass-morphism p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Activity Log</h3>
          <div className="bg-black/50 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs">
            {log.length === 0 ? (
              <p className="text-gray-500">No log entries yet.</p>
            ) : (
              log.map((entry, index) => (
                <div key={index} className="text-green-400 mb-1">
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Resources */}
      <div className="glass-morphism p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Resources</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">CPU Usage</span>
              <span className="text-sm text-white">{stats.cpu.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats.cpu}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Memory Usage</span>
              <span className="text-sm text-white">{stats.memory.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats.memory}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonitorPanel
