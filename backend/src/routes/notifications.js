import { Router } from 'express'
import { param }  from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { validate }     from '../middleware/validate.js'
import { supabaseAdmin } from '../utils/supabase.js'

const router = Router()

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    res.json({ notifications: data })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT /api/notifications/:id/read
router.put(
  '/:id/read',
  authenticate,
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', req.params.id)
        .eq('user_id', req.user.id) // ensure ownership
      if (error) throw error
      res.json({ message: 'Marked as read.' })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)

// PUT /api/notifications/read-all
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false)
    if (error) throw error
    res.json({ message: 'All notifications marked as read.' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
