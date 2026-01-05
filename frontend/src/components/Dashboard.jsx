import React, { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity, Zap, TrendingUp, Clock, Monitor, MousePointer } from 'lucide-react'

const Dashboard = ({ stats, setStats }) => {
  const [chartData, setChartData] = useState([])
  const [activityData, setActivityData] = useState([])
  const [realtimeStats, setRealtimeStats] = useState({
    cpu: 0,
    memory: 0,
    events: 0,
    uptime: 0
  })

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      // Generate sample chart data
      const newChartData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        events: Math.floor(Math.random() * 100) + 20,
        suggestions: Math.floor(Math.random() * 10) + 1
      }))
      setChartData(newChartData)

      // Generate activity distribution
      const newActivityData = [
        { name: 'Coding', value: 35, color: '#3B82F6' },
        { name: 'Meetings', value: 20, color: '#10B981' },
        { name: 'Browsing', value: 25, color: '#F59E0B' },
        { name: 'Documentation', value: 15, color: '#8B5CF6' },
        { name: 'Other', value: 5, color: '#6B7280' }
      ]
      setActivityData(newActivityData)

      // Update real-time stats
      setRealtimeStats({
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        events: stats.events + Math.floor(Math.random() * 5),
        uptime: stats.uptime + 1
      })

      setStats(prev => ({
        ...prev,
        events: prev.events + Math.floor(Math.random() * 3),
        rate: prev.events / Math.max(1, prev.uptime)
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [stats, setStats])

  const metricCards = [
    {
      title: 'Total Events',
      value: stats.events.toLocaleString(),
      icon: Activity,
      change: '+12%',
      color: 'text-blue-400'
    },
    {
      title: 'Event Rate',
      value: `${stats.rate.toFixed(1)}/s`,
      icon: Zap,
      change: '+5%',
      color: 'text-green-400'
    },
    {
      title: 'Uptime',
      value: `${Math.floor(stats.uptime / 60)}m`,
      icon: Clock,
      change: 'Active',
      color: 'text-purple-400'
    },
    {
      title: 'CPU Usage',
      value: `${realtimeStats.cpu.toFixed(1)}%`,
      icon: Monitor,
      change: 'Normal',
      color: 'text-yellow-400'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div key={index} className="glass-morphism p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{metric.title}</p>
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                  <p className="text-xs text-gray-500">{metric.change}</p>
                </div>
                <Icon className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <div className="glass-morphism p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Activity Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Line type="monotone" dataKey="events" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="suggestions" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Distribution */}
        <div className="glass-morphism p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Activity Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={activityData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {activityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-time Monitoring */}
      <div className="glass-morphism p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Real-time Monitoring</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <Monitor className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm text-gray-400">CPU Usage</p>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${realtimeStats.cpu}%` }}
                  />
                </div>
                <span className="text-sm text-white">{realtimeStats.cpu.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm text-gray-400">Memory Usage</p>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${realtimeStats.memory}%` }}
                  />
                </div>
                <span className="text-sm text-white">{realtimeStats.memory.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <MousePointer className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-sm text-gray-400">Event Rate</p>
              <p className="text-lg font-bold text-purple-400">{stats.rate.toFixed(1)}/s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="glass-morphism p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Events</h3>
        <div className="space-y-2">
          {[
            { type: 'window_focus', app: 'VSCode', time: '2 seconds ago' },
            { type: 'command_run', app: 'Terminal', time: '15 seconds ago' },
            { type: 'file_open', app: 'Browser', time: '1 minute ago' },
            { type: 'app_switch', app: 'Slack', time: '2 minutes ago' },
          ].map((event, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <span className="text-sm text-gray-300">{event.type}</span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-white">{event.app}</span>
              </div>
              <span className="text-xs text-gray-500">{event.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
