import { Router } from 'express'
import { body, param } from 'express-validator'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { validate }                   from '../middleware/validate.js'
import { supabaseAdmin }              from '../utils/supabase.js'

const router = Router()

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin)

// ── GET /api/admin/dashboard ──────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [
      { count: lostCount },
      { count: foundCount },
      { count: matchCount },
      { count: recoveredCount },
      { count: pendingClaims },
      { count: usersCount },
    ] = await Promise.all([
      supabaseAdmin.from('items').select('id', { count: 'exact', head: true }).eq('item_type', 'lost'),
      supabaseAdmin.from('items').select('id', { count: 'exact', head: true }).eq('item_type', 'found'),
      supabaseAdmin.from('matches').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('items').select('id', { count: 'exact', head: true }).eq('status', 'recovered'),
      supabaseAdmin.from('claims').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
    ])

    res.json({
      stats: {
        total_users:     usersCount     ?? 0,
        total_lost:      lostCount      ?? 0,
        total_found:     foundCount     ?? 0,
        total_matches:   matchCount     ?? 0,
        recovered_items: recoveredCount ?? 0,
        pending_claims:  pendingClaims  ?? 0,
      },
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── GET /api/admin/users ──────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ users: data })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── GET /api/admin/items ──────────────────────────────────────────
router.get('/items', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('items')
      .select('*, profiles:user_id(full_name,email,student_id)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    res.json({ items: data })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── PUT /api/admin/items/:id/status ───────────────────────────────
router.put(
  '/items/:id/status',
  param('id').isUUID(),
  body('status').isIn(['active', 'matched', 'claimed', 'recovered', 'closed']),
  validate,
  async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('items')
        .update({ status: req.body.status })
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) throw error

      // Log admin action
      await supabaseAdmin.from('admin_actions').insert({
        admin_id:  req.user.id,
        action:    `set_item_status:${req.body.status}`,
        target_id: req.params.id,
        notes:     `Item status changed to ${req.body.status}`,
      })

      res.json({ data, message: `Item status updated to ${req.body.status}` })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)

// ── GET /api/admin/claims ─────────────────────────────────────────
router.get('/claims', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('claims')
      .select(`
        *,
        item:item_id (id, item_name, category, location, item_type, image_url),
        claimant:claimant_id (id, full_name, email, student_id, department)
      `)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ claims: data })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── PUT /api/admin/claims/:id ──────────────────────────────────────
router.put(
  '/claims/:id',
  param('id').isUUID(),
  body('status').isIn(['pending', 'under_review', 'approved', 'rejected']),
  body('admin_notes').optional().trim().isLength({ max: 500 }),
  validate,
  async (req, res) => {
    try {
      const { status, admin_notes = '' } = req.body

      // Fetch claim with item
      const { data: claim, error: cErr } = await supabaseAdmin
        .from('claims')
        .select('*, item:item_id(id, item_name, user_id), claimant:claimant_id(id, full_name)')
        .eq('id', req.params.id)
        .single()
      if (cErr || !claim) return res.status(404).json({ error: 'Claim not found.' })

      // Update claim status
      const { data: updated, error: uErr } = await supabaseAdmin
        .from('claims')
        .update({ status, admin_notes })
        .eq('id', req.params.id)
        .select()
        .single()
      if (uErr) throw uErr

      // If approved: update item status + award points + notify claimant
      if (status === 'approved') {
        await supabaseAdmin
          .from('items')
          .update({ status: 'recovered' })
          .eq('id', claim.item.id)

        // Award +15 points to claimant via the award_points function
        await supabaseAdmin.rpc('award_points', {
          p_user_id: claim.claimant_id,
          p_points:  15,
          p_reason:  'Claim approved – item recovered',
          p_item_id: claim.item.id,
        })

        // Notify claimant
        await supabaseAdmin.from('notifications').insert({
          user_id: claim.claimant_id,
          title:   '🎉 Your claim was approved!',
          message: `Your claim for "${claim.item.item_name}" has been approved. Contact the finder to collect your item.`,
          type:    'claim',
          related_item_id: claim.item.id,
        })

        // Notify the finder (found item owner) as well
        if (claim.item.user_id && claim.item.user_id !== claim.claimant_id) {
          await supabaseAdmin.from('notifications').insert({
            user_id: claim.item.user_id,
            title:   '✅ Claim approved for your found item',
            message: `The claim by ${claim.claimant.full_name} for "${claim.item.item_name}" has been approved. Please arrange handover.`,
            type:    'claim',
            related_item_id: claim.item.id,
          })
        }
      }

      // If rejected: notify claimant
      if (status === 'rejected') {
        await supabaseAdmin.from('notifications').insert({
          user_id: claim.claimant_id,
          title:   '❌ Your claim was not approved',
          message: admin_notes || 'Your claim was reviewed and could not be approved. Please verify your details and try again.',
          type:    'claim',
          related_item_id: claim.item.id,
        })
      }

      // Log admin action
      await supabaseAdmin.from('admin_actions').insert({
        admin_id:  req.user.id,
        action:    `claim_${status}`,
        target_id: req.params.id,
        notes:     admin_notes,
      })

      res.json({ claim: updated, message: `Claim ${status}` })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)

// ── GET /api/admin/activity-log ───────────────────────────────────
router.get('/activity-log', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_actions')
      .select('*, admin:admin_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    res.json({ actions: data })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
