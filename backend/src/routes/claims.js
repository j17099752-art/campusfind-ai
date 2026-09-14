import { Router } from 'express'
import { body, param } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { validate }     from '../middleware/validate.js'
import { supabaseAdmin } from '../utils/supabase.js'

const router = Router()

// POST /api/claims – student submits a claim
router.post(
  '/',
  authenticate,
  [
    body('item_id').isUUID(),
    body('verification_answer').trim().isLength({ min: 10, max: 2000 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { item_id, verification_answer } = req.body

      // Verify item exists and is a found item
      const { data: item } = await supabaseAdmin
        .from('items').select('id,item_type,user_id,item_name,location').eq('id', item_id).single()
      if (!item) return res.status(404).json({ error: 'Item not found.' })
      if (item.item_type !== 'found') return res.status(400).json({ error: 'Can only claim found items.' })
      if (item.user_id === req.user.id) return res.status(400).json({ error: 'Cannot claim your own item.' })

      const { data, error } = await supabaseAdmin
        .from('claims')
        .insert({
          item_id,
          claimant_id:          req.user.id,
          verification_answer,
          status:               'pending',
        })
        .select()
        .single()
      if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'You have already submitted a claim for this item.' })
        throw error
      }

      // Notify admin via a system notification (insert for all admin users)
      const { data: admins } = await supabaseAdmin
        .from('profiles').select('id').eq('role', 'admin')
      if (admins?.length) {
        await supabaseAdmin.from('notifications').insert(
          admins.map(a => ({
            user_id: a.id,
            title:   `New Claim – ${item.item_name}`,
            message: `${req.profile.full_name} submitted a claim for "${item.item_name}" found at ${item.location}.`,
            type:    'claim',
            related_item_id: item_id,
          }))
        )
      }

      res.status(201).json({ data, message: 'Claim submitted.' })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)

// GET /api/claims – student sees their own claims
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('claims')
      .select('*, item:item_id(id,item_name,category,location,image_url,item_type)')
      .eq('claimant_id', req.user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ claims: data })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/claims/:id
router.get('/:id', authenticate, param('id').isUUID(), validate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('claims')
      .select('*, item:item_id(*), claimant:claimant_id(id,full_name,email,student_id)')
      .eq('id', req.params.id)
      .single()
    if (error || !data) return res.status(404).json({ error: 'Claim not found.' })

    // Only the claimant or admin can view
    if (data.claimant_id !== req.user.id && req.profile.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorised.' })
    }
    res.json({ claim: data })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
