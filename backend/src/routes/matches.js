import { Router } from 'express'
import { param }  from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { validate }     from '../middleware/validate.js'
import { supabaseAdmin } from '../utils/supabase.js'
import { findAndPersistMatches } from '../services/matchingService.js'

const router = Router()

// POST /api/matches – run matching engine for an item
router.post('/', authenticate, async (req, res) => {
  try {
    const { itemId } = req.body
    if (!itemId) return res.status(422).json({ error: 'itemId is required.' })

    const { data: item, error } = await supabaseAdmin
      .from('items').select('*').eq('id', itemId).single()
    if (error || !item) return res.status(404).json({ error: 'Item not found.' })

    // Only the item owner or an admin can trigger matching
    if (item.user_id !== req.user.id && req.profile.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorised.' })
    }

    const matches = await findAndPersistMatches(supabaseAdmin, item)
    res.json({ matches, count: matches.length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/matches/:itemId – matches for a specific item
router.get(
  '/:itemId',
  authenticate,
  param('itemId').isUUID(),
  validate,
  async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('matches')
        .select(`
          *,
          lost_item:lost_item_id (*, profiles:user_id(id,full_name,avatar_url)),
          found_item:found_item_id(*, profiles:user_id(id,full_name,avatar_url))
        `)
        .or(`lost_item_id.eq.${req.params.itemId},found_item_id.eq.${req.params.itemId}`)
        .order('total_score', { ascending: false })
      if (error) throw error
      res.json({ matches: data })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)

// GET /api/my-matches – all matches for the authenticated user's items
router.get('/my-matches', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('matches')
      .select(`
        *,
        lost_item:lost_item_id (*, profiles:user_id(id,full_name,avatar_url)),
        found_item:found_item_id(*, profiles:user_id(id,full_name,avatar_url))
      `)
      .gte('total_score', 40)
      .order('total_score', { ascending: false })
    if (error) throw error

    const mine = (data || []).filter(
      m => m.lost_item?.user_id === req.user.id || m.found_item?.user_id === req.user.id
    )
    res.json({ matches: mine })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
