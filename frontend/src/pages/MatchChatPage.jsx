import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import { fetchMessages, sendMessage, subscribeToMessages, markMessagesRead } from '../services/chatService'
import { getMatchLevel, getCategoryEmoji, timeAgo } from '../utils/helpers'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function MatchChatPage() {
  const { matchId } = useParams()
  const { user }    = useAuth()
  const navigate    = useNavigate()

  const [match,     setMatch]     = useState(null)
  const [messages,  setMessages]  = useState([])
  const [text,      setText]      = useState('')
  const [loading,   setLoading]   = useState(true)
  const [sending,   setSending]   = useState(false)
  const [error,     setError]     = useState('')
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Determine receiver: if I own the lost item → receiver is the finder (found item owner), and vice-versa
  const receiverId = match
    ? (user?.id === match.lost_item?.user_id ? match.found_item?.user_id : match.lost_item?.user_id)
    : null

  const isParticipant = match && (
    user?.id === match.lost_item?.user_id ||
    user?.id === match.found_item?.user_id
  )

  // Load match + messages
  const loadData = useCallback(async () => {
    if (!matchId) return
    setLoading(true)
    setError('')
    try {
      const { data: m, error: me } = await supabase
        .from('matches')
        .select(`
          *,
          lost_item:lost_item_id (*, profiles:user_id(id, full_name, avatar_url)),
          found_item:found_item_id (*, profiles:user_id(id, full_name, avatar_url))
        `)
        .eq('id', matchId)
        .single()
      if (me) throw me
      setMatch(m)

      const msgs = await fetchMessages(matchId)
      setMessages(msgs)

      // Mark messages to me as read
      if (user) await markMessagesRead(matchId, user.id)
    } catch (e) {
      setError(e.message || 'Failed to load chat.')
    } finally {
      setLoading(false)
    }
  }, [matchId, user])

  useEffect(() => { loadData() }, [loadData])

  // Realtime subscription
  useEffect(() => {
    if (!matchId) return
    const channel = subscribeToMessages(matchId, async (payload) => {
      const newMsg = payload.new
      // Fetch full message with sender profile
      const { data } = await supabase
        .from('messages')
        .select('*, sender:sender_id(id, full_name, avatar_url)')
        .eq('id', newMsg.id)
        .single()
      if (data) setMessages(prev => [...prev, data])
      if (user && newMsg.receiver_id === user.id) {
        await markMessagesRead(matchId, user.id)
      }
    })
    return () => channel.unsubscribe()
  }, [matchId, user])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e?.preventDefault()
    if (!text.trim() || !isParticipant || !receiverId) return
    setSending(true)
    try {
      const msg = await sendMessage({
        matchId,
        senderId:   user.id,
        receiverId,
        message:    text.trim(),
      })
      setText('')
      inputRef.current?.focus()
    } catch (err) {
      toast.error('Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container max-w-3xl mx-auto">
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="page-container max-w-3xl mx-auto">
        <Button variant="outline" onClick={() => navigate('/my-reports')}>← Back</Button>
        <div className="text-center py-16 text-[#6b7280]">
          <div className="text-4xl mb-4">❌</div>
          <p>{error || 'Match not found.'}</p>
        </div>
      </div>
    )
  }

  if (!isParticipant) {
    return (
      <div className="page-container max-w-3xl mx-auto">
        <Button variant="outline" onClick={() => navigate('/my-reports')}>← Back</Button>
        <div className="text-center py-16 text-[#6b7280]">
          <div className="text-4xl mb-4">🔒</div>
          <p>You are not a participant in this match conversation.</p>
        </div>
      </div>
    )
  }

  const lost  = match.lost_item
  const found = match.found_item
  const score = Math.round(match.total_score)
  const level = getMatchLevel(score)

  return (
    <div className="page-container max-w-3xl mx-auto">
      <Button variant="outline" size="sm" onClick={() => navigate('/my-reports')} className="mb-4">
        ← Back to My Reports
      </Button>

      <div className="chat-wrapper">
        {/* Chat header */}
        <div className="chat-header">
          <div>
            <h3 className="font-bold text-[#1e1b4b]">💬 Match Chat</h3>
            <p className="text-xs text-[#6b7280] mt-0.5">
              {lost?.item_name} ↔ {found?.item_name}
            </p>
          </div>
          <span
            className="font-bold text-sm px-3 py-1 rounded-full border-2"
            style={{ color: level.color, borderColor: level.color, background: `${level.color}15` }}
          >
            {level.emoji} {score}%
          </span>
        </div>

        {/* Items summary */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-[#f8faff] border-b border-[#e5e7eb]">
          <div className="bg-white rounded-[10px] p-3 border border-[#e5e7eb]">
            <h5 className="lost-label text-xs font-bold uppercase tracking-wide mb-1">🔴 Lost Item</h5>
            <p className="font-semibold text-sm">{getCategoryEmoji(lost?.category)} {lost?.item_name}</p>
            <p className="text-xs text-[#9ca3af]">📍 {lost?.location}</p>
            <p className="text-xs text-[#9ca3af]">👤 {lost?.profiles?.full_name}</p>
          </div>
          <div className="bg-white rounded-[10px] p-3 border border-[#e5e7eb]">
            <h5 className="found-label text-xs font-bold uppercase tracking-wide mb-1">🟢 Found Item</h5>
            <p className="font-semibold text-sm">{getCategoryEmoji(found?.category)} {found?.item_name}</p>
            <p className="text-xs text-[#9ca3af]">📍 {found?.location}</p>
            <p className="text-xs text-[#9ca3af]">👤 {found?.profiles?.full_name}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-system-msg">No messages yet. Say hello! 👋</div>
          )}
          {messages.map(msg => {
            const isMe = msg.sender_id === user?.id
            return (
              <div key={msg.id} className={clsx('chat-bubble-wrap', isMe ? 'me' : 'other')}>
                <div className="chat-bubble">{msg.message}</div>
                <div className="bubble-meta">
                  {msg.sender?.full_name || 'Unknown'} · {timeAgo(msg.created_at)}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="chat-input-area">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message…"
            disabled={!isParticipant || sending}
            autoFocus
          />
          <Button type="submit" variant="primary" loading={sending} disabled={!text.trim()}>
            Send
          </Button>
        </form>
      </div>

      {/* Claim action */}
      {user?.id === lost?.user_id && match.status !== 'recovered' && (
        <div className="mt-4 p-4 bg-[#fef3c7] rounded-[14px] border border-[#fde68a] flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-[#92400e] text-sm">Ready to claim this item?</p>
            <p className="text-xs text-[#92400e]">Submit a formal ownership claim for admin review.</p>
          </div>
          <Button
            size="sm"
            variant="warning"
            onClick={() => navigate(`/find?q=${encodeURIComponent(found?.item_name || '')}`)}
          >
            🔐 Claim Item
          </Button>
        </div>
      )}
    </div>
  )
}
