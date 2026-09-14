# 🎒 CampusFind AI — Smart Campus Lost & Found System

A production-ready full-stack web application that helps students report lost/found belongings, discover AI-matched items, communicate through secure match chat, submit ownership claims, and allow administrators to verify recoveries — all backed by a real database.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Report Lost/Found** | Full form with image upload to Supabase Storage |
| **AI Smart Match** | Multi-signal scoring engine (category, color, location, description, image) |
| **Real-time Chat** | Secure match chat using Supabase Realtime — only participants can access |
| **Claims System** | Verification questions → admin review → approval/rejection with notifications |
| **Notifications** | Real-time bell notifications with unread count |
| **Campus Map** | Interactive campus schematic showing item activity per location |
| **Dashboard** | Live stats, Recharts analytics, Good Samaritan leaderboard |
| **Admin Panel** | Full CRUD: claims, items, users, notifications, activity log |
| **Auth** | Supabase Auth — email/password, student & admin roles, protected routes |
| **RLS** | Full Postgres Row Level Security — students can't see other students' private data |

---

## 🛠 Technology Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS (custom design tokens matching original prototype)
- React Router v6
- Supabase JS client (auth + realtime + storage)
- Recharts (dashboard analytics)
- react-hot-toast

**Backend**
- Node.js + Express
- Supabase JS (service-role client for admin operations)
- express-validator, helmet, cors, morgan, express-rate-limit

**Database / Platform**
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage (item images)
- Supabase Realtime (messages + notifications)

---

## 📁 Project Structure

```
campusfind-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          LoginForm, RegisterForm, AuthModals, ProtectedRoute, AdminRoute
│   │   │   ├── items/         ItemCard, ItemDetailModal, ClaimModal
│   │   │   ├── layout/        Navbar, Footer
│   │   │   ├── match/         MatchCard
│   │   │   └── ui/            Button, Input, Modal, Badge, Spinner, EmptyState, ConfirmDialog, SkeletonCard
│   │   ├── context/           AuthContext, ModalContext
│   │   ├── pages/             HomePage, FindItemsPage, SmartMatchPage, ReportLostPage,
│   │   │                      ReportFoundPage, MyReportsPage, MatchChatPage, CampusMapPage,
│   │   │                      DashboardPage, AdminPanelPage, NotFoundPage
│   │   ├── services/          supabase.js, itemsService, matchService, notificationService,
│   │   │                      claimsService, chatService
│   │   └── utils/             constants.js, helpers.js
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
├── backend/
│   └── src/
│       ├── routes/            auth, items, matches, claims, notifications, messages, admin
│       ├── middleware/        auth.js (JWT verify + role check), validate.js
│       ├── services/          matchingService.js (scoring engine + persist)
│       └── utils/             supabase.js (admin client)
│
├── supabase/
│   ├── schema.sql             All tables, RLS policies, triggers, functions
│   └── seed.sql               Campus locations + instructions for demo users
│
├── .gitignore
└── README.md
```

---

## 🗄 Supabase Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **anon key** (Settings → API).
3. Note your **service role key** (Settings → API → service_role) — this is backend-only.

### 2. Run the database schema

1. Open your Supabase project → **SQL Editor**.
2. Paste the entire contents of `supabase/schema.sql` and click **Run**.
3. Paste the contents of `supabase/seed.sql` and click **Run** (adds campus locations).

### 3. Create the Storage bucket

In Supabase Dashboard → **Storage**:

1. Click **New bucket** → name it `item-images` → enable **Public bucket** → Save.
2. Go to **Policies** on the bucket and add:
   - `SELECT` — allow all (`TRUE`)
   - `INSERT` — allow authenticated users (`auth.uid() IS NOT NULL`)
   - `DELETE` — allow file owner or admin

Or run this SQL:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "images_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'item-images');

