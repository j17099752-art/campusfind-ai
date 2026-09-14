import { Router } from 'express'
import { body, param } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { validate }     from '../middleware/validate.js'
import { supabaseAdmin } from '../utils/supabase.js'

const router = Router()

// GET /api/matches/:matchId/messages
router.get(
  '/:matchId/messages',
  authenticate,
  param('matchId').isUUID(),
  validate,
  async (req, res) => {
    try {
      // Verify the user is a participant
      const { data: match } = await supabaseAdmin
        .from('matches')
        .select('lost_item:lost_item_id(user_id), found_item:found_item_id(user_id)')
        .eq('id', req.params.matchId)
        .single()
      if (!match) return res.status(404).json({ error: 'Match not found.' })

      const participants = [match.lost_item?.user_id, match.found_item?.user_id]
      if (!participants.includes(req.user.id) && req.profile.role !== 'admin') {
        return res.status(403).json({ error: 'Not a participant in this match.' })
      }

      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('*, sender:sender_id(id,full_name,avatar_url)')
        .eq('match_id', req.params.matchId)
        .order('created_at', { ascending: true })
      if (error) throw error

      // Mark messages to this user as read
      await supabaseAdmin
        .from('messages')
        .update({ is_read: true })
        .eq('match_id', req.params.matchId)
        .eq('receiver_id', req.user.id)
        .eq('is_read', false)

      res.json({ messages: data })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)

// POST /api/matches/:matchId/messages
router.post(
  '/:matchId/messages',
  authenticate,
  param('matchId').isUUID(),
  body('message').trim().isLength({ min: 1, max: 2000 }),
  validate,
  async (req, res) => {
    try {
      const { matchId } = req.params

      // Verify participant
      const { data: match } = await supabaseAdmin
        .from('matches')
        .select('lost_item:lost_item_id(user_id), found_item:found_item_id(user_id)')
        .eq('id', matchId)
        .single()
      if (!match) return res.status(404).json({ error: 'Match not found.' })

      const [ownerUserId, finderUserId] = [match.lost_item?.user_id, match.found_item?.user_id]
      const participants = [ownerUserId, finderUserId]
      if (!participants.includes(req.user.id)) {
        return res.status(403).json({ error: 'Not a participant in this match.' })
      }

      const receiverId = req.user.id === ownerUserId ? finderUserId : ownerUserId

      const { data, error } = await supabaseAdmin
        .from('messages')
        .insert({
          match_id:    matchId,
          sender_id:   req.user.id,
          receiver_id: receiverId,
          message:     req.body.message,
        })
        .select('*, sender:sender_id(id,full_name,avatar_url)')
        .single()
      if (error) throw error

      res.status(201).json({ message: data })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)

export default router
