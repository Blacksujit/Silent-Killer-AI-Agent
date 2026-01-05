import React, { useState, useEffect } from 'react'
import { Lightbulb, AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, Zap } from 'lucide-react'

const Suggestions = () => {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    // Fetch suggestions from API
    fetchSuggestions()
    const interval = setInterval(fetchSuggestions, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/suggestions?user_id=default_user')
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (suggestionId, action) => {
    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'default_user',
          suggestion_id: suggestionId,
          action: action
        })
      })
      
      if (response.ok) {
        // Update local state
        setSuggestions(prev => 
          prev.map(s => 
            s.id === suggestionId 
              ? { ...s, userAction: action }
              : s
          )
        )
      }
    } catch (error) {
      console.error('Error recording action:', error)
    }
  }

  const filteredSuggestions = suggestions.filter(s => {
    if (filter === 'all') return true
    return s.severity === filter
  })

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'low': return <Lightbulb className="w-4 h-4 text-green-400" />
      default: return <Lightbulb className="w-4 h-4 text-gray-400" />
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-500/50 bg-red-500/10'
      case 'medium': return 'border-yellow-500/50 bg-yellow-500/10'
      case 'low': return 'border-green-500/50 bg-green-500/10'
      default: return 'border-gray-500/50 bg-gray-500/10'
    }
  }

  const mockSuggestions = [
    {
      id: '1',
      title: 'High context switching detected',
      description: 'You switched focus 15 times in the last 10 minutes. Consider batching similar tasks.',
      severity: 'high',
      confidence: 0.85,
      evidence: ['window_focus at 09:30:00', 'app_switch at 09:31:00', 'window_focus at 09:32:00'],
      suggested_action: 'Try time-blocking or the Pomodoro technique',
      userAction: null
    },
    {
      id: '2',
      title: 'Repeated manual sequence',
      description: 'The sequence (open file → edit → save → close) repeated 8 times - you could automate this.',
      severity: 'medium',
      confidence: 0.92,
      evidence: ['file_open at 09:15:00', 'file_edit at 09:16:00', 'file_save at 09:17:00'],
      suggested_action: 'Create a macro or script for this workflow',
      userAction: null
    },
    {
      id: '3',
      title: 'Frequent short interruptions',
      description: 'Found 6 short work sessions (<5 minutes). Consider scheduling uninterrupted focus time.',
      severity: 'low',
      confidence: 0.78,
      evidence: ['session_start at 09:00:00', 'session_end at 09:03:00', 'session_start at 09:05:00'],
      suggested_action: 'Try 25-minute focus sessions with notification silencing',
      userAction: null
    }
  ]

  const displaySuggestions = suggestions.length > 0 ? suggestions : mockSuggestions

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Productivity Suggestions</h2>
          <p className="text-gray-400">AI-powered insights to optimize your workflow</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Suggestions</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <button
            onClick={fetchSuggestions}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-morphism p-4">
          <div className="flex items-center space-x-3">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-sm text-gray-400">Total Suggestions</p>
              <p className="text-xl font-bold text-white">{displaySuggestions.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-morphism p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-sm text-gray-400">High Priority</p>
              <p className="text-xl font-bold text-white">
                {displaySuggestions.filter(s => s.severity === 'high').length}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-morphism p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm text-gray-400">Acceptance Rate</p>
              <p className="text-xl font-bold text-white">67%</p>
            </div>
          </div>
        </div>
        <div className="glass-morphism p-4">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm text-gray-400">Avg Confidence</p>
              <p className="text-xl font-bold text-white">
                {displaySuggestions.length > 0 
                  ? (displaySuggestions.reduce((sum, s) => sum + s.confidence, 0) / displaySuggestions.length * 100).toFixed(0)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <p className="text-gray-400 mt-2">Analyzing your patterns...</p>
          </div>
        ) : displaySuggestions.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No suggestions available yet. Keep working to generate insights!</p>
          </div>
        ) : (
          displaySuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`glass-morphism border rounded-lg p-6 ${getSeverityColor(suggestion.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getSeverityIcon(suggestion.severity)}
                    <h3 className="text-lg font-semibold text-white">{suggestion.title}</h3>
                    <span className="text-sm text-gray-400">
                      Confidence: {(suggestion.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  <p className="text-gray-300 mb-4">{suggestion.description}</p>
                  
                  {suggestion.suggested_action && (
                    <div className="bg-white/5 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-400">Suggested Action:</p>
                      <p className="text-white">{suggestion.suggested_action}</p>
                    </div>
                  )}
                  
                  {suggestion.evidence && suggestion.evidence.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <p className="mb-1">Evidence:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {suggestion.evidence.slice(0, 3).map((evidence, index) => (
                          <li key={index}>{evidence}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {suggestion.userAction ? (
                    <div className="flex items-center space-x-2">
                      {suggestion.userAction === 'accept' ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-green-400 text-sm">Accepted</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-400" />
                          <span className="text-red-400 text-sm">Rejected</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleAction(suggestion.id, 'accept')}
                        className="bg-green-600 hover:bg-green-700 p-2 rounded-lg transition-colors"
                        title="Accept suggestion"
                      >
                        <CheckCircle className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={() => handleAction(suggestion.id, 'reject')}
                        className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-colors"
                        title="Reject suggestion"
                      >
                        <XCircle className="w-4 h-4 text-white" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Suggestions
