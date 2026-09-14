import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth }  from '../context/AuthContext'
import { useModal } from '../context/ModalContext'
import { fetchMyItems }       from '../services/itemsService'
import { fetchMyMatches }     from '../services/matchService'
import { fetchNotifications, markAsRead, markAllAsRead } from '../services/notificationService'
import { fetchMyClaims }      from '../services/claimsService'
import { supabase }           from '../services/supabase'
import ItemCard    from '../components/items/ItemCard'
import MatchCard   from '../components/match/MatchCard'
import Badge       from '../components/ui/Badge'
import Button      from '../components/ui/Button'
import EmptyState  from '../components/ui/EmptyState'
import Spinner     from '../components/ui/Spinner'
import { formatDate, timeAgo, getCategoryEmoji, getInitials } from '../utils/helpers'
import { CLAIM_STATUSES } from '../utils/constants'
import clsx from 'clsx'

const TABS = [
  { id: 'lost',    label: '🔴 My Lost Items' },
  { id: 'found',   label: '🟢 My Found Items' },
  { id: 'matches', label: '🤖 My Matches' },
  { id: 'notifs',  label: '🔔 Notifications' },
  { id: 'claims',  label: '🔐 My Claims' },
]

export default function MyReportsPage() {
  const { user, profile } = useAuth()
  const { openModal }     = useModal()
  const navigate          = useNavigate()

  const [activeTab,   setActiveTab]   = useState('lost')
  const [data,        setData]        = useState({})
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  const loadTab = useCallback(async (tab) => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      let result
      switch (tab) {
        case 'lost':    result = await fetchMyItems(user.id, 'lost');    break
        case 'found':   result = await fetchMyItems(user.id, 'found');   break
        case 'matches': result = await fetchMyMatches(user.id);          break
        case 'notifs':  result = await fetchNotifications(user.id);      break
        case 'claims':  result = await fetchMyClaims(user.id);           break
        default:        result = []
      }
      setData(d => ({ ...d, [tab]: result }))
      if (tab === 'notifs') {
        const unread = (result).filter(n => !n.is_read).length
        setUnreadCount(unread)
      }
    } catch (e) {
      setError(e.message || 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadTab(activeTab) }, [activeTab, loadTab])

  // Realtime notification subscription
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`my-notifs:${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => { if (activeTab === 'notifs') loadTab('notifs') }
      ).subscribe()
    return () => channel.unsubscribe()
  }, [user, activeTab, loadTab])

  async function handleMarkAllRead() {
    await markAllAsRead(user.id)
    setUnreadCount(0)
    loadTab('notifs')
  }

  async function handleMarkRead(notifId) {
    await markAsRead(notifId)
    loadTab('notifs')
  }

  function switchTab(id) {
    setActiveTab(id)
    setError('')
  }

  const tabData = data[activeTab] || []

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h2>📋 My Reports</h2>
        <p>Welcome, <strong>{profile?.full_name}</strong> · {profile?.student_id || profile?.department || ''}</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => {
          const isNotif = t.id === 'notifs'
          return (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={clsx('tab-btn', activeTab === t.id && 'active')}
            >
              {t.label}
              {isNotif && unreadCount > 0 && (
                <span className="tab-badge">{unreadCount}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[#fee2e2] border border-[#fca5a5] text-[#b91c1c] rounded-[10px] px-4 py-3 mb-4 text-sm">
          {error} — <button onClick={() => loadTab(activeTab)} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      )}

      {/* ── TAB: My Lost Items ──────────────────────────────── */}
      {!loading && activeTab === 'lost' && (
        tabData.length === 0
          ? <EmptyState icon="🔴" title="No lost items reported" description="Report a lost item and we'll scan for matches." action={<Button onClick={() => navigate('/report-lost')}>🔴 Report Lost Item</Button>} />
          : <div className="items-grid">{tabData.map(item => <ItemCard key={item.id} item={item} showClaimBtn={false} />)}</div>
      )}

      {/* ── TAB: My Found Items ─────────────────────────────── */}
      {!loading && activeTab === 'found' && (
        tabData.length === 0
          ? <EmptyState icon="🟢" title="No found items reported" description="Report a found item and earn Good Samaritan points!" action={<Button variant="success" onClick={() => navigate('/report-found')}>🟢 Report Found Item</Button>} />
          : <div className="items-grid">{tabData.map(item => <ItemCard key={item.id} item={item} showClaimBtn={false} />)}</div>
      )}

      {/* ── TAB: My Matches ─────────────────────────────────── */}
      {!loading && activeTab === 'matches' && (
        tabData.length === 0
          ? <EmptyState icon="🤖" title="No matches yet" description="Matches appear when our engine finds a possible lost/found pair for your items." />
          : <div className="match-results-grid">{tabData.map(m => <MatchCard key={m.id} match={m} />)}</div>
      )}

      {/* ── TAB: Notifications ──────────────────────────────── */}
      {!loading && activeTab === 'notifs' && (
        tabData.length === 0
          ? <EmptyState icon="🔔" title="No notifications yet" description="You'll be notified when a match is found for your items." />
          : (
            <div>
              {unreadCount > 0 && (
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-[#6b7280]">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
                  <Button size="sm" variant="ghost" onClick={handleMarkAllRead}>✅ Mark all as read</Button>
                </div>
              )}
              <div className="space-y-3">
                {tabData.map(n => (
                  <div key={n.id} className={clsx('notif-card', !n.is_read && 'unread')}>
                    <div className="notif-icon">
                      {n.type === 'match' ? '🤖' : n.type === 'claim' ? '🔐' : n.type === 'transfer' ? '🔄' : '🔔'}
                    </div>
                    <div className="notif-body flex-1">
                      <h4>{n.title}</h4>
                      <p>{n.message}</p>
                      <div className="notif-time">{timeAgo(n.created_at)}</div>
                    </div>
                    <div className="notif-actions">
                      {n.related_match_id && (
                        <Button size="xs" variant="primary" onClick={() => navigate(`/match-chat/${n.related_match_id}`)}>
                          View
                        </Button>
                      )}
                      {!n.is_read && (
                        <Button size="xs" variant="ghost" onClick={() => handleMarkRead(n.id)}>
                          Mark Read
                        </Button>
                      )}
                      {n.is_read && <span className="text-xs text-[#9ca3af]">✓ Read</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
      )}

      {/* ── TAB: My Claims ──────────────────────────────────── */}
      {!loading && activeTab === 'claims' && (
        tabData.length === 0
          ? <EmptyState icon="🔐" title="No claims submitted" description="Browse found items and click 'Claim' to submit an ownership claim." action={<Button variant="outline" onClick={() => navigate('/find')}>Browse Found Items</Button>} />
          : (
            <div className="space-y-4">
              {tabData.map(claim => {
                const statusInfo = CLAIM_STATUSES[claim.status] || CLAIM_STATUSES.pending
                const item = claim.item
                return (
                  <div key={claim.id} className="claim-card">
                    <div className="claim-card-header">
                      <h4>
                        {getCategoryEmoji(item?.category)} {item?.item_name || 'Unknown Item'}
                      </h4>
                      <Badge variant={claim.status}>{statusInfo.label}</Badge>
                    </div>
                    <div className="claim-card-body">
                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div><span className="text-[#9ca3af] text-xs uppercase font-bold">Location</span><br /><span>📍 {item?.location}</span></div>
                        <div><span className="text-[#9ca3af] text-xs uppercase font-bold">Submitted</span><br /><span>{timeAgo(claim.created_at)}</span></div>
                      </div>

                      {/* Status trail */}
                      <div className="flex gap-1 flex-wrap mb-3">
                        {['pending','under_review','approved','rejected'].map((s, i) => {
                          const steps = ['pending','under_review','approved','rejected']
                          const currentIdx = steps.indexOf(claim.status)
                          const thisIdx = i
                          const done    = thisIdx < currentIdx
                          const active  = thisIdx === currentIdx
                          return (
                            <div key={s} className={clsx(
                              'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                              done   ? 'bg-[#d1fae5] text-[#065f46]' :
                              active ? 'bg-[#4f46e5] text-white' :
                                       'bg-[#f3f4f6] text-[#9ca3af]'
                            )}>
                              {done ? '✓' : active ? '●' : '○'}
                              {CLAIM_STATUSES[s]?.label || s}
                            </div>
                          )
                        })}
                      </div>

                      {claim.status === 'approved' && (
                        <div className="bg-[#d1fae5] rounded-[10px] p-3 text-sm text-[#065f46] font-semibold">
                          🎉 Claim approved! Contact the finder to collect your item.
                        </div>
                      )}
                      {claim.status === 'rejected' && claim.admin_notes && (
                        <div className="bg-[#fee2e2] rounded-[10px] p-3 text-sm text-[#b91c1c]">
                          ❌ Rejected: {claim.admin_notes}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
      )}
    </div>
  )
}
