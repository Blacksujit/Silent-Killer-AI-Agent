import React, { useState, useEffect } from 'react'
import { Settings, Save, RotateCcw, Shield, Database, Bell, Monitor, User, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDeviceId } from '../hooks/useDeviceId'

const SettingsPanel = () => {
  const { deviceId, userId, updateUserId, isUsingCustomId } = useDeviceId()
  const [customUserId, setCustomUserId] = useState('')
  const [settings, setSettings] = useState({
    api_url: 'http://localhost:8000',
    api_key: 'dev-key',
    user_id: 'default_user',
    monitoring_enabled: true,
    notifications_enabled: true,
    auto_execute_threshold: 0.9,
    data_retention_days: 30,
    privacy_mode: true,
    log_level: 'info'
  })

  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('silent-killer-settings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const handleSaveUserId = () => {
    updateUserId(customUserId || null)
    setCustomUserId('')
    toast.success('User ID updated')
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Save to localStorage
      localStorage.setItem('silent-killer-settings', JSON.stringify(settings))
      
      // Test API connection
      const response = await fetch(`${settings.api_url}/api/health`)
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        alert('Failed to connect to API. Please check your settings.')
      }
    } catch (error) {
      alert('Error saving settings: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    const defaultSettings = {
      api_url: 'http://localhost:8000',
      api_key: 'dev-key',
      user_id: 'default_user',
      monitoring_enabled: true,
      notifications_enabled: true,
      auto_execute_threshold: 0.9,
      data_retention_days: 30,
      privacy_mode: true,
      log_level: 'info'
    }
    setSettings(defaultSettings)
    localStorage.setItem('silent-killer-settings', JSON.stringify(defaultSettings))
  }

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <p className="text-gray-400">Configure your SILENT KILLER experience</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleReset}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-white flex items-center space-x-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {saved && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
          <p className="text-green-400">Settings saved successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User & Device Management */}
        <div className="glass-morphism p-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">User & Device</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Device ID
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-800/50 p-2 rounded text-sm text-gray-300 overflow-x-auto">
                  {deviceId}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(deviceId)
                    toast.success('Device ID copied to clipboard')
                  }}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                This ID is unique to this device. It's used to track your activity.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                User ID
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customUserId}
                  onChange={(e) => setCustomUserId(e.target.value)}
                  placeholder={isUsingCustomId ? userId : "Enter a custom user ID..."}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
                <button
                  onClick={handleSaveUserId}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                >
                  {isUsingCustomId ? 'Update' : 'Set'} User ID
                </button>
                {isUsingCustomId && (
                  <button
                    onClick={() => updateUserId(null)}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
                  >
                    Reset to Device ID
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {isUsingCustomId 
                  ? `Using custom user ID. All data will be associated with this ID.`
                  : "Set a custom user ID to sync data across devices. Leave empty to use device ID."}
              </p>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="glass-morphism p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">API Configuration</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API URL
              </label>
              <input
                type="text"
                value={settings.api_url}
                onChange={(e) => handleChange('api_url', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                placeholder="http://localhost:8000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={settings.api_key}
                onChange={(e) => handleChange('api_key', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                placeholder="Your API key"
              />
            </div>
          </div>
        </div>

        {/* Monitoring Settings */}
        <div className="glass-morphism p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Monitor className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Monitoring</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Enable Monitoring
              </label>
              <button
                onClick={() => handleChange('monitoring_enabled', !settings.monitoring_enabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.monitoring_enabled ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.monitoring_enabled ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Enable Notifications
              </label>
              <button
                onClick={() => handleChange('notifications_enabled', !settings.notifications_enabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications_enabled ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.notifications_enabled ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Auto-execute Threshold
              </label>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.1"
                value={settings.auto_execute_threshold}
                onChange={(e) => handleChange('auto_execute_threshold', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 mt-1">
                {(settings.auto_execute_threshold * 100).toFixed(0)}% confidence required
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="glass-morphism p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Privacy & Security</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Privacy Mode
              </label>
              <button
                onClick={() => handleChange('privacy_mode', !settings.privacy_mode)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.privacy_mode ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.privacy_mode ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data Retention (days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.data_retention_days}
                onChange={(e) => handleChange('data_retention_days', parseInt(e.target.value))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              />
            </div>
            
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-400">
                Privacy mode anonymizes sensitive data like window titles and personal information.
              </p>
            </div>
          </div>
        </div>

        {/* Data & Storage */}
        <div className="glass-morphism p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Data & Storage</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Log Level
              </label>
              <select
                value={settings.log_level}
                onChange={(e) => handleChange('log_level', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <button className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-lg px-4 py-2 text-blue-400 transition-colors">
                Export Data
              </button>
              <button className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded-lg px-4 py-2 text-red-400 transition-colors">
                Clear All Data
              </button>
            </div>
            
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-400">
                Total events stored: 1,234<br />
                Database size: 2.5 MB<br />
                Last backup: 2 hours ago
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="glass-morphism p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2" />
            <p className="text-sm text-gray-400">API Connection</p>
            <p className="text-white">Connected</p>
          </div>
          <div className="text-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2" />
            <p className="text-sm text-gray-400">Database</p>
            <p className="text-white">Healthy</p>
          </div>
          <div className="text-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-2" />
            <p className="text-sm text-gray-400">Storage</p>
            <p className="text-white">62% Used</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
