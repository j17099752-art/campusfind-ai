// ================================================================
// CampusFind AI – Shared Constants
// ================================================================

export const CATEGORIES = [
  { value: 'ID Card',       label: '🪪 ID Card' },
  { value: 'Books',         label: '📚 Books' },
  { value: 'Electronics',   label: '💻 Electronics' },
  { value: 'Bags',          label: '🎒 Bags' },
  { value: 'Keys',          label: '🔑 Keys' },
  { value: 'Water Bottle',  label: '🍶 Water Bottle' },
  { value: 'Accessories',   label: '⌚ Accessories' },
  { value: 'Other',         label: '📦 Other' },
]

export const CATEGORY_EMOJI = {
  'ID Card':      '🪪',
  'Books':        '📚',
  'Electronics':  '💻',
  'Bags':         '🎒',
  'Keys':         '🔑',
  'Water Bottle': '🍶',
  'Accessories':  '⌚',
  'Other':        '📦',
}

export const LOCATIONS = [
  'Main Gate',
  'Library',
  'Canteen',
  'Block A',
  'Block B',
  'Laboratory',
  'Auditorium',
  'Playground',
  'Parking Area',
  'Sports Ground',
  'Block A Lecture Hall',
  'Cafeteria',
  'Library Reading Room',
  'Other',
]

export const LOCATION_ICONS = {
  'Main Gate':            '🚪',
  'Library':              '📚',
  'Canteen':              '🍽️',
  'Block A':              '🏢',
  'Block B':              '🏗️',
  'Laboratory':           '🔬',
  'Auditorium':           '🎭',
  'Playground':           '⚽',
  'Parking Area':         '🚗',
  'Sports Ground':        '🏃',
  'Block A Lecture Hall': '🎓',
  'Cafeteria':            '☕',
  'Library Reading Room': '📖',
  'Other':                '📍',
}

export const ITEM_STATUSES = [
  { value: 'active',    label: 'Active' },
  { value: 'matched',   label: 'Matched' },
  { value: 'claimed',   label: 'Claimed' },
  { value: 'recovered', label: 'Recovered' },
  { value: 'closed',    label: 'Closed' },
]

export const CLAIM_STATUSES = {
  pending:      { label: 'Pending',      color: 'badge-pending' },
  under_review: { label: 'Under Review', color: 'badge-matched' },
  approved:     { label: 'Approved',     color: 'badge-approved' },
  rejected:     { label: 'Rejected',     color: 'badge-rejected' },
}

export const MATCH_LEVELS = [
  { min: 90, max: 100, label: 'Very Strong Match', emoji: '🔥', color: '#10b981' },
  { min: 75, max: 89,  label: 'Strong Match',      emoji: '⭐', color: '#4f46e5' },
  { min: 60, max: 74,  label: 'Possible Match',    emoji: '🔍', color: '#f59e0b' },
  { min: 0,  max: 59,  label: 'Weak Match',        emoji: '💡', color: '#9ca3af' },
]

export const MATCH_THRESHOLD = 40 // minimum score to show a match

export const POINTS = {
  REPORT_FOUND:       10,
  SUCCESSFUL_RETURN:  25,
  CLAIM_APPROVED:     15,
}

export const CLAIM_QUESTIONS = [
  'Describe a unique identifying feature, mark, or damage on the item.',
  'What was inside or attached to the item when you last had it?',
  'What is the exact brand, model, or any label on the item?',
  'Where exactly on campus did you last have this item?',
]

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const MAX_IMAGE_SIZE_MB = 5
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
