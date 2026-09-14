import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { useAuth }  from '../context/AuthContext'
import { useModal } from '../context/ModalContext'
import { updateClaimStatus, fetchAllClaims } from '../services/claimsService'
import { updateItemStatus } from '../services/itemsService'
import ItemCard from '../components/items/ItemCard'
import Badge    from '../components/ui/Badge'
import Button   from '../components/ui/Button'
import Spinner  from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { timeAgo, getInitials, getCategoryEmoji } from '../utils/helpers'
import { CLAIM_STATUSES } from '../utils/constants'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'claims',    label: '🔐 Claims' },
  { id: 'items',     label: '📦 All Items' },
  { id: 'users',     label: '👥 Users' },
  { id: 'notifs',    label: '🔔 Notifications' },
]

export default function AdminPanelPage() {
  const { user } = useAuth()
  const { openModal } = useModal()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [data,      setData]      = useState({})
  const [loading,   setLoading]   = useState(false)
  const [stats,     setStats]     = useState({})
  const [pendingClaimsCount, setPendingCount] = useState(0)

  // Confirmation dialog state
  const [confirm, setConfirm] = useState({ open: false, action: null, label: '' })

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }, [])

  const loadTab = useCallback(async (tab) => {
    setLoading(true)
    try {
      let result
      switch (tab) {
        case 'dashboard': {
          const [
            { count: lostC },
            { count: foundC },
            { count: matchC },
            { count: recovC },
            { count: pendC },
            { count: usersC },
          ] = await Promise.all([
            supabase.from('items').select('id', { count: 'exact', head: true }).eq('item_type', 'lost'),
            supabase.from('items').select('id', { count: 'exact', head: true }).eq('item_type', 'found'),
            supabase.from('matches').select('id', { count: 'exact', head: true }),
            supabase.from('items').select('id', { count: 'exact', head: true }).eq('status', 'recovered'),
            supabase.from('claims').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
          ])
          setStats({ lost: lostC, found: foundC, matches: matchC, recovered: recovC, pendingClaims: pendC, users: usersC })
          setPendingCount(pendC ?? 0)
          result = {}
          break
        }
        case 'claims': {
          const token = await getToken()
          result = await fetchAllClaims(token)
          setPendingCount((result || []).filter(c => c.status === 'pending').length)
          break
        }
        case 'items': {
          const { data: items } = await supabase
            .from('items')
            .select('*, profiles:user_id(full_name)')
            .order('created_at', { ascending: false })
            .limit(50)
          result = items || []
          break
        }
        case 'users': {
          const { data: users } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
          result = users || []
          break
        }
        case 'notifs': {
          const { data: notifs } = await supabase
            .from('notifications')
            .select('*, profiles:user_id(full_name)')
            .order('created_at', { ascending: false })
            .limit(50)
          result = notifs || []
          break
        }
        default: result = []
      }
      setData(d => ({ ...d, [tab]: result }))
    } catch (e) {
      toast.error(e.message || 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => { loadTab(activeTab) }, [activeTab, loadTab])

  // ── Claim actions ───────────────────────────────────────────────
  async function handleClaimAction(claimId, status, notes = '') {
    try {
      const token = await getToken()
      await updateClaimStatus({ claimId, status, adminNotes: notes }, token)
      toast.success(`Claim ${status}`)
      loadTab('claims')
    } catch (e) {
      toast.error(e.message || 'Failed to update claim.')
    }
  }

  function promptRejectClaim(claimId) {
    const notes = window.prompt('Optional: Enter rejection reason (shown to student):') ?? ''
    setConfirm({
      open: true,
      label: 'Reject this claim?',
      action: () => handleClaimAction(claimId, 'rejected', notes),
    })
  }

  // ── Item status actions ─────────────────────────────────────────
  async function handleItemStatus(itemId, status) {
    try {
      const token = await getToken()
      await updateItemStatus(itemId, status, token)
      toast.success(`Item marked as ${status}`)
      loadTab('items')
    } catch (e) {
      toast.error(e.message || 'Failed to update item.')
    }
  }

  const tabData = data[activeTab] || []

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#1e1b4b]">👑 Admin Panel</h2>
          <p className="text-[#6b7280] text-sm mt-1">Oversee all matches, claims, items and users.</p>
        </div>
        {pendingClaimsCount > 0 && (
          <span className="px-4 py-2 bg-[#fee2e2] text-[#b91c1c] font-bold rounded-full text-sm">
            {pendingClaimsCount} Pending Claim{pendingClaimsCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={clsx('tab-btn', activeTab === t.id && 'active')}>
            {t.label}
            {t.id === 'claims' && pendingClaimsCount > 0 && (
              <span className="tab-badge">{pendingClaimsCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}

      {/* ── Dashboard tab ──────────────────────────────────────── */}
      {!loading && activeTab === 'dashboard' && (
        <div>
          <div className="admin-stats-grid mb-8">
            {[
              { label: 'Total Users',     value: stats.users,         icon: '👥' },
              { label: 'Lost Items',      value: stats.lost,          icon: '🔴' },
              { label: 'Found Items',     value: stats.found,         icon: '🟢' },
              { label: 'Total Matches',   value: stats.matches,       icon: '🤖' },
              { label: 'Recovered',       value: stats.recovered,     icon: '✅' },
              { label: 'Pending Claims',  value: stats.pendingClaims, icon: '🔐' },
            ].map(s => (
              <div key={s.label} className="admin-stat-box">
                <span className="text-2xl mb-1">{s.icon}</span>
                <span className="admin-stat-num">{s.value ?? 0}</span>
                <span className="admin-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#eef2ff] rounded-[14px] p-5">
            <p className="text-sm text-[#4f46e5] font-semibold">
              💡 Use the tabs above to manage claims, items, users, and notifications.
            </p>
          </div>
        </div>
      )}

      {/* ── Claims tab ─────────────────────────────────────────── */}
      {!loading && activeTab === 'claims' && (
        tabData.length === 0
          ? <EmptyState icon="🔐" title="No claims yet" description="Claims will appear here when students submit ownership requests." />
          : (
            <div className="space-y-5">
              {tabData.map(claim => {
                const item = claim.item || {}
                const claimant = claim.claimant || {}
                return (
                  <div key={claim.id} className="claim-card">
                    <div className="claim-card-header">
                      <h4>
                        {getCategoryEmoji(item.category)} {item.item_name || 'Unknown'} — {claimant.full_name || '—'}
                      </h4>
                      <Badge variant={claim.status}>{CLAIM_STATUSES[claim.status]?.label || claim.status}</Badge>
                    </div>
                    <div className="claim-card-body">
                      <p className="text-xs text-[#9ca3af] mb-3">
                        Claimant: <strong>{claimant.full_name}</strong> ({claimant.student_id}) ·{' '}
                        {claimant.email} · Submitted {timeAgo(claim.created_at)}
                      </p>

                      {/* Verification answers */}
                      <div className="mb-4">
                        <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-wide mb-2">Verification Answers</p>
                        <div className="qa-row whitespace-pre-line text-sm">{claim.verification_answer}</div>
                      </div>

                      {/* Actions */}
                      {(claim.status === 'pending' || claim.status === 'under_review') && (
                        <div className="flex gap-2 flex-wrap pt-3 border-t border-[#e5e7eb]">
                          <Button size="sm" variant="outline"
                            onClick={() => handleClaimAction(claim.id, 'under_review')}>
                            🔍 Under Review
                          </Button>
                          <Button size="sm" variant="success"
                            onClick={() => setConfirm({ open: true, label: 'Approve this claim?', action: () => handleClaimAction(claim.id, 'approved') })}>
                            ✅ Approve
                          </Button>
                          <Button size="sm" variant="danger"
                            onClick={() => promptRejectClaim(claim.id)}>
                            ❌ Reject
                          </Button>
                        </div>
                      )}

                      {claim.status === 'approved' && (
                        <p className="text-sm font-semibold text-[#10b981] mt-2">✅ Approved</p>
                      )}
                      {claim.status === 'rejected' && (
                        <p className="text-sm text-[#ef4444] mt-2">
                          ❌ Rejected {claim.admin_notes ? `— ${claim.admin_notes}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
      )}

      {/* ── All Items tab ──────────────────────────────────────── */}
      {!loading && activeTab === 'items' && (
        tabData.length === 0
          ? <EmptyState icon="📦" title="No items yet" />
          : (
            <div className="items-grid">
              {tabData.map(item => (
                <div key={item.id} className="relative">
                  <ItemCard item={item} showClaimBtn={false} />
                  {item.status === 'active' && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => setConfirm({ open: true, label: 'Mark this item as recovered?', action: () => handleItemStatus(item.id, 'recovered') })}
                        className="text-xs bg-[#10b981] text-white px-2 py-1 rounded-full font-semibold hover:bg-[#047857]"
                      >
                        ✅ Recover
                      </button>
                      <button
                        onClick={() => setConfirm({ open: true, label: 'Close this item?', action: () => handleItemStatus(item.id, 'closed') })}
                        className="text-xs bg-[#6b7280] text-white px-2 py-1 rounded-full font-semibold hover:bg-[#374151]"
                      >
                        ✖ Close
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
      )}

      {/* ── Users tab ──────────────────────────────────────────── */}
      {!loading && activeTab === 'users' && (
        tabData.length === 0
          ? <EmptyState icon="👥" title="No users yet" />
          : (
            <div className="bg-white rounded-[14px] border border-[#e5e7eb] shadow-sm overflow-hidden">
              {tabData.map(u => (
                <div key={u.id} className="user-row">
                  <div className="user-avatar-sm">{getInitials(u.full_name)}</div>
                  <div className="user-info">
                    <h4>{u.full_name}</h4>
                    <small>{u.student_id} · {u.email} · {u.department}</small>
                  </div>
                  <div className="user-stats">
                    <span>Joined {timeAgo(u.created_at)}</span>
                  </div>
                  <span className={clsx('badge', u.role === 'admin' ? 'badge-admin' : 'badge-active')}>
                    {u.role}
                  </span>
                  <span className="user-pts">🏆 {u.points} pts</span>
                </div>
              ))}
            </div>
          )
      )}

      {/* ── Notifications tab ──────────────────────────────────── */}
      {!loading && activeTab === 'notifs' && (
        tabData.length === 0
          ? <EmptyState icon="🔔" title="No notifications" />
          : (
            <div className="space-y-3">
              {tabData.map(n => (
                <div key={n.id} className={clsx('notif-card', !n.is_read && 'unread')}>
                  <div className="notif-icon">
                    {n.type === 'match' ? '🤖' : n.type === 'claim' ? '🔐' : '🔔'}
                  </div>
                  <div className="notif-body flex-1">
                    <h4>{n.title}</h4>
                    <p>{n.message}</p>
                    <p className="text-xs text-[#9ca3af]">To: {n.profiles?.full_name || 'User'}</p>
                    <div className="notif-time">{timeAgo(n.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false })}
        onConfirm={async () => {
          if (confirm.action) await confirm.action()
          setConfirm({ open: false })
        }}
        title="Confirm Action"
        message={confirm.label}
        confirmLabel="Yes, proceed"
      />
    </div>
  )
}
