import { supabase } from './supabase'
import { tokenize } from '../utils/helpers'
import { MATCH_THRESHOLD } from '../utils/constants'

// ================================================================
// CampusFind AI – Multi-Signal Matching Engine
//
// This is a rule-based scoring algorithm, NOT a deep learning model.
// It compares lost and found items across 5 signals:
//   Category    – 20 pts
//   Color       – 15 pts
//   Location    – 20 pts
//   Description – 25 pts
//   Image       –  20 pts (placeholder; designed for future ML integration)
//
// To integrate an actual image embedding model later, replace the
// computeImageScore() function with a call to your ML service.
// ================================================================

export function computeMatchScore(lostItem, foundItem) {
  let score = 0
  const reasons = []

  // ── 1. Category (max 20) ──────────────────────────────────────
  const catScore = scoreCategory(lostItem.category, foundItem.category)
  score += catScore
  if (catScore > 0) reasons.push('Same category')

  // ── 2. Color (max 15) ────────────────────────────────────────
  const colorScore = scoreColor(lostItem.color, foundItem.color)
  score += colorScore
  if (colorScore >= 10) reasons.push('Matching color')
  else if (colorScore > 0) reasons.push('Similar color')

  // ── 3. Location (max 20) ─────────────────────────────────────
  const locScore = scoreLocation(lostItem.location, foundItem.location)
  score += locScore
  if (locScore === 20) reasons.push('Same location')
  else if (locScore > 0) reasons.push('Nearby location')

  // ── 4. Description (max 25) ──────────────────────────────────
  const descScore = scoreDescription(lostItem.description, foundItem.description, lostItem.item_name, foundItem.item_name)
  score += descScore
  if (descScore >= 15) reasons.push('Very similar description')
  else if (descScore >= 8) reasons.push('Similar description')
  else if (descScore > 0) reasons.push('Some description overlap')

  // ── 5. Image placeholder (max 20) ────────────────────────────
  // Currently awards partial credit when both items have images.
  // Replace this function body with an actual image embedding call.
  const imgScore = computeImageScore(lostItem.image_url, foundItem.image_url)
  score += imgScore
  if (imgScore > 0) reasons.push('Image signals match')

  const total = Math.min(Math.round(score), 100)

  return {
    total,
    category_score:    catScore,
    color_score:       colorScore,
    location_score:    locScore,
    description_score: descScore,
    image_score:       imgScore,
    reasons,
  }
}

// ── Scoring sub-functions ─────────────────────────────────────────

function scoreCategory(a, b) {
  if (!a || !b) return 0
  return a.toLowerCase() === b.toLowerCase() ? 20 : 0
}

function scoreColor(a, b) {
  if (!a || !b) return 0
  const tokA = tokenize(a)
  const tokB = tokenize(b)
  const exact = a.toLowerCase().trim() === b.toLowerCase().trim()
  if (exact) return 15
  const overlap = tokA.filter(t => tokB.includes(t)).length
  return overlap > 0 ? Math.min(overlap * 5, 10) : 0
}

function scoreLocation(a, b) {
  if (!a || !b) return 0
  const la = a.toLowerCase().trim()
  const lb = b.toLowerCase().trim()
  if (la === lb) return 20
  if (la.includes(lb) || lb.includes(la)) return 15
  // Check for common keywords (e.g. "block" matching "block a")
  const tokA = tokenize(a)
  const tokB = tokenize(b)
  const overlap = tokA.filter(t => tokB.includes(t) && t.length > 2).length
  return overlap > 0 ? Math.min(overlap * 5, 10) : 0
}

function scoreDescription(descA, descB, nameA, nameB) {
  const combinedA = `${nameA || ''} ${descA || ''}`
  const combinedB = `${nameB || ''} ${descB || ''}`
  const tokA = tokenize(combinedA)
  const tokB = tokenize(combinedB)
  if (tokA.length === 0 || tokB.length === 0) return 0
  const overlap = tokA.filter(t => tokB.includes(t) && t.length > 2).length
  const ratio   = overlap / Math.min(tokA.length, tokB.length)
  return Math.min(Math.round(ratio * 25), 25)
}

/**
 * Image similarity placeholder.
 * Awards up to 20 points when both items have image URLs.
 * This is NOT AI-based — it is intentionally labelled as a placeholder.
 *
 * To integrate real image similarity:
 *   1. Store image embeddings via a Supabase Edge Function or external API.
 *   2. Compute cosine similarity between embeddings.
 *   3. Replace this function's logic with the similarity result × 20.
 */
function computeImageScore(urlA, urlB) {
  if (!urlA || !urlB) return 0
  // Both have images — award base 10 pts.
  // In a real system this would call an embedding comparison.
  return 10
}

// ── Fetch all matches from DB ─────────────────────────────────────
export async function fetchMatches(itemId) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      lost_item:lost_item_id (*,  profiles:user_id(full_name,avatar_url)),
      found_item:found_item_id(*, profiles:user_id(full_name,avatar_url))
    `)
    .or(`lost_item_id.eq.${itemId},found_item_id.eq.${itemId}`)
    .order('total_score', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchAllMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      lost_item:lost_item_id (*,  profiles:user_id(full_name,avatar_url)),
      found_item:found_item_id(*, profiles:user_id(full_name,avatar_url))
    `)
    .gte('total_score', MATCH_THRESHOLD)
    .order('total_score', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchMyMatches(userId) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      lost_item:lost_item_id (*,  profiles:user_id(id,full_name,avatar_url)),
      found_item:found_item_id(*, profiles:user_id(id,full_name,avatar_url))
    `)
    .gte('total_score', MATCH_THRESHOLD)
    .order('total_score', { ascending: false })
  if (error) throw error
  // Filter to only matches where this user owns the lost or found item
  return (data || []).filter(
    m => m.lost_item?.user_id === userId || m.found_item?.user_id === userId
  )
}

// ── Run match engine and persist results via backend ──────────────
export async function runAndPersistMatches(itemId, accessToken) {
  const res = await fetch(`${API_URL}/api/matches`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ itemId }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Matching failed')
  return json
}
