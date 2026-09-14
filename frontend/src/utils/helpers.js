import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { MATCH_LEVELS, CATEGORY_EMOJI, LOCATION_ICONS } from './constants'

// ── Date formatting ──────────────────────────────────────────────
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    return isValid(d) ? format(d, 'dd MMM yyyy') : dateStr
  } catch {
    return dateStr
  }
}

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : ''
  } catch {
    return ''
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    return isValid(d) ? format(d, 'dd MMM yyyy, hh:mm a') : dateStr
  } catch {
    return dateStr
  }
}

// ── Match scoring helpers ────────────────────────────────────────
export function getMatchLevel(score) {
  return MATCH_LEVELS.find(l => score >= l.min && score <= l.max) || MATCH_LEVELS[3]
}

export function getScoreBarClass(score) {
  if (score >= 75) return 'high'
  if (score >= 50) return 'medium'
  return ''
}

// ── Category / location ──────────────────────────────────────────
export function getCategoryEmoji(category) {
  return CATEGORY_EMOJI[category] || '📦'
}

export function getLocationIcon(location) {
  return LOCATION_ICONS[location] || '📍'
}

// ── Image validation ──────────────────────────────────────────────
export function validateImageFile(file) {
  const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const MAX_MB  = 5
  if (!ALLOWED.includes(file.type)) {
    return 'Only JPG, PNG, or WebP images are allowed.'
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return `Image must be smaller than ${MAX_MB}MB.`
  }
  return null
}

// ── Truncate text ────────────────────────────────────────────────
export function truncate(str, maxLen = 120) {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

// ── Initials from name ───────────────────────────────────────────
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

// ── Build Supabase Storage public URL ────────────────────────────
export function getStorageUrl(supabaseUrl, path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${supabaseUrl}/storage/v1/object/public/item-images/${path}`
}

// ── Tokenise text for matching ───────────────────────────────────
export function tokenize(str) {
  const STOP = new Set([
    'the','and','a','an','of','in','on','at','to','is','it',
    'with','for','or','my','i','was','near','some','found','lost',
    'item','campus','college',
  ])
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP.has(w))
}

// ── Clamp a number ──────────────────────────────────────────────
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}

// ── Debounce ──────────────────────────────────────────────────────
export function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// ── Mask contact info (show only to owner or admin) ──────────────
export function maskContact(contact) {
  if (!contact) return '—'
  if (contact.includes('@')) {
    const [user, domain] = contact.split('@')
    return user.slice(0, 2) + '***@' + domain
  }
  return contact.slice(0, 3) + '****' + contact.slice(-2)
}

// ── Generate deterministic color from string ─────────────────────
export function stringToColor(str) {
  if (!str) return '#4f46e5'
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 60%, 50%)`
}
