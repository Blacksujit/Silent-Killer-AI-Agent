import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Clock, Download, Filter, Flame, Lightbulb, RefreshCw, Search, Target, TrendingDown, TrendingUp, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDeviceId } from '../hooks/useDeviceId'

const formatTimeAgo = (isoOrDate) => {
  try {
    const dt = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
    const diff = Date.now() - dt.getTime()
    const sec = Math.max(0, Math.floor(diff / 1000))
    if (sec < 60) return `${sec}s ago`
    const min = Math.floor(sec / 60)
    if (min < 60) return `${min}m ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}h ago`
    const day = Math.floor(hr / 24)
    return `${day}d ago`
  } catch {
    return '—'
  }
}

const clamp = (n, a, b) => Math.max(a, Math.min(b, n))

const InsightsPanel = () => {
  const { deviceId, userId } = useDeviceId()
  const [suggestions, setSuggestions] = useState([])
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastSuggestionsAt, setLastSuggestionsAt] = useState(null)
  const [lastActionsAt, setLastActionsAt] = useState(null)
  const [lastRefreshAt, setLastRefreshAt] = useState(null)
  const [lastError, setLastError] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')

  const [focusRunning, setFocusRunning] = useState(false)
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(25 * 60)
  const [focusSessions, setFocusSessions] = useState(0)
  const focusTimerRef = useRef(null)

  const notify = (message, type = 'info') => {
    toast.dismiss('insights-toast')
    const opts = { id: 'insights-toast' }
    if (type === 'success') return toast.success(message, opts)
    if (type === 'error') return toast.error(message, opts)
    return toast(message, opts)
  }

  const resetUserData = async () => {
    if (!confirm('This will delete all your events, suggestions, and actions for this device. Are you sure?')) return
    try {
      const res = await fetch(`/api/admin/prune?user_id=${userId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Your data has been reset')
        // Refetch to clear UI
        fetchAll()
      } else {
        toast.error('Failed to reset data')
      }
    } catch {
      toast.error('Failed to reset data')
    }
  }

  const fetchAll = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    try {
      const [sugRes, actRes] = await Promise.all([
        fetchWithRetry(`/api/suggestions?user_id=${userId}`),
        fetchWithRetry(`/api/actions?user_id=${userId}`),
      ])

      setLastError(null)

      if (sugRes.ok) {
        const data = await sugRes.json()
        setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : [])
        setLastSuggestionsAt(new Date())
      } else {
        setLastError('Suggestions failed to load')
      }

      if (actRes.ok) {
        const data = await actRes.json()
        setActions(Array.isArray(data?.actions) ? data.actions : [])
        setLastActionsAt(new Date())
      } else {
        setLastError((prev) => prev || 'Actions failed to load')
      }

      setLastRefreshAt(new Date())
    } catch (e) {
      setLastError('Failed to load insights')
      if (!silent) notify('Failed to load insights', 'error')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // Helper: exponential backoff + retry for fetch
  const fetchWithRetry = async (url, options = {}) => {
    let retryCount = 0
    let backoffMs = 1000
    while (retryCount < 5) {
      try {
        const res = await fetch(url, options)
        if (res.ok) return res
        throw new Error(`HTTP ${res.status}`)
      } catch (e) {
        retryCount += 1
        if (retryCount >= 5) throw e
        backoffMs = Math.min(10000, 1000 * 2 ** (retryCount - 1))
        await new Promise(resolve => setTimeout(resolve, backoffMs))
      }
    }
  }

  useEffect(() => {
    if (userId) fetchAll()
  }, [userId])

  useEffect(() => {
    if (!autoRefresh || !userId) return

    const interval = setInterval(() => {
      fetchAll({ silent: true })
    }, 20000) // Slightly longer to reduce load

    return () => clearInterval(interval)
  }, [autoRefresh, userId])

  useEffect(() => {
    if (!focusRunning) return

    focusTimerRef.current = setInterval(() => {
      setFocusSecondsLeft((s) => {
        if (s <= 1) {
          setFocusRunning(false)
          setFocusSessions((n) => n + 1)
          notify('Focus sprint completed (25 min). Take a 5 min break.', 'success')
          return 25 * 60
        }
        return s - 1
      })
    }, 1000)

    return () => {
      if (focusTimerRef.current) clearInterval(focusTimerRef.current)
    }
  }, [focusRunning])

  const filteredSuggestions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return suggestions
      .filter((s) => {
        if (severityFilter === 'all') return true
        return (s?.severity || '').toLowerCase() === severityFilter
      })
      .filter((s) => {
        if (!term) return true
        const t = `${s?.title || ''} ${s?.description || ''} ${(s?.suggested_action || '')}`.toLowerCase()
        return t.includes(term)
      })
  }, [suggestions, severityFilter, searchTerm])

  const impact = useMemo(() => {
    const total = suggestions.length
    const high = suggestions.filter((s) => s?.severity === 'high').length
    const medium = suggestions.filter((s) => s?.severity === 'medium').length
    const low = suggestions.filter((s) => s?.severity === 'low').length

    const acceptCount = actions.filter((a) => (a?.action || a?.type) === 'accept').length
    const rejectCount = actions.filter((a) => (a?.action || a?.type) === 'reject').length

    const denom = Math.max(1, acceptCount + rejectCount)
    const acceptanceRate = acceptCount / denom

    // simple MVP pulse score: penalize high severity, reward acceptance
    const score = clamp(Math.round(100 - high * 8 - medium * 3 + acceptanceRate * 20), 0, 100)

    return {
      total,
      high,
      medium,
      low,
      acceptCount,
      rejectCount,
      acceptanceRate,
      score,
    }
  }, [suggestions, actions])

  const scoreLabel = useMemo(() => {
    if (impact.score >= 80) return { text: 'Focused', color: 'text-green-400' }
    if (impact.score >= 55) return { text: 'Balanced', color: 'text-yellow-400' }
    return { text: 'Distracted', color: 'text-red-400' }
  }, [impact.score])

  const topMoves = useMemo(() => {
    const items = []

    if (impact.high > 0) {
      items.push({
        title: 'Reduce context switching',
        body: 'Batch similar tasks for 25 minutes. Close Slack and keep one IDE window.',
        icon: TrendingDown,
        color: 'text-red-400',
      })
    }

    if (impact.acceptanceRate < 0.5 && impact.total > 0) {
      items.push({
        title: 'Make suggestions actionable',
        body: 'Accept 1 suggestion and execute it today. Track the effect in Actions History.',
        icon: Target,
        color: 'text-yellow-400',
      })
    }

    if (items.length === 0) {
      items.push({
        title: 'Keep momentum',
        body: 'Start a Focus Sprint and aim for 2 sessions. Review your Actions History after.',
        icon: TrendingUp,
        color: 'text-green-400',
      })
    }

    return items.slice(0, 3)
  }, [impact.acceptanceRate, impact.high, impact.total])

  const exportInsights = () => {
    const payload = {
      timestamp: new Date().toISOString(),
      user_id: userId,
      impact,
      suggestions,
      actions,
      focus: {
        sessionsCompleted: focusSessions,
      },
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `silent-killer-insights-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
    notify('Insights exported', 'success')
  }

  const toggleFocus = () => {
    setFocusRunning((v) => {
      const next = !v
      notify(next ? 'Focus sprint started (25 min)' : 'Focus sprint paused', 'info')
      return next
    })
  }

  const resetFocus = () => {
    setFocusRunning(false)
    setFocusSecondsLeft(25 * 60)
    notify('Focus sprint reset', 'info')
  }

  const mm = String(Math.floor(focusSecondsLeft / 60)).padStart(2, '0')
  const ss = String(focusSecondsLeft % 60).padStart(2, '0')

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">Insights</h2>
          <p className="text-gray-400">AI-powered productivity insights and ambient intelligence</p>
          <div className="mt-1 text-xs text-gray-500 space-x-1">
            <span>{autoRefresh ? 'Auto-refresh ON (20s)' : 'Auto-refresh OFF'}</span>
            {lastRefreshAt && (
              <span>· Last refresh {formatTimeAgo(lastRefreshAt)}</span>
            )}
          </div>
          {!!lastError && (
            <div className="mt-1 text-xs text-red-300">
              {lastError}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search suggestions..."
              className="pl-10 pr-4 py-2 bg-gray-900/50 border border-cyan-500/30 rounded-lg text-cyan-100 placeholder-cyan-600 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/25 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-gray-900/50 border border-cyan-500/30 rounded-lg px-3 py-2 text-cyan-100 text-sm focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              fetchAll()
              notify('Insights refreshed', 'info')
            }}
            className="bg-gray-900/50 border border-cyan-500/30 hover:bg-gray-800/50 p-2 rounded-lg transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
          </motion.button>

          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
              autoRefresh
                ? 'border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/20'
                : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20'
            }`}
            title="Toggle auto-refresh"
          >
            {autoRefresh ? 'Live' : 'Paused'}
          </button>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 255, 136, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={exportInsights}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 p-2 rounded-lg transition-all shadow-lg shadow-cyan-500/25"
            title="Export Insights"
          >
            <Download className="w-4 h-4 text-white" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255, 0, 0, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={resetUserData}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 p-2 rounded-lg transition-all shadow-lg shadow-red-500/25"
            title="Reset my data"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </motion.div>

      <div className="bg-gray-900/50 backdrop-blur-md p-6 border border-white/10 rounded-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-cyan-300">How this creates MVP value</h3>
            <div className="text-sm text-gray-300 mt-2 space-y-1">
              <div><span className="text-cyan-200 font-medium">1) Generate activity</span> in <span className="text-cyan-200 font-medium">Monitor</span> (or run the agent simulation). That ingests events.</div>
              <div><span className="text-cyan-200 font-medium">2) Get suggestions</span> based on your recent activity patterns (focus, interruptions, context switching).</div>
              <div><span className="text-cyan-200 font-medium">3) Take actions</span> (accept/reject) so the system can measure impact and reduce noise over time.</div>
              <div><span className="text-cyan-200 font-medium">4) Track improvement</span> using <span className="text-cyan-200 font-medium">Pulse</span>, <span className="text-cyan-200 font-medium">Impact</span>, and <span className="text-cyan-200 font-medium">Actions History</span>.</div>
            </div>
          </div>

          <div className="text-left lg:text-right text-xs text-gray-500">
            <div>Data source: backend APIs</div>
            <div className="mt-1">Last refresh: {lastRefreshAt ? formatTimeAgo(lastRefreshAt) : '—'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gray-900/50 backdrop-blur-md p-5 border border-cyan-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-200 text-sm">Productivity Pulse</span>
            </div>
            <span className={`text-sm font-semibold ${scoreLabel.color}`}>{scoreLabel.text}</span>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-cyan-100">{impact.score}</div>
            <div className="text-sm text-gray-400">/100</div>
          </div>
          <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
              style={{ width: `${impact.score}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-md p-5 border border-green-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-green-400" />
            <span className="text-green-200 text-sm">Suggestion Impact</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-400">Accepted</div>
              <div className="text-xl font-bold text-green-400">{impact.acceptCount}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Rejected</div>
              <div className="text-xl font-bold text-red-400">{impact.rejectCount}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-gray-400">Acceptance Rate</div>
              <div className="text-xl font-bold text-cyan-200">{Math.round(impact.acceptanceRate * 100)}%</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-md p-5 border border-yellow-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-200 text-sm">Focus Sprint</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div>
              <div className="text-3xl font-bold text-cyan-100">{mm}:{ss}</div>
              <div className="text-xs text-gray-400">Sessions completed: {focusSessions}</div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <button
                onClick={toggleFocus}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  focusRunning
                    ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20'
                    : 'border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/20'
                }`}
              >
                {focusRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={resetFocus}
                className="px-3 py-2 rounded-lg text-sm font-medium border border-cyan-500/30 bg-gray-900/40 text-cyan-200 hover:bg-gray-800/50 transition-all"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-md p-5 border border-purple-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <span className="text-purple-200 text-sm">Suggestion Load</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-gray-400">Total</div>
              <div className="text-2xl font-bold text-cyan-100">{impact.total}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">High / Med / Low</div>
              <div className="text-sm text-cyan-200">{impact.high} / {impact.medium} / {impact.low}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-gray-900/50 backdrop-blur-md p-6 border border-cyan-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-cyan-400">Top Moves (Game-changer habits)</h3>
          </div>
          <div className="space-y-3">
            {topMoves.map((m, idx) => {
              const Icon = m.icon
              return (
                <div key={idx} className="p-4 rounded-lg border border-white/10 bg-gray-800/30">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${m.color}`} />
                    <div>
                      <div className="text-cyan-100 font-semibold">{m.title}</div>
                      <div className="text-sm text-gray-300 mt-1">{m.body}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-md p-6 border border-purple-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-300">Actions History</h3>
            <span className="text-xs text-gray-400">Shows what you accepted/rejected</span>
          </div>

          {loading ? (
            <div className="text-gray-400">Loading…</div>
          ) : actions.length === 0 ? (
            <div className="text-gray-400">No actions recorded yet. Accept or reject a suggestion to populate history.</div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-auto pr-1">
              {actions
                .slice()
                .reverse()
                .slice(0, 30)
                .map((a, idx) => {
                  const actionType = a?.action || a?.type || 'action'
                  const ts = a?.timestamp || a?.created_ts || a?.createdAt
                  const isAccept = actionType === 'accept'
                  return (
                    <div
                      key={`${a?.id || idx}-${idx}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-gray-800/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isAccept ? 'bg-green-400' : 'bg-red-400'}`} />
                        <div>
                          <div className="text-sm text-cyan-100">
                            <span className={isAccept ? 'text-green-300' : 'text-red-300'}>{actionType.toUpperCase()}</span>
                            <span className="text-gray-500"> · </span>
                            <span className="text-gray-300">{a?.suggestion_id || a?.suggestionId || '—'}</span>
                          </div>
                          <div className="text-xs text-gray-500">{ts ? formatTimeAgo(ts) : '—'}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {!loading && suggestions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"
          >
            <div className="text-yellow-300 font-medium">No suggestions yet</div>
            <div className="text-sm text-gray-300 mt-1">
              This means either:
              1) you haven’t ingested events, or
              2) rules didn’t trigger.
              Use the Monitor tab to generate/ingest activity.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default InsightsPanel
