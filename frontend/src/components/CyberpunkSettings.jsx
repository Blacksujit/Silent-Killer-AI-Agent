import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Download, Upload, Save, RotateCcw, Eye, EyeOff, Bell, BellOff, Moon, Sun, Zap, Shield, Database, Cpu, HardDrive, Wifi, Monitor, Keyboard, Mouse, Volume2, VolumeX } from 'lucide-react'
import { saveAs } from 'file-saver'
import toast from 'react-hot-toast'

const CyberpunkSettings = () => {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    general: {
      darkMode: true,
      notifications: true,
      autoRefresh: true,
      refreshInterval: 2000,
      language: 'en',
      timezone: 'UTC'
    },
    monitoring: {
      cpuThreshold: 80,
      memoryThreshold: 85,
      diskThreshold: 90,
      networkThreshold: 1000,
      enableAlerts: true,
      logLevel: 'info'
    },
    privacy: {
      dataRetention: 30,
      enablePIIHashing: true,
      shareAnonymousData: false,
      enableLocalBackup: true,
      encryptData: true
    },
    interface: {
      compactMode: false,
      showAnimations: true,
      highContrast: false,
      fontSize: 'medium',
      theme: 'cyberpunk'
    },
    advanced: {
      debugMode: false,
      enableBetaFeatures: false,
      logApiCalls: false,
      maxEvents: 1000,
      enableWebhooks: false
    }
  })

  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('silent-killer-settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
  }, [])

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
    setHasChanges(true)
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      localStorage.setItem('silent-killer-settings', JSON.stringify(settings))
      toast.success('Neural settings saved successfully!')
      setHasChanges(false)
    } catch (error) {
      toast.error('Failed to save neural settings')
      console.error('Save settings error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const resetSettings = () => {
    const defaultSettings = {
      general: {
        darkMode: true,
        notifications: true,
        autoRefresh: true,
        refreshInterval: 2000,
        language: 'en',
        timezone: 'UTC'
      },
      monitoring: {
        cpuThreshold: 80,
        memoryThreshold: 85,
        diskThreshold: 90,
        networkThreshold: 1000,
        enableAlerts: true,
        logLevel: 'info'
      },
      privacy: {
        dataRetention: 30,
        enablePIIHashing: true,
        shareAnonymousData: false,
        enableLocalBackup: true,
        encryptData: true
      },
      interface: {
        compactMode: false,
        showAnimations: true,
        highContrast: false,
        fontSize: 'medium',
        theme: 'cyberpunk'
      },
      advanced: {
        debugMode: false,
        enableBetaFeatures: false,
        logApiCalls: false,
        maxEvents: 1000,
        enableWebhooks: false
      }
    }
    setSettings(defaultSettings)
    setHasChanges(true)
    toast.info('Neural settings reset to defaults')
  }

  const exportSettings = () => {
    const data = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      settings: settings
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    saveAs(blob, `silent-killer-settings-${new Date().toISOString().split('T')[0]}.json`)
    toast.success('Neural settings exported successfully')
  }

  const importSettings = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (data.settings) {
            setSettings(data.settings)
            setHasChanges(true)
            toast.success('Neural settings imported successfully')
          } else {
            toast.error('Invalid neural settings file')
          }
        } catch (error) {
          toast.error('Failed to import neural settings')
          console.error('Import error:', error)
        }
      }
      reader.readAsText(file)
    }
  }

  const tabs = [
    { id: 'general', label: 'Neural Core', icon: Cpu },
    { id: 'monitoring', label: 'Monitoring', icon: Monitor },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'interface', label: 'Interface', icon: Eye },
    { id: 'advanced', label: 'Advanced', icon: Zap }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">Neural Settings</h2>
          <p className="text-gray-400">Configure your neural intelligence system</p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0, 255, 136, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={exportSettings}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-4 py-2 rounded-lg text-white transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
          
          <label className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-2 rounded-lg text-white transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="hidden"
            />
          </label>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetSettings}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0, 255, 136, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={saveSettings}
            disabled={!hasChanges || isSaving}
            className={`px-6 py-2 rounded-lg text-white transition-all flex items-center gap-2 ${
              hasChanges 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/25' 
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </motion.button>
        </div>
      </motion.div>

      {/* Settings Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-cyan-500/30 pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-gray-900/50 border border-cyan-500/30 text-cyan-400 hover:bg-gray-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Settings Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-900/50 backdrop-blur-md border border-cyan-500/30 rounded-xl p-6"
        >
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-4">Neural Core Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-cyan-100 font-medium">Dark Mode</label>
                      <p className="text-sm text-cyan-600">Enable neural dark theme</p>
                    </div>
                    <button
                      onClick={() => updateSetting('general', 'darkMode', !settings.general.darkMode)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.general.darkMode ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.general.darkMode ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-cyan-100 font-medium">Notifications</label>
                      <p className="text-sm text-cyan-600">Enable neural notifications</p>
                    </div>
                    <button
                      onClick={() => updateSetting('general', 'notifications', !settings.general.notifications)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.general.notifications ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.general.notifications ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-cyan-100 font-medium">Auto Refresh</label>
                      <p className="text-sm text-cyan-600">Auto-refresh neural data</p>
                    </div>
                    <button
                      onClick={() => updateSetting('general', 'autoRefresh', !settings.general.autoRefresh)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.general.autoRefresh ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.general.autoRefresh ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-cyan-100 font-medium block mb-2">Refresh Interval</label>
                    <select
                      value={settings.general.refreshInterval}
                      onChange={(e) => updateSetting('general', 'refreshInterval', Number(e.target.value))}
                      className="w-full bg-gray-800/50 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="1000">1 second</option>
                      <option value="2000">2 seconds</option>
                      <option value="5000">5 seconds</option>
                      <option value="10000">10 seconds</option>
                      <option value="30000">30 seconds</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-cyan-100 font-medium block mb-2">Language</label>
                    <select
                      value={settings.general.language}
                      onChange={(e) => updateSetting('general', 'language', e.target.value)}
                      className="w-full bg-gray-800/50 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-cyan-100 font-medium block mb-2">Timezone</label>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                      className="w-full bg-gray-800/50 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time</option>
                      <option value="PST">Pacific Time</option>
                      <option value="CET">Central European</option>
                      <option value="JST">Japan Standard</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monitoring Settings */}
          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-4">Neural Monitoring Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-cyan-100 font-medium block mb-2">CPU Alert Threshold (%)</label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={settings.monitoring.cpuThreshold}
                      onChange={(e) => updateSetting('monitoring', 'cpuThreshold', Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-cyan-600">
                      <span>50%</span>
                      <span className="text-cyan-100 font-bold">{settings.monitoring.cpuThreshold}%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-cyan-100 font-medium block mb-2">Memory Alert Threshold (%)</label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={settings.monitoring.memoryThreshold}
                      onChange={(e) => updateSetting('monitoring', 'memoryThreshold', Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-cyan-600">
                      <span>50%</span>
                      <span className="text-cyan-100 font-bold">{settings.monitoring.memoryThreshold}%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-cyan-100 font-medium block mb-2">Disk Alert Threshold (%)</label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={settings.monitoring.diskThreshold}
                      onChange={(e) => updateSetting('monitoring', 'diskThreshold', Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-cyan-600">
                      <span>50%</span>
                      <span className="text-cyan-100 font-bold">{settings.monitoring.diskThreshold}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-cyan-100 font-medium block mb-2">Network Alert Threshold (Mbps)</label>
                    <input
                      type="range"
                      min="100"
                      max="2000"
                      step="100"
                      value={settings.monitoring.networkThreshold}
                      onChange={(e) => updateSetting('monitoring', 'networkThreshold', Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-cyan-600">
                      <span>100 Mbps</span>
                      <span className="text-cyan-100 font-bold">{settings.monitoring.networkThreshold} Mbps</span>
                      <span>2000 Mbps</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-cyan-100 font-medium block mb-2">Log Level</label>
                    <select
                      value={settings.monitoring.logLevel}
                      onChange={(e) => updateSetting('monitoring', 'logLevel', e.target.value)}
                      className="w-full bg-gray-800/50 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="debug">Debug</option>
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-cyan-100 font-medium">Enable Alerts</label>
                      <p className="text-sm text-cyan-600">Show neural alert notifications</p>
                    </div>
                    <button
                      onClick={() => updateSetting('monitoring', 'enableAlerts', !settings.monitoring.enableAlerts)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.monitoring.enableAlerts ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.monitoring.enableAlerts ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-4">Neural Privacy Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-cyan-100 font-medium block mb-2">Data Retention (days)</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={settings.privacy.dataRetention}
                      onChange={(e) => updateSetting('privacy', 'dataRetention', Number(e.target.value))}
                      className="w-full bg-gray-800/50 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-cyan-100 font-medium">Enable PII Hashing</label>
                      <p className="text-sm text-cyan-600">Hash personal identifiable information</p>
                    </div>
                    <button
                      onClick={() => updateSetting('privacy', 'enablePIIHashing', !settings.privacy.enablePIIHashing)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.privacy.enablePIIHashing ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.privacy.enablePIIHashing ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-cyan-100 font-medium">Enable Local Backup</label>
                      <p className="text-sm text-cyan-600">Create local neural data backups</p>
                    </div>
                    <button
                      onClick={() => updateSetting('privacy', 'enableLocalBackup', !settings.privacy.enableLocalBackup)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.privacy.enableLocalBackup ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.privacy.enableLocalBackup ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-cyan-100 font-medium">Share Anonymous Data</label>
                      <p className="text-sm text-cyan-600">Help improve neural intelligence</p>
                    </div>
                    <button
                      onClick={() => updateSetting('privacy', 'shareAnonymousData', !settings.privacy.shareAnonymousData)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.privacy.shareAnonymousData ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.privacy.shareAnonymousData ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-cyan-100 font-medium">Encrypt Data</label>
                      <p className="text-sm text-cyan-600">Encrypt stored neural data</p>
                    </div>
                    <button
                      onClick={() => updateSetting('privacy', 'encryptData', !settings.privacy.encryptData)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.privacy.encryptData ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.privacy.encryptData ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interface Settings */}
          {activeTab === 'interface' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-4">Neural Interface Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-cyan-100 font-medium">Compact Mode</label>
                      <p className="text-sm text-cyan-600">Reduce neural interface spacing</p>
                    </div>
                    <button
                      onClick={() => updateSetting('interface', 'compactMode', !settings.interface.compactMode)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.interface.compactMode ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.interface.compactMode ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-cyan-100 font-medium">Show Animations</label>
                      <p className="text-sm text-cyan-600">Enable neural animations</p>
                    </div>
                    <button
                      onClick={() => updateSetting('interface', 'showAnimations', !settings.interface.showAnimations)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.interface.showAnimations ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.interface.showAnimations ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-cyan-100 font-medium">High Contrast</label>
                      <p className="text-sm text-cyan-600">Increase neural contrast</p>
                    </div>
                    <button
                      onClick={() => updateSetting('interface', 'highContrast', !settings.interface.highContrast)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.interface.highContrast ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.interface.highContrast ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-cyan-100 font-medium block mb-2">Font Size</label>
                    <select
                      value={settings.interface.fontSize}
                      onChange={(e) => updateSetting('interface', 'fontSize', e.target.value)}
                      className="w-full bg-gray-800/50 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="xlarge">Extra Large</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-cyan-100 font-medium block mb-2">Neural Theme</label>
                    <select
                      value={settings.interface.theme}
                      onChange={(e) => updateSetting('interface', 'theme', e.target.value)}
                      className="w-full bg-gray-800/50 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="cyberpunk">Cyberpunk</option>
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="matrix">Matrix</option>
                      <option value="synthwave">Synthwave</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-4">Advanced Neural Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-cyan-100 font-medium">Debug Mode</label>
                      <p className="text-sm text-cyan-600">Enable neural debugging</p>
                    </div>
                    <button
                      onClick={() => updateSetting('advanced', 'debugMode', !settings.advanced.debugMode)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.advanced.debugMode ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.advanced.debugMode ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-cyan-100 font-medium">Enable Beta Features</label>
                      <p className="text-sm text-cyan-600">Access experimental neural features</p>
                    </div>
                    <button
                      onClick={() => updateSetting('advanced', 'enableBetaFeatures', !settings.advanced.enableBetaFeatures)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.advanced.enableBetaFeatures ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.advanced.enableBetaFeatures ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-cyan-100 font-medium">Log API Calls</label>
                      <p className="text-sm text-cyan-600">Log neural API interactions</p>
                    </div>
                    <button
                      onClick={() => updateSetting('advanced', 'logApiCalls', !settings.advanced.logApiCalls)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.advanced.logApiCalls ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.advanced.logApiCalls ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-cyan-100 font-medium block mb-2">Max Events</label>
                    <input
                      type="number"
                      min="100"
                      max="10000"
                      step="100"
                      value={settings.advanced.maxEvents}
                      onChange={(e) => updateSetting('advanced', 'maxEvents', Number(e.target.value))}
                      className="w-full bg-gray-800/50 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-cyan-100 font-medium">Enable Webhooks</label>
                      <p className="text-sm text-cyan-600">Enable neural webhook integrations</p>
                    </div>
                    <button
                      onClick={() => updateSetting('advanced', 'enableWebhooks', !settings.advanced.enableWebhooks)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.advanced.enableWebhooks ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.advanced.enableWebhooks ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default CyberpunkSettings
