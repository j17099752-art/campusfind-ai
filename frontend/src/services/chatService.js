import { supabase } from './supabase'

export async function fetchMessages(matchId) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id (id, full_name, avatar_url)
    `)
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function sendMessage({ matchId, senderId, receiverId, message }) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ match_id: matchId, sender_id: senderId, receiver_id: receiverId, message })
    .select(`*, sender:sender_id (id, full_name, avatar_url)`)
    .single()
  if (error) throw error
  return data
}

// Subscribe to real-time messages for a match
export function subscribeToMessages(matchId, callback) {
  return supabase
    .channel(`messages:${matchId}`)
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'messages',
        filter: `match_id=eq.${matchId}`,
      },
      callback
    )
    .subscribe()
}

export async function markMessagesRead(matchId, userId) {
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('match_id', matchId)
    .eq('receiver_id', userId)
    .eq('is_read', false)
}
