import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useModal } from '../../context/ModalContext'
import Button  from '../ui/Button'
import { getMatchLevel, getScoreBarClass, getCategoryEmoji, formatDate } from '../../utils/helpers'
import { useEffect, useRef } from 'react'

export default function MatchCard({ match }) {
  const { user } = useAuth()
  const { openModal } = useModal()
  const navigate = useNavigate()
  const barRef = useRef(null)

  const lost  = match.lost_item
  const found = match.found_item
  const score = Math.round(match.total_score)
  const level = getMatchLevel(score)
  const barClass = getScoreBarClass(score)

  // Animate score bar on mount
  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    requestAnimationFrame(() => { bar.style.width = `${score}%` })
  }, [score])

  const isOwner  = user && lost?.user_id  === user.id
  const isFinder = user && found?.user_id === user.id
  const canChat  = isOwner || isFinder

  return (
    <div className="match-card">
      {/* Header */}
      <div className="match-card-header">
        <div>
          <h4 className="font-bold text-[#1e1b4b] flex items-center gap-2">
            🤖 {level.emoji} {level.label}
          </h4>
          <p className="text-xs text-[#9ca3af] mt-0.5">
            Multi-signal matching engine · not a deep-learning model
          </p>
        </div>
        <span className="match-score-badge">{score}%</span>
      </div>

      {/* Body */}
      <div className="match-card-body">
        {/* Items side-by-side */}
        <div className="match-items-row">
          <div className="match-item-box">
            <h5 className="lost-label">🔴 Lost Item</h5>
            <p className="font-semibold text-sm mb-1">
              {getCategoryEmoji(lost?.category)} {lost?.item_name}
            </p>
            <p className="text-xs text-[#6b7280]">📍 {lost?.location}</p>
            <p className="text-xs text-[#6b7280]">🎨 {lost?.color}</p>
            <p className="text-xs text-[#6b7280]">👤 {lost?.profiles?.full_name}</p>
            {lost?.image_url && (
              <img src={lost.image_url} alt="lost" className="mt-2 rounded-[8px] h-20 w-full object-cover" />
            )}
          </div>

          <div className="match-connector">⇄</div>

          <div className="match-item-box">
            <h5 className="found-label">🟢 Found Item</h5>
            <p className="font-semibold text-sm mb-1">
              {getCategoryEmoji(found?.category)} {found?.item_name}
            </p>
            <p className="text-xs text-[#6b7280]">📍 {found?.location}</p>
            <p className="text-xs text-[#6b7280]">🎨 {found?.color}</p>
            <p className="text-xs text-[#6b7280]">👤 {found?.profiles?.full_name}</p>
            {found?.image_url && (
              <img src={found.image_url} alt="found" className="mt-2 rounded-[8px] h-20 w-full object-cover" />
            )}
          </div>
        </div>

        {/* Score bar */}
        <div className="score-bar-wrap">
          <div className="score-bar-label">
            <span>Match Confidence</span>
            <span style={{ color: level.color }}>{score}%</span>
          </div>
          <div className="score-bar">
            <div
              ref={barRef}
              className={`score-bar-fill ${barClass}`}
              style={{ width: '0%', transition: 'width 1s ease' }}
            />
          </div>
        </div>

        {/* Score breakdown */}
        <div className="grid grid-cols-5 gap-1 mb-3">
          {[
            { label: 'Category', score: match.category_score, max: 20 },
            { label: 'Color',    score: match.color_score,    max: 15 },
            { label: 'Location', score: match.location_score, max: 20 },
            { label: 'Desc.',    score: match.description_score, max: 25 },
            { label: 'Image',    score: match.image_score,    max: 20 },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-xs font-semibold text-[#4f46e5]">{Math.round(s.score)}/{s.max}</div>
              <div className="text-[10px] text-[#9ca3af]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap mt-2">
          <Button size="sm" variant="outline" onClick={() => openModal('itemDetail', { item: lost })}>
            Lost Item
          </Button>
          <Button size="sm" variant="outline" onClick={() => openModal('itemDetail', { item: found })}>
            Found Item
          </Button>
          {canChat && (
            <Button size="sm" variant="primary" onClick={() => navigate(`/match-chat/${match.id}`)}>
              💬 Chat
            </Button>
          )}
          {isOwner && (
            <Button size="sm" variant="warning" onClick={() => openModal('claim', { item: found })}>
              🔐 Claim
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
