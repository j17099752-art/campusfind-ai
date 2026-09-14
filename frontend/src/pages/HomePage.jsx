import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth }  from '../context/AuthContext'
import { useModal } from '../context/ModalContext'
import { fetchStats } from '../services/itemsService'
import { CATEGORIES, CATEGORY_EMOJI } from '../utils/constants'

// ── Animated counter hook ─────────────────────────────────────────
function useCounter(target, duration = 1600) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) return
    let start = 0
    const step = Math.max(1, Math.ceil(target / (duration / 16)))
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setValue(target); clearInterval(timer) }
      else setValue(start)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return value
}

export default function HomePage() {
  const { isLoggedIn } = useAuth()
  const { openModal }  = useModal()
  const navigate = useNavigate()

  const [stats, setStats]       = useState({ lost: 0, found: 0, recovered: 0 })
  const [statsLoaded, setLoaded] = useState(false)
  const statsRef = useRef(null)

  const lostCount      = useCounter(statsLoaded ? stats.lost      : 0)
  const foundCount     = useCounter(statsLoaded ? stats.found     : 0)
  const recoveredCount = useCounter(statsLoaded ? stats.recovered : 0)

  // Load stats once and trigger counter when section scrolls into view
  useEffect(() => {
    fetchStats().then(s => {
      setStats(s)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setLoaded(true)
    }, { threshold: 0.3 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  function requireAuth(to) {
    if (isLoggedIn) navigate(to)
    else openModal('login', { redirectTo: to })
  }

  function quickSearch(category) {
    navigate(`/find?category=${encodeURIComponent(category)}`)
  }

  const steps = [
    { num: '01', icon: '📝', title: 'Report Your Item',    desc: 'Fill out a quick form to report a lost or found item with all relevant details and a photo.' },
    { num: '02', icon: '🤖', title: 'AI Smart Match',      desc: 'Our multi-signal engine scores matches across category, color, location, and description.' },
    { num: '03', icon: '🔔', title: 'Get Notified',        desc: 'Receive instant notifications when a possible match is found for your item.' },
    { num: '04', icon: '🔐', title: 'Claim & Verify',      desc: 'Submit a claim and answer verification questions to prove ownership of your item.' },
    { num: '05', icon: '👑', title: 'Admin Reviews',       desc: 'Our admin team reviews your claim and approves or rejects it with notes.' },
    { num: '06', icon: '🏆', title: 'Recover & Earn',      desc: 'Collect your item and earn Good Samaritan points on the leaderboard!' },
  ]

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 pt-20 pb-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#eef2ff] text-[#4f46e5] text-xs font-semibold px-4 py-1.5 rounded-full border border-[#c7d2fe] mb-6">
            🤖 AI-Powered Campus Lost &amp; Found
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5" style={{ letterSpacing: '-1px' }}>
            Lost Something on Campus?<br />
            <span className="gradient-text">Let's Find It.</span>
          </h1>
          <p className="text-[#6b7280] text-lg leading-relaxed mb-8 max-w-lg">
            CampusFind AI uses smart matching, image recognition, and campus maps to help you recover lost belongings.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => requireAuth('/report-lost')}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#ef4444] text-white font-bold rounded-[14px] hover:bg-[#b91c1c] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              🔴 I Lost Something
            </button>
            <button
              onClick={() => requireAuth('/report-found')}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#10b981] text-white font-bold rounded-[14px] hover:bg-[#047857] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              🟢 I Found Something
            </button>
            <button
              onClick={() => navigate('/campus-map')}
              className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-[#4f46e5] text-[#4f46e5] font-bold rounded-[14px] hover:bg-[#eef2ff] transition-all"
            >
              📍 Campus Map
            </button>
          </div>
        </div>

        {/* Blob illustration */}
        <div className="hidden md:flex justify-center items-center">
          <div
            className="w-72 h-72 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg,#eef2ff,#ede9fe,#ddd6fe)',
              borderRadius: '60% 40% 70% 30%/50% 60% 40% 50%',
              animation: 'blobMorph 8s ease-in-out infinite, float 4s ease-in-out infinite',
              boxShadow: '0 20px 60px rgba(79,70,229,0.18)',
            }}
          >
            <span style={{ fontSize: '6rem', filter: 'drop-shadow(0 8px 24px rgba(79,70,229,0.3))' }}>🎒</span>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section
        ref={statsRef}
        className="py-16"
        style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
      >
        <div className="max-w-[900px] mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { label: 'Lost Items Reported',  value: lostCount },
            { label: 'Found Items Reported', value: foundCount },
            { label: 'Items Recovered',      value: recoveredCount },
          ].map(s => (
            <div key={s.label}>
              <div className="text-5xl md:text-6xl font-black text-white" style={{ letterSpacing: '-2px' }}>
                {s.value}<span className="text-3xl align-super">+</span>
              </div>
              <p className="text-[#c7d2fe] text-sm font-medium mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 py-20 text-center">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">Six smart steps to recover your belongings</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map(s => (
            <div
              key={s.num}
              className="relative bg-white rounded-[22px] p-8 border border-[#e5e7eb] shadow-[0_2px_16px_rgba(0,0,0,0.07)] hover:-translate-y-1.5 hover:shadow-[0_10px_40px_rgba(79,70,229,0.18)] transition-all overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ background: 'linear-gradient(90deg,#4f46e5,#7c3aed)' }}
              />
              <span className="absolute top-4 right-5 text-5xl font-black text-[#eef2ff] select-none leading-none">
                {s.num}
              </span>
              <div className="text-4xl mb-3">{s.icon}</div>
              <h3 className="font-bold text-lg text-[#1e1b4b] mb-2">{s.title}</h3>
              <p className="text-sm text-[#6b7280] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────── */}
      <section className="bg-[#eef2ff] py-16">
        <div className="max-w-[900px] mx-auto px-6 text-center">
          <h2 className="section-title">Popular Categories</h2>
          <p className="section-subtitle">Browse items by category</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => quickSearch(cat.value)}
                className="px-5 py-2.5 bg-white rounded-full border border-[#c7d2fe] text-sm font-semibold text-[#4f46e5] hover:bg-[#4f46e5] hover:text-white hover:border-[#4f46e5] transition-all shadow-sm"
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Smart Matching explanation ─────────────────────────── */}
      <section className="max-w-[1000px] mx-auto px-6 py-20">
        <div className="bg-white rounded-[22px] border border-[#e5e7eb] shadow-[0_4px_20px_rgba(79,70,229,0.12)] p-10">
          <div className="flex items-start gap-4 mb-6">
            <span className="text-4xl">🤖</span>
            <div>
              <h2 className="text-2xl font-extrabold text-[#1e1b4b] mb-1">AI Smart Matching</h2>
              <div className="inline-flex items-center gap-1.5 text-xs text-[#6b7280] bg-[#f3f4f6] border border-[#e5e7eb] rounded-full px-3 py-1">
                ℹ️ Multi-signal scoring engine — not a deep-learning model
              </div>
            </div>
          </div>
          <p className="text-[#6b7280] mb-6">
            Our matching engine compares every lost item against every found item across five signals to generate a confidence score.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Category',    pct: 20, color: '#4f46e5' },
              { label: 'Color',       pct: 15, color: '#7c3aed' },
              { label: 'Location',    pct: 20, color: '#06b6d4' },
              { label: 'Description', pct: 25, color: '#10b981' },
              { label: 'Image',       pct: 20, color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} className="text-center p-4 bg-[#eef2ff] rounded-[14px]">
                <div className="text-2xl font-extrabold mb-1" style={{ color: s.color }}>{s.pct}%</div>
                <div className="text-xs font-semibold text-[#1e1b4b]">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { range: '90–100%', label: 'Very Strong Match', emoji: '🔥', bg: '#d1fae5', color: '#065f46' },
              { range: '75–89%',  label: 'Strong Match',      emoji: '⭐', bg: '#ede9fe', color: '#5b21b6' },
              { range: '60–74%',  label: 'Possible Match',    emoji: '🔍', bg: '#fef3c7', color: '#92400e' },
              { range: '<60%',    label: 'Weak Match',        emoji: '💡', bg: '#f3f4f6', color: '#374151' },
            ].map(m => (
              <div key={m.range} className="flex items-center gap-2 p-3 rounded-[10px]" style={{ background: m.bg }}>
                <span className="text-xl">{m.emoji}</span>
                <div>
                  <div className="font-bold text-sm" style={{ color: m.color }}>{m.range}</div>
                  <div className="text-xs" style={{ color: m.color }}>{m.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section
        className="py-20 text-center text-white"
        style={{ background: 'linear-gradient(135deg,#1e1b4b,#4f46e5)' }}
      >
        <div className="max-w-[600px] mx-auto px-6">
          <h2 className="text-3xl font-extrabold mb-4">Ready to Find Your Item?</h2>
          <p className="text-[#c7d2fe] mb-8">
            Join hundreds of students who have already recovered their belongings using CampusFind AI.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => requireAuth('/report-lost')}
              className="px-8 py-3.5 bg-[#ef4444] font-bold rounded-[14px] hover:bg-[#b91c1c] transition-all"
            >
              🔴 Report Lost Item
            </button>
            <button
              onClick={() => navigate('/find')}
              className="px-8 py-3.5 bg-white text-[#4f46e5] font-bold rounded-[14px] hover:bg-[#eef2ff] transition-all"
            >
              🔍 Browse Items
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
