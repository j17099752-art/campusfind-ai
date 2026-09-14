import { supabaseAdmin } from '../utils/supabase.js'

// ── authenticate ──────────────────────────────────────────────────
// Verifies the Bearer JWT from the Authorization header.
// Attaches req.user (Supabase auth user) and req.profile (profiles row).
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' })
  }

  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }

  // Fetch profile row for role checking
  const { data: profile, error: pErr } = await supabaseAdmin
    .from('profiles')
    .select('id, role, full_name, email, student_id, department, points')
    .eq('id', user.id)
    .single()

  if (pErr || !profile) {
    return res.status(401).json({ error: 'User profile not found.' })
  }

  req.user    = user
  req.profile = profile
  req.token   = token
  next()
}

// ── requireAdmin ─────────────────────────────────────────────────
// Must be used AFTER authenticate.
// Rejects if the authenticated user is not an admin.
// Never trusts a role claim sent from the client — always reads from DB.
export function requireAdmin(req, res, next) {
  if (req.profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' })
  }
  next()
}
