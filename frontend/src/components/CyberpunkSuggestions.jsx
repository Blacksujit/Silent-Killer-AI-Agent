import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, Zap, Download, Search, Filter, Calendar, Star, Archive, Trash2, Edit, Save, Share2, Bell, BellOff } from 'lucide-react'
import { format } from 'date-fns'
import { saveAs } from 'file-saver'
import toast from 'react-hot-toast'
import { useDeviceId } from '../hooks/useDeviceId'

const CyberpunkSuggestions = () => {
  const { userId } = useDeviceId()
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('confidence')
  const [viewMode, setViewMode] = useState('cards')
  const [selectedSuggestions, setSelectedSuggestions] = useState([])
  const [showArchived, setShowArchived] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [editingSuggestion, setEditingSuggestion] = useState(null)

  useEffect(() => {
    fetchSuggestions()
    const interval = setInterval(fetchSuggestions, 10000)
    return () => clearInterval(interval)
  }, [userId])

  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/suggestions?user_id=${encodeURIComponent(userId)}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      toast.error('Failed to fetch suggestions')
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
          user_id: userId,
          suggestion_id: suggestionId,
          action: action
        })
      })
      
      if (response.ok) {
        setSuggestions(prev => 
          prev.map(s => 
            s.id === suggestionId 
              ? { ...s, userAction: action, actionedAt: new Date().toISOString() }
              : s
          )
        )
        
        if (notifications) {
          toast.success(`Neural suggestion ${action}ed successfully!`)
        }
      }
    } catch (error) {
      console.error('Error recording action:', error)
      toast.error('Failed to record neural action')
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedSuggestions.length === 0) {
      toast.error('No neural suggestions selected')
      return
    }

    try {
      const promises = selectedSuggestions.map(id => 
        fetch('/api/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            suggestion_id: id,
            action: action
          })
        })
      )

      await Promise.all(promises)
      
      setSuggestions(prev => 
        prev.map(s => 
          selectedSuggestions.includes(s.id) 
            ? { ...s, userAction: action, actionedAt: new Date().toISOString() }
            : s
        )
      )
      
      setSelectedSuggestions([])
      toast.success(`Bulk neural ${action} completed!`)
    } catch (error) {
      console.error('Error in bulk action:', error)
      toast.error('Bulk neural action failed')
    }
  }

  const archiveSuggestion = (suggestionId) => {
    setSuggestions(prev => 
      prev.map(s => 
        s.id === suggestionId 
          ? { ...s, archived: true, archivedAt: new Date().toISOString() }
          : s
      )
    )
    toast.success('Neural suggestion archived')
  }

  const deleteSuggestion = (suggestionId) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
    toast.success('Neural suggestion deleted')
  }

  const exportSuggestions = () => {
    const data = {
      timestamp: new Date().toISOString(),
      suggestions: suggestions,
      stats: {
        total: suggestions.length,
        accepted: suggestions.filter(s => s.userAction === 'accept').length,
        rejected: suggestions.filter(s => s.userAction === 'reject').length,
        pending: suggestions.filter(s => !s.userAction).length
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    saveAs(blob, `silent-killer-neural-suggestions-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`)
    toast.success('Neural suggestions exported successfully')
  }

  const shareSuggestion = (suggestion) => {
    if (navigator.share) {
      navigator.share({
        title: suggestion.title,
        text: suggestion.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(`${suggestion.title}: ${suggestion.description}`)
      toast.success('Neural suggestion copied to clipboard')
    }
  }

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

  const filteredAndSortedSuggestions = suggestions
    .filter(s => {
      const matchesFilter = filter === 'all' || s.severity === filter
      const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           s.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesArchive = showArchived ? true : !s.archived
      return matchesFilter && matchesSearch && matchesArchive
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'confidence': return b.confidence - a.confidence
        case 'severity': return (b.severity === 'high' ? 3 : b.severity === 'medium' ? 2 : 1) - 
                           (a.severity === 'high' ? 3 : a.severity === 'medium' ? 2 : 1)
        case 'date': return new Date(b.created_ts || 0) - new Date(a.created_ts || 0)
        default: return 0
      }
    })

  const stats = {
    total: suggestions.length,
    accepted: suggestions.filter(s => s.userAction === 'accept').length,
    rejected: suggestions.filter(s => s.userAction === 'reject').length,
    pending: suggestions.filter(s => !s.userAction && !s.archived).length,
    archived: suggestions.filter(s => s.archived).length
  }

  return (
    <div className="space-y-6">
      {/* Header with Enhanced Controls */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">Neural Intelligence</h2>
          <p className="text-gray-400">AI-powered neural insights with advanced filtering and actions</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <input
              type="text"
              placeholder="Search neural suggestions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-900/50 border border-cyan-500/30 rounded-lg text-cyan-100 placeholder-cyan-600 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/25 transition-all"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-900/50 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Neural Suggestions</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-900/50 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400"
            >
              <option value="confidence">Sort by Confidence</option>
              <option value="severity">Sort by Severity</option>
              <option value="date">Sort by Date</option>
            </select>

            <button
              onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
              className="bg-gray-900/50 border border-cyan-500/30 hover:bg-gray-800/50 p-2 rounded-lg transition-all"
              title="Toggle view"
            >
              {viewMode === 'cards' ? '📋' : '🎴'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`p-2 rounded-lg transition-colors ${
                showArchived ? 'bg-cyan-600' : 'bg-gray-900/50 border border-cyan-500/30 hover:bg-gray-800/50'
              }`}
              title={showArchived ? 'Hide Archived' : 'Show Archived'}
            >
              <Archive className="w-4 h-4 text-white" />
            </button>

            <button
              onClick={() => setNotifications(!notifications)}
              className={`p-2 rounded-lg transition-colors ${
                notifications ? 'bg-cyan-600' : 'bg-gray-900/50 border border-cyan-500/30 hover:bg-gray-800/50'
              }`}
              title={notifications ? 'Disable Notifications' : 'Enable Notifications'}
            >
              {notifications ? <Bell className="w-4 h-4 text-white" /> : <BellOff className="w-4 h-4 text-white" />}
            </button>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0, 255, 136, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={exportSuggestions}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 p-2 rounded-lg transition-all shadow-lg shadow-cyan-500/25"
              title="Export neural suggestions"
            >
              <Download className="w-4 h-4 text-white" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Neural', value: stats.total, icon: Lightbulb, color: 'from-cyan-500/20 to-blue-600/20' },
          { label: 'Accepted', value: stats.accepted, icon: CheckCircle, color: 'from-green-500/20 to-emerald-600/20' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'from-red-500/20 to-rose-600/20' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'from-yellow-500/20 to-orange-600/20' },
          { label: 'Archived', value: stats.archived, icon: Archive, color: 'from-purple-500/20 to-pink-600/20' }
        ].map((stat, index) => {
          const Icon = stat.icon
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
              className={`bg-gray-900/50 backdrop-blur-md p-4 bg-gradient-to-br ${stat.color} border border-cyan-500/30 rounded-xl cursor-pointer transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cyan-200">{stat.label}</p>
                  <p className="text-2xl font-bold text-cyan-100">{stat.value}</p>
                </div>
                <Icon className="w-6 h-6 text-cyan-400" />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Bulk Actions */}
      {selectedSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 backdrop-blur-md border border-cyan-500/30 bg-cyan-500/10 rounded-lg p-4 shadow-lg shadow-cyan-500/25"
        >
          <div className="flex items-center justify-between">
            <span className="text-cyan-100">{selectedSuggestions.length} neural suggestions selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('accept')}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white transition-colors"
              >
                Accept All
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white transition-colors"
              >
                Reject All
              </button>
              <button
                onClick={() => setSelectedSuggestions([])}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-white transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Suggestions Display */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            <p className="text-gray-400 mt-4">Analyzing neural patterns...</p>
          </motion.div>
        ) : filteredAndSortedSuggestions.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No neural suggestions found</p>
            <p className="text-gray-500">Try adjusting your neural filters or generate more activity</p>
          </motion.div>
        ) : (
          <motion.div
            key="suggestions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={viewMode === 'cards' ? 'space-y-4' : 'space-y-2'}
          >
            {filteredAndSortedSuggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 0 30px rgba(0, 255, 136, 0.2)"
                }}
                className={`bg-gray-900/50 backdrop-blur-md border rounded-lg ${
                  viewMode === 'cards' ? 'p-6' : 'p-4'
                } ${getSeverityColor(suggestion.severity)} ${
                  selectedSuggestions.includes(suggestion.id) ? 'ring-2 ring-cyan-400' : ''
                } transition-all`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedSuggestions.includes(suggestion.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSuggestions(prev => [...prev, suggestion.id])
                        } else {
                          setSelectedSuggestions(prev => prev.filter(id => id !== suggestion.id))
                        }
                      }}
                      className="mt-1 rounded border-gray-600 bg-gray-700 text-cyan-600 focus:ring-cyan-500"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        {getSeverityIcon(suggestion.severity)}
                        <h3 className="text-lg font-semibold text-cyan-100">{suggestion.title}</h3>
                        <span className="text-sm text-cyan-400">
                          Neural Confidence: {(suggestion.confidence * 100).toFixed(0)}%
                        </span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(suggestion.confidence * 5)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-cyan-200 mb-4">{suggestion.description}</p>
                      
                      {suggestion.suggested_action && (
                        <div className="bg-cyan-500/10 rounded-lg p-3 mb-4 border border-cyan-500/30">
                          <p className="text-sm text-cyan-400 mb-1">Neural Action:</p>
                          <p className="text-cyan-100">{suggestion.suggested_action}</p>
                        </div>
                      )}
                      
                      {suggestion.evidence && suggestion.evidence.length > 0 && (
                        <div className="text-xs text-cyan-600 mb-4">
                          <p className="mb-1 font-medium">Neural Evidence:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {suggestion.evidence.slice(0, 3).map((evidence, idx) => (
                              <li key={idx}>{evidence}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {suggestion.created_ts && (
                        <div className="text-xs text-cyan-600">
                          Neural Created: {format(new Date(suggestion.created_ts), 'MMM dd, yyyy HH:mm')}
                        </div>
                      )}
                    </div>
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
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleAction(suggestion.id, 'accept')}
                          className="bg-green-600 hover:bg-green-700 p-2 rounded-lg transition-colors"
                          title="Accept neural suggestion"
                        >
                          <CheckCircle className="w-4 h-4 text-white" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleAction(suggestion.id, 'reject')}
                          className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-colors"
                          title="Reject neural suggestion"
                        >
                          <XCircle className="w-4 h-4 text-white" />
                        </motion.button>
                      </>
                    )}
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => shareSuggestion(suggestion)}
                      className="bg-cyan-600 hover:bg-cyan-700 p-2 rounded-lg transition-colors"
                      title="Share neural suggestion"
                    >
                      <Share2 className="w-4 h-4 text-white" />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => archiveSuggestion(suggestion.id)}
                      className="bg-yellow-600 hover:bg-yellow-700 p-2 rounded-lg transition-colors"
                      title="Archive neural suggestion"
                    >
                      <Archive className="w-4 h-4 text-white" />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteSuggestion(suggestion.id)}
                      className="bg-gray-600 hover:bg-gray-700 p-2 rounded-lg transition-colors"
                      title="Delete neural suggestion"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CyberpunkSuggestions
