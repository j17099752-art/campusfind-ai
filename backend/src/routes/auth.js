import { Router } from 'express'
import { body }   from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { validate }     from '../middleware/validate.js'
import { supabaseAdmin } from '../utils/supabase.js'

const router = Router()

// GET /api/auth/profile – return current user's profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single()
    if (error) throw error
    res.json({ profile: data })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT /api/auth/profile – update name, studentId, department, avatar
router.put(
  '/profile',
  authenticate,
  [
    body('full_name').optional().trim().isLength({ min: 1, max: 100 }),
    body('student_id').optional().trim().isLength({ max: 50 }),
    body('department').optional().trim().isLength({ max: 100 }),
    body('avatar_url').optional().isURL(),
  ],
  validate,
  async (req, res) => {
    try {
      const allowed = ['full_name','student_id','department','avatar_url']
      const updates = Object.fromEntries(
        Object.entries(req.body).filter(([k]) => allowed.includes(k))
      )
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', req.user.id)
        .select()
        .single()
      if (error) throw error
      res.json({ profile: data })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)

export default router
