import 'dotenv/config'
import express   from 'express'
import cors      from 'cors'
import helmet    from 'helmet'
import morgan    from 'morgan'
import rateLimit from 'express-rate-limit'

import authRoutes   from './routes/auth.js'
import itemRoutes   from './routes/items.js'
import matchRoutes  from './routes/matches.js'
import claimRoutes  from './routes/claims.js'
import notifRoutes  from './routes/notifications.js'
import messageRoutes from './routes/messages.js'
import adminRoutes  from './routes/admin.js'

const app  = express()
const PORT = process.env.PORT || 4000

// ── Security ──────────────────────────────────────────────────────
app.use(helmet())

// Clean origin — removes trailing slashes or invisible characters
const allowedOrigin = (process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/\/+$/, '')

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods:     ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}))

// ── Rate limiting ──────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests, please try again later.' },
})
app.use(limiter)

// Stricter limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { error: 'Too many auth attempts. Try again in 15 minutes.' },
})

// ── Body parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Logging ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// ── Health check ──────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes)
app.use('/api/items',         itemRoutes)
app.use('/api/matches',       matchRoutes)
app.use('/api/claims',        claimRoutes)
app.use('/api/notifications', notifRoutes)
app.use('/api/matches',       messageRoutes)  // /api/matches/:matchId/messages
app.use('/api/admin',         adminRoutes)

// ── 404 handler ────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' })
})

// ── Global error handler ───────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  })
})

app.listen(PORT, () => {
  console.log(`✅ CampusFind AI backend running on port ${PORT}`)
})

export default app
