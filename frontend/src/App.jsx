import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Activity, Zap, Monitor, BarChart3, Lightbulb, Moon, Sun, Bell, BellOff, Menu, X, Sparkles, Eye } from 'lucide-react'
import Dashboard from './components/CleanDashboard'
import Suggestions from './components/CyberpunkSuggestions'
import MonitorPanel from './components/EnhancedMonitorPanel'
import InsightsPanel from './components/InsightsPanel'
import AmbientMonitor from './components/AmbientMonitor'
import toast, { Toaster } from 'react-hot-toast'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isConnected, setIsConnected] = useState(false)
  const [stats, setStats] = useState({ events: 0, uptime: 0, rate: 0 })
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const prevConnectedRef = useRef(null)

  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 10000) // Check every 10 seconds instead of 5
    return () => clearInterval(interval)
  }, [])

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/health')
      const nowConnected = response.ok
      setIsConnected(nowConnected)
      
      const wasConnected = prevConnectedRef.current
      prevConnectedRef.current = nowConnected

      // Show a single initial "connected" toast on first successful check
      if (wasConnected === null) {
        if (nowConnected && notifications) {
          toast.dismiss('connection-status')
          toast.success('Connected to backend', {
            duration: 4000,
            position: 'top-right',
            id: 'connection-status',
          })
        }
        return
      }

      // Show notification only when connection status CHANGES (ref-based; no stale state)
      if (wasConnected !== null && wasConnected !== nowConnected && notifications) {
        if (nowConnected) {
          toast.dismiss('connection-status')
          toast.success('Connected to backend', {
            duration: 4000,
            position: 'top-right',
            id: 'connection-status',
          })
        } else {
          toast.dismiss('connection-status')
          toast.error('Lost connection to backend', {
            duration: 4000,
            position: 'top-right',
            id: 'connection-status',
          })
        }
      }
    } catch (error) {
      setIsConnected(false)
    }
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'from-blue-500 to-blue-600' },
    { id: 'suggestions', label: 'Suggestions', icon: Lightbulb, color: 'from-green-500 to-green-600' },
    { id: 'monitor', label: 'Monitor', icon: Monitor, color: 'from-purple-500 to-purple-600' },
    { id: 'insights', label: 'Insights', icon: Sparkles, color: 'from-cyan-500 to-purple-600' },
    { id: 'ambient', label: 'Ambient AI', icon: Eye, color: 'from-pink-500 to-purple-600' },
  ]

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'}`}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(0, 0, 0, 0.95)',
            border: '1px solid rgba(0, 255, 255, 0.5)',
            color: '#00ffff',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 8px 32px rgba(0, 255, 255, 0.2)',
            maxWidth: '400px',
            margin: '16px',
          },
          success: {
            iconTheme: {
              primary: '#00ff88',
              secondary: 'rgba(0, 0, 0, 0.95)',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff0066',
              secondary: 'rgba(0, 0, 0, 0.95)',
            },
          },
        }}
        containerStyle={{
          top: 20,
          right: 20,
          zIndex: 99999,
        }}
      />

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20"
      >
        {sidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              className="w-64 h-full bg-gray-900/95 backdrop-blur-md border-r border-white/10 p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-white">SILENT KILLER</h2>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id)
                        setSidebarOpen(false)
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        activeTab === tab.id
                          ? `bg-gradient-to-r ${tab.color} text-white`
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${darkMode ? 'glass-morphism border-b border-white/10' : 'glass-morphism-light border-b border-gray-200'}`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <motion.div
                  animate={{ rotate: isConnected ? 360 : 0 }}
                  transition={{ duration: 2, repeat: isConnected ? Infinity : 0, ease: "linear" }}
                >
                  <Brain className="w-8 h-8 text-blue-400" />
                </motion.div>
                <motion.div 
                  className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                  animate={{ scale: isConnected ? [1, 1.2, 1] : [1, 0.8, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>SILENT KILLER</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ambient Intelligence for Productivity</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right hidden sm:block">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
                <motion.p 
                  className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {isConnected ? 'Connected' : 'Disconnected'}
                </motion.p>
              </div>
              <div className="text-right hidden sm:block">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Events</p>
                <motion.p 
                  className={`text-lg font-bold text-blue-400`}
                  key={stats.events}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                >
                  {stats.events.toLocaleString()}
                </motion.p>
              </div>
              <div className="text-right hidden sm:block">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rate</p>
                <p className={`text-lg font-bold text-green-400`}>{stats.rate.toFixed(1)}/s</p>
              </div>
              
              {/* Control Buttons */}
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setNotifications(!notifications)}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  title={notifications ? 'Disable notifications' : 'Enable notifications'}
                >
                  {notifications ? 
                    <Bell className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-gray-700'}`} /> : 
                    <BellOff className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
                  }
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {darkMode ? 
                    <Moon className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-gray-700'}`} /> : 
                    <Sun className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
                  }
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Navigation - Desktop */}
      <nav className={`hidden lg:block ${darkMode ? 'glass-morphism border-b border-white/10' : 'glass-morphism-light border-b border-gray-200'}`}>
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                      : darkMode 
                        ? 'text-gray-400 hover:text-white hover:bg-white/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'dashboard' && <Dashboard stats={stats} setStats={setStats} />}
            {activeTab === 'suggestions' && <Suggestions />}
            {activeTab === 'monitor' && <MonitorPanel />}
            {activeTab === 'insights' && <InsightsPanel />}
            {activeTab === 'ambient' && <AmbientMonitor />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className={`${darkMode ? 'glass-morphism border-t border-white/10' : 'glass-morphism-light border-t border-gray-200'} mt-auto`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm">
            <div className="flex items-center space-x-2 mb-2 sm:mb-0">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>SILENT KILLER v1.0.0</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>🧠 AI-Powered Productivity</span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>•</span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>⚡ Real-time Monitoring</span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>•</span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>🎯 Intelligent Suggestions</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