CREATE POLICY "images_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'item-images' AND auth.uid() IS NOT NULL);
```

### 4. Create demo users (optional)

In Supabase Dashboard → **Authentication → Users**, create users manually:

| Email | Password | Role |
|---|---|---|
| student1@campusfind.dev | Test@1234 | student (default) |
| student2@campusfind.dev | Test@1234 | student (default) |
| admin@campusfind.dev | Admin@1234 | *set manually* |

To set admin role, run in SQL Editor:

```sql
UPDATE profiles SET role = 'admin'
WHERE email = 'admin@campusfind.dev';
```

---

## ⚙️ Environment Variables

### Frontend — `frontend/.env`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:4000
```

### Backend — `backend/.env`

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

> ⚠️ **Never commit `.env` files.** The service role key bypasses all RLS — keep it backend-only.

---

## 🚀 Running Locally

### Prerequisites

- Node.js 18+
- npm 9+
- A Supabase project (schema applied)

### Frontend

```bash
cd frontend
npm install
cp .env.example .env     # fill in your Supabase URL + anon key
npm run dev              # starts at http://localhost:5173
```

### Backend

```bash
cd backend
npm install
cp .env.example .env     # fill in your Supabase URL + service role key
npm run dev              # starts at http://localhost:4000
```

Both must be running simultaneously for full functionality.

---

## 👑 Creating an Admin User

1. Register a normal account through the app (or create one in Supabase Auth dashboard).
2. Run this SQL in Supabase SQL Editor:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

3. Log out and log back in. The Admin Panel link will appear in the navbar.

---

## 🌐 Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build   # generates dist/
```

1. Push to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Set **Root Directory** to `frontend`.
4. Add environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (point to your deployed backend).

### Backend → Render / Railway

1. Push to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Set **Root Directory** to `backend`.
4. Build command: `npm install`
5. Start command: `node src/server.js`
6. Add environment variables from `backend/.env.example`.
7. Add your frontend's Vercel URL as `FRONTEND_URL`.

### Supabase

Already hosted — nothing extra to deploy.

---

## 🤖 AI Matching Engine

The current implementation is a **multi-signal rule-based scoring algorithm**, not a deep-learning model. It scores matches across five signals:

| Signal | Max Score | How it works |
|---|---|---|
| Category | 20 pts | Exact string match |
| Color | 15 pts | Exact or token overlap |
| Location | 20 pts | Exact / substring / token overlap |
| Description | 25 pts | Token overlap ratio across name + description |
| Image | 20 pts | **Placeholder** — awards partial credit when both items have images |

**To integrate a real image model later:**
- Replace `computeImageScore()` in `backend/src/services/matchingService.js`
- Store image embeddings in a `pgvector` column or external vector DB
- Compute cosine similarity and map the result to 0–20 points

---

## 🔐 Security Notes

- The **Supabase service role key** is only used in the backend — never shipped to the browser.
- **Row Level Security** is enabled on every table — students can only read/write their own data.
- **Role** is always read from the database server-side — the client cannot elevate its own privileges.
- All backend routes use JWT verification via `supabaseAdmin.auth.getUser(token)`.
- Rate limiting is applied globally (200 req/15 min) and stricter on auth endpoints (20 req/15 min).

---

## ⚠️ Known Limitations

- Image similarity is a placeholder — it awards base credit when both items have images but does not perform visual comparison.
- The campus map is a schematic grid, not a real geographic map. Google Maps / Mapbox integration is architecturally prepared.
- Email confirmation must be handled via Supabase's default flow (no custom email server configured).
- No push notifications — uses in-app notifications via Supabase Realtime.

---

## 🔮 Future Improvements

- [ ] Integrate a real image embedding model (e.g. CLIP via Hugging Face) for visual similarity
- [ ] Add Google Maps / Leaflet for a real campus map
- [ ] Push notifications via Web Push API
- [ ] Mobile app (React Native / Expo)
- [ ] QR code labels for found items
- [ ] Bulk admin actions
- [ ] Email notifications for claim updates
- [ ] Advanced analytics with date-range filtering
