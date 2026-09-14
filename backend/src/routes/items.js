import { Router } from 'express'
import { body, query, param } from 'express-validator'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { validate }                   from '../middleware/validate.js'
import { supabaseAdmin }              from '../utils/supabase.js'
import { findAndPersistMatches }      from '../services/matchingService.js'

const router = Router()

const VALID_CATEGORIES = ['ID Card','Books','Electronics','Bags','Keys','Water Bottle','Accessories','Other']
const VALID_STATUSES   = ['active','matched','claimed','recovered','closed']

// POST /api/items – create a new lost/found report
router.post(
  '/',
  authenticate,
  [
    body('item_type').isIn(['lost','found']).withMessage('item_type must be lost or found'),
    body('item_name').trim().isLength({ min: 1, max: 200 }).withMessage('item_name is required'),
    body('category').isIn(VALID_CATEGORIES).withMessage('Invalid category'),
    body('color').trim().isLength({ min: 1, max: 100 }),
    body('location').trim().isLength({ min: 1, max: 200 }),
    body('date').isDate().withMessage('Invalid date'),
    body('description').trim().isLength({ min: 5, max: 2000 }),
    body('contact_information').trim().isLength({ min: 1, max: 200 }),
    body('image_url').optional({ nullable: true }).isURL().withMessage('Invalid image URL'),
  ],
  validate,
  async (req, res) => {
    try {
      const payload = {
        user_id:             req.user.id,
        item_type:           req.body.item_type,
        item_name:           req.body.item_name,
        category:            req.body.category,
        color:               req.body.color,
        location:            req.body.location,
        date:                req.body.date,
        description:         req.body.description,
        contact_information: req.body.contact_information,
        image_url:           req.body.image_url || null,
        status:              'active',
      }

      const { data, error } = await supabaseAdmin
        .from('items')
        .insert(payload)
        .select()
        .single()
      if (error) throw error

      // Run matching asynchronously (don't block the response)
      findAndPersistMatches(supabaseAdmin, data).catch(err =>
        console.error('Matching error for item', data.id, err.message)
      )

      res.status(201).json({ data, message: 'Item reported successfully.' })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)

// GET /api/items – search + filter
router.get(
  '/',
  [
    query('q').optional().trim().isLength({ max: 200 }),
    query('category').optional().isIn([...VALID_CATEGORIES,'']),
    query('location').optional().trim(),
    query('item_type').optional().isIn(['lost','found','']),
    query('status').optional().isIn([...VALID_STATUSES,'']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { q = '', category = '', location = '', item_type = '', status = '', page = 1, limit = 20 } = req.query
      const offset = (parseInt(page) - 1) * parseInt(limit)

      let qb = supabaseAdmin
        .from('items')
        .select('*, profiles:user_id(full_name,avatar_url,student_id,department)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1)

      if (item_type) qb = qb.eq('item_type', item_type)
      if (category)  qb = qb.eq('category', category)
      if (location)  qb = qb.eq('location', location)
      if (status)    qb = qb.eq('status', status)
      if (q)         qb = qb.or(`item_name.ilike.%${q}%,description.ilike.%${q}%,color.ilike.%${q}%`)

      const { data, error, count } = await qb
      if (error) throw error
      res.json({ items: data, count, page: parseInt(page), limit: parseInt(limit) })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)

// GET /api/items/:id
router.get('/:id', param('id').isUUID(), validate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('items')
      .select('*, profiles:user_id(id,full_name,avatar_url,student_id,department,points)')
      .eq('id', req.params.id)
      .single()
    if (error || !data) return res.status(404).json({ error: 'Item not found.' })
    res.json({ data })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT /api/items/:id – owner or admin can update
router.put(
  '/:id',
  authenticate,
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      // Fetch item to verify ownership
      const { data: existing } = await supabaseAdmin.from('items').select('user_id').eq('id', req.params.id).single()
      if (!existing) return res.status(404).json({ error: 'Item not found.' })
      if (existing.user_id !== req.user.id && req.profile.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorised to update this item.' })
      }

      const allowed = ['item_name','category','color','location','date','description','contact_information','image_url','status']
      const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)))

      const { data, error } = await supabaseAdmin
        .from('items').update(updates).eq('id', req.params.id).select().single()
      if (error) throw error
      res.json({ data })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)

// DELETE /api/items/:id – admin only
router.delete('/:id', authenticate, requireAdmin, param('id').isUUID(), validate, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('items').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ message: 'Item deleted.' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
