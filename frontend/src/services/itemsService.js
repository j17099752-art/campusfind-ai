import { supabase } from './supabase'
import { API_URL } from '../utils/constants'

// ── Upload image to Supabase Storage ─────────────────────────────
export async function uploadItemImage(file, userId) {
  const ext      = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${ext}`
  const { data, error } = await supabase.storage
    .from('item-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })
  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('item-images')
    .getPublicUrl(fileName)

  return publicUrl
}

// ── Create item via backend API (handles matching + notifications) ─
export async function createItem(payload, accessToken) {
  const res = await fetch(`${API_URL}/api/items`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to create item')
  return json
}

// ── Fetch items (search + filters) ───────────────────────────────
export async function fetchItems({ query = '', category = '', location = '', itemType = '', status = '', page = 1, limit = 20 } = {}) {
  let q = supabase
    .from('items')
    .select(`
      *,
      profiles:user_id (full_name, avatar_url, student_id, department)
    `)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (itemType)  q = q.eq('item_type', itemType)
  if (category)  q = q.eq('category', category)
  if (location)  q = q.eq('location', location)
  if (status)    q = q.eq('status', status)
  if (query) {
    q = q.or(
      `item_name.ilike.%${query}%,description.ilike.%${query}%,color.ilike.%${query}%`
    )
  }

  const { data, error, count } = await q
  if (error) throw error
  return { items: data || [], count }
}

// ── Fetch single item ──────────────────────────────────────────────
export async function fetchItem(id) {
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      profiles:user_id (id, full_name, avatar_url, student_id, department, points)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ── Fetch user's own items ─────────────────────────────────────────
export async function fetchMyItems(userId, itemType) {
  let q = supabase
    .from('items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (itemType) q = q.eq('item_type', itemType)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

// ── Fetch homepage stats ───────────────────────────────────────────
export async function fetchStats() {
  const [lostRes, foundRes, recoveredRes] = await Promise.all([
    supabase.from('items').select('id', { count: 'exact', head: true }).eq('item_type', 'lost'),
    supabase.from('items').select('id', { count: 'exact', head: true }).eq('item_type', 'found'),
    supabase.from('items').select('id', { count: 'exact', head: true }).eq('status', 'recovered'),
  ])
  return {
    lost:      lostRes.count      ?? 0,
    found:     foundRes.count     ?? 0,
    recovered: recoveredRes.count ?? 0,
  }
}

// ── Update item status ─────────────────────────────────────────────
export async function updateItemStatus(itemId, status, accessToken) {
  const res = await fetch(`${API_URL}/api/admin/items/${itemId}/status`, {
    method:  'PUT',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ status }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to update item status')
  return json
}
