// ================================================================
// CampusFind AI – Server-Side Matching Engine
//
// Mirrors the frontend matchService scoring logic so that matches
// are persisted to the database by the backend (which can use the
// service-role key to bypass RLS for bulk inserts).
//
// To integrate an actual image embedding model:
//   1. Add an API call in computeImageScore() below.
//   2. Store embedding vectors in a new table or pgvector column.
//   3. Replace the placeholder with cosine similarity * 20.
// ================================================================

const STOP_WORDS = new Set([
  'the','and','a','an','of','in','on','at','to','is','it',
  'with','for','or','my','i','was','near','some','found','lost',
  'item','campus','college',
])

function tokenize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w))
}

function scoreCategory(a, b) {
  if (!a || !b) return 0
  return a.toLowerCase() === b.toLowerCase() ? 20 : 0
}

function scoreColor(a, b) {
  if (!a || !b) return 0
  if (a.toLowerCase().trim() === b.toLowerCase().trim()) return 15
  const tA = tokenize(a), tB = tokenize(b)
  const overlap = tA.filter(t => tB.includes(t)).length
  return overlap > 0 ? Math.min(overlap * 5, 10) : 0
}

function scoreLocation(a, b) {
  if (!a || !b) return 0
  const la = a.toLowerCase().trim()
  const lb = b.toLowerCase().trim()
  if (la === lb) return 20
  if (la.includes(lb) || lb.includes(la)) return 15
  const tA = tokenize(a), tB = tokenize(b)
  const overlap = tA.filter(t => tB.includes(t) && t.length > 2).length
  return overlap > 0 ? Math.min(overlap * 5, 10) : 0
}

function scoreDescription(descA, descB, nameA, nameB) {
  const comboA = `${nameA || ''} ${descA || ''}`
  const comboB = `${nameB || ''} ${descB || ''}`
  const tA = tokenize(comboA), tB = tokenize(comboB)
  if (!tA.length || !tB.length) return 0
  const overlap = tA.filter(t => tB.includes(t) && t.length > 2).length
  const ratio   = overlap / Math.min(tA.length, tB.length)
  return Math.min(Math.round(ratio * 25), 25)
}

/**
 * Image similarity placeholder.
 * Awards partial credit when both items have image URLs.
 * Replace this function with an actual embedding comparison.
 */
function computeImageScore(urlA, urlB) {
  if (!urlA || !urlB) return 0
  return 10 // base credit for both having images
}

export function computeMatchScore(lostItem, foundItem) {
  const catScore  = scoreCategory(lostItem.category,    foundItem.category)
  const colorScore = scoreColor(lostItem.color,          foundItem.color)
  const locScore  = scoreLocation(lostItem.location,     foundItem.location)
  const descScore = scoreDescription(lostItem.description, foundItem.description, lostItem.item_name, foundItem.item_name)
  const imgScore  = computeImageScore(lostItem.image_url, foundItem.image_url)

  const total = Math.min(catScore + colorScore + locScore + descScore + imgScore, 100)
  return { total, catScore, colorScore, locScore, descScore, imgScore }
}

// ── Find and persist matches for a newly submitted item ────────────
export async function findAndPersistMatches(supabase, newItem) {
  const isLost = newItem.item_type === 'lost'

  // Fetch counterpart items (active only)
  const { data: counterparts } = await supabase
    .from('items')
    .select('*')
    .eq('item_type', isLost ? 'found' : 'lost')
    .eq('status', 'active')

  if (!counterparts?.length) return []

  const THRESHOLD = 40
  const toInsert  = []
  const notifyList = []

  for (const cp of counterparts) {
    const lostItem  = isLost ? newItem : cp
    const foundItem = isLost ? cp      : newItem
    const scores    = computeMatchScore(lostItem, foundItem)
    if (scores.total < THRESHOLD) continue

    toInsert.push({
      lost_item_id:      lostItem.id,
      found_item_id:     foundItem.id,
      category_score:    scores.catScore,
      color_score:       scores.colorScore,
      location_score:    scores.locScore,
      description_score: scores.descScore,
      image_score:       scores.imgScore,
      total_score:       scores.total,
      status:            'pending',
    })
    notifyList.push({ lostItem, foundItem, score: scores.total })
  }

  if (!toInsert.length) return []

  // Upsert matches (ignore duplicates)
  const { data: inserted } = await supabase
    .from('matches')
    .upsert(toInsert, { onConflict: 'lost_item_id,found_item_id', ignoreDuplicates: true })
    .select()

  // Create notifications for the owners of the matching lost items
  const notifRows = []
  for (const { lostItem, foundItem, score } of notifyList) {
    notifRows.push({
      user_id:  lostItem.user_id,
      title:    `🔔 Possible match for your "${lostItem.item_name}"!`,
      message:  `A found item "${foundItem.item_name}" at ${foundItem.location} has a ${score}% match confidence.`,
      type:     'match',
      related_item_id: foundItem.id,
      is_read:  false,
    })
  }
  if (notifRows.length) {
    await supabase.from('notifications').insert(notifRows)
  }

  // Award +10 points when a found item is created (backend controls this, not the client)
  if (!isLost) {
    // Insert a points transaction record
    await supabase.from('points_transactions').insert({
      user_id: newItem.user_id,
      points:  10,
      reason:  'Reported found item',
      item_id: newItem.id,
    })
    // Increment profile points using a raw SQL increment via RPC
    await supabase.rpc('award_points', {
      p_user_id: newItem.user_id,
      p_points:  10,
      p_reason:  'Reported found item',
      p_item_id: newItem.id,
    }).catch(() => {
      // Fallback if RPC not available: use a direct update with explicit fetch+add
      // This is handled by the award_points PostgreSQL function in schema.sql
    })
  }

  return inserted || []
}
