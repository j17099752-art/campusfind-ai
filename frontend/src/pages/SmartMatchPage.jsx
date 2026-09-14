import { useState, useEffect } from 'react'
import { fetchAllMatches } from '../services/matchService'
import MatchCard from '../components/match/MatchCard'
import { SkeletonGrid } from '../components/ui/SkeletonCard'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import { MATCH_THRESHOLD } from '../utils/constants'

export default function SmartMatchPage() {
  const [matches,  setMatches]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [minScore, setMinScore] = useState(MATCH_THRESHOLD)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchAllMatches()
      setMatches(data)
    } catch (e) {
      setError(e.message || 'Failed to load matches.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = matches.filter(m => Math.round(m.total_score) >= minScore)

  const scoreLevels = [
    { label: '🔥 Very Strong (90+)', value: 90 },
    { label: '⭐ Strong (75+)',       value: 75 },
    { label: '🔍 Possible (60+)',     value: 60 },
    { label: '💡 All Matches (40+)',  value: 40 },
  ]

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h2>🤖 AI Smart Match</h2>
        <p>
          Our multi-signal engine compares every lost item against every found item
          across category, color, location, description, and image signals.
        </p>
        <div className="algo-note mt-2">
          ℹ️ Multi-signal scoring algorithm — not a deep-learning model.
          Image signal is a placeholder designed for future ML integration.
        </div>
      </div>

      {/* Score filter + refresh */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <span className="text-sm font-semibold text-[#6b7280]">Show matches ≥</span>
        {scoreLevels.map(s => (
          <button
            key={s.value}
            onClick={() => setMinScore(s.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              minScore === s.value
                ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#4f46e5] hover:text-[#4f46e5]'
            }`}
          >
            {s.label}
          </button>
        ))}
        <Button size="sm" variant="outline" onClick={load} loading={loading}>
          🔄 Refresh
        </Button>
      </div>

      {/* How scoring works */}
      <div className="bg-white rounded-[14px] border border-[#e5e7eb] p-5 mb-8">
        <h3 className="font-bold text-[#1e1b4b] mb-3 text-sm uppercase tracking-wide">
          📊 How Match Scores Are Calculated
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Category',    max: 20, color: '#4f46e5' },
            { label: 'Color',       max: 15, color: '#7c3aed' },
            { label: 'Location',    max: 20, color: '#06b6d4' },
            { label: 'Description', max: 25, color: '#10b981' },
            { label: 'Image *',     max: 20, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="text-center p-3 bg-[#f8faff] rounded-[10px]">
              <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.max}</div>
              <div className="text-xs font-semibold text-[#1e1b4b]">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#9ca3af] mt-3">
          * Image signal awards partial credit when both items have images. Replace with an embedding model for full AI capability.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[#fee2e2] border border-[#fca5a5] text-[#b91c1c] rounded-[10px] px-4 py-3 mb-4 text-sm">
          {error} — <button onClick={load} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && <SkeletonGrid count={3} />}

      {/* Results count */}
      {!loading && filtered.length > 0 && (
        <p className="results-info mb-4">
          {filtered.length} match{filtered.length !== 1 ? 'es' : ''} found
          {minScore > MATCH_THRESHOLD ? ` with score ≥ ${minScore}%` : ''}
        </p>
      )}

      {/* Match cards */}
      {!loading && filtered.length > 0 && (
        <div className="match-results-grid">
          {filtered.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon="🤖"
          title="No matches found"
          description={
            matches.length > 0
              ? `No matches with score ≥ ${minScore}%. Try lowering the threshold.`
              : 'No items have been matched yet. Report lost and found items to generate matches.'
          }
          action={
            matches.length > 0 && minScore > 40
              ? <Button variant="outline" size="sm" onClick={() => setMinScore(40)}>Show All Matches (40+)</Button>
              : null
          }
        />
      )}
    </div>
  )
}
