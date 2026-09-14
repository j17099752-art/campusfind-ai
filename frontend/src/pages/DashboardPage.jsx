import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useModal } from '../context/ModalContext'
import ItemCard from '../components/items/ItemCard'
import Spinner  from '../components/ui/Spinner'
import { getCategoryEmoji } from '../utils/helpers'
import { CATEGORY_EMOJI, LOCATION_ICONS } from '../utils/constants'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const CHART_COLORS = ['#4f46e5','#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899']

export default function DashboardPage() {
  const { openModal } = useModal()
  const navigate = useNavigate()

  const [stats,        setStats]        = useState({ lost: 0, found: 0, matches: 0, recovered: 0 })
  const [analytics,    setAnalytics]    = useState({ topCategory: '—', topLocation: '—', recoveryRate: '—', pendingClaims: 0 })
  const [categoryData, setCategoryData] = useState([])
  const [locationData, setLocationData] = useState([])
  const [recentItems,  setRecentItems]  = useState([])
  const [leaderboard,  setLeaderboard]  = useState([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [
        { count: lostCount },
        { count: foundCount },
        { count: matchCount },
        { count: recoveredCount },
        { count: pendingClaims },
        { data: allItems },
        { data: leaderData },
        { data: recentData },
      ] = await Promise.all([
        supabase.from('items').select('id', { count: 'exact', head: true }).eq('item_type', 'lost'),
        supabase.from('items').select('id', { count: 'exact', head: true }).eq('item_type', 'found'),
        supabase.from('matches').select('id', { count: 'exact', head: true }),
        supabase.from('items').select('id', { count: 'exact', head: true }).eq('status', 'recovered'),
        supabase.from('claims').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('items').select('category, location, item_type'),
        supabase.from('profiles')
          .select('id, full_name, student_id, department, points, avatar_url')
          .order('points', { ascending: false })
          .gt('points', 0)
          .limit(10),
        supabase.from('items')
          .select('*, profiles:user_id(full_name)')
          .order('created_at', { ascending: false })
          .limit(8),
      ])

      setStats({
        lost:      lostCount  ?? 0,
        found:     foundCount ?? 0,
        matches:   matchCount ?? 0,
        recovered: recoveredCount ?? 0,
      })

      // Category aggregation
      const catCount = {}
      ;(allItems || []).forEach(i => {
        if (i.item_type === 'lost') catCount[i.category] = (catCount[i.category] || 0) + 1
      })
      const catEntries = Object.entries(catCount)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value, emoji: getCategoryEmoji(name) }))
      setCategoryData(catEntries)

      // Location aggregation
      const locCount = {}
      ;(allItems || []).forEach(i => {
        if (i.location) locCount[i.location] = (locCount[i.location] || 0) + 1
      })
      const locEntries = Object.entries(locCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }))
      setLocationData(locEntries)

      // Analytics
      const topCat  = catEntries[0]
      const topLoc  = locEntries[0]
      const rate    = lostCount ? Math.round(((recoveredCount ?? 0) / lostCount) * 100) : 0
      setAnalytics({
        topCategory:   topCat  ? `${topCat.emoji} ${topCat.name} (${topCat.value})` : '—',
        topLocation:   topLoc  ? `${LOCATION_ICONS[topLoc.name] || '📍'} ${topLoc.name}` : '—',
        recoveryRate:  `${rate}%`,
        pendingClaims: pendingClaims ?? 0,
      })

      setLeaderboard(leaderData || [])
      setRecentItems(recentData || [])
    } catch (e) {
      console.error('Dashboard load error:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Lost',       value: stats.lost,      icon: '🔴', cls: 'lost'      },
    { label: 'Total Found',      value: stats.found,     icon: '🟢', cls: 'found'     },
    { label: 'Possible Matches', value: stats.matches,   icon: '🤖', cls: 'match'     },
    { label: 'Recovered Items',  value: stats.recovered, icon: '✅', cls: 'recovered' },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>📊 Dashboard</h2>
        <p>Live overview of all campus lost &amp; found activity.</p>
      </div>

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="dash-stats-grid mb-8">
        {statCards.map(s => (
          <div key={s.label} className={`dash-stat-card ${s.cls}`}>
            <div className="dash-stat-icon">{s.icon}</div>
            <div className="dash-stat-info">
              <span className="dash-stat-number">{s.value}</span>
              <span className="dash-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Analytics cards ──────────────────────────────────── */}
      <section className="mb-8">
        <h3 className="font-bold text-[#1e1b4b] text-lg mb-4">📊 Campus Analytics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Top Lost Category', value: analytics.topCategory },
            { label: 'Hottest Location',  value: analytics.topLocation },
            { label: 'Recovery Rate',     value: analytics.recoveryRate },
            { label: 'Pending Claims',    value: analytics.pendingClaims },
          ].map(a => (
            <div key={a.label} className="bg-white rounded-[14px] border border-[#e5e7eb] p-4 text-center shadow-sm">
              <h4 className="text-xs font-bold text-[#9ca3af] uppercase tracking-wide mb-2">{a.label}</h4>
              <div className="text-lg font-extrabold text-[#4f46e5]">{a.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Charts ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Items by Category – Pie */}
        {categoryData.length > 0 && (
          <div className="bg-white rounded-[14px] border border-[#e5e7eb] p-5 shadow-sm">
            <h3 className="font-bold text-[#1e1b4b] mb-4">🏷️ Items by Category</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%" cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Items by Location – Bar */}
        {locationData.length > 0 && (
          <div className="bg-white rounded-[14px] border border-[#e5e7eb] p-5 shadow-sm">
            <h3 className="font-bold text-[#1e1b4b] mb-4">📍 Location Heatmap</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={locationData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={130} />
                <Tooltip />
                <Bar dataKey="value" name="Items" radius={[0, 4, 4, 0]}>
                  {locationData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Leaderboard ──────────────────────────────────────── */}
      <section className="mb-10">
        <h3 className="font-bold text-[#1e1b4b] text-lg mb-4">🏆 Good Samaritan Leaderboard</h3>
        {leaderboard.length === 0 ? (
          <p className="text-[#9ca3af] text-sm">No points earned yet.</p>
        ) : (
          <div className="bg-white rounded-[14px] border border-[#e5e7eb] shadow-sm overflow-hidden">
            {leaderboard.map((u, i) => (
              <div key={u.id} className="lb-row">
                <div className={`lb-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </div>
                <div className="lb-avatar">
                  {(u.full_name || '?')[0].toUpperCase()}
                </div>
                <div className="lb-info">
                  <div className="lb-name">{u.full_name}</div>
                  <div className="lb-sub">{u.student_id || u.department || 'Student'}</div>
                </div>
                <div className="lb-points">
                  <span className="pts-num">{u.points}</span>
                  <span className="pts-lbl">pts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Recent Items ─────────────────────────────────────── */}
      <section>
        <h3 className="font-bold text-[#1e1b4b] text-lg mb-4">🕐 Recently Reported Items</h3>
        {recentItems.length === 0 ? (
          <div className="text-center py-10 text-[#9ca3af]">
            <span className="text-4xl block mb-3">📋</span>
            <p>No items reported yet.</p>
          </div>
        ) : (
          <div className="items-grid">
            {recentItems.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
