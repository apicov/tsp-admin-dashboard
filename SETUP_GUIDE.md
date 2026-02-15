# Admin Dashboard - Quick Setup Guide

## What You Have Now

A **separate, secure admin dashboard** for managing The Stitch Tracker:

```
the_stitch_tracker/
├── backend/           # Shared API (serves both mobile app & admin)
├── frontend/          # Mobile app (Capacitor) ✅ No admin code
└── admin-dashboard/   # NEW - Web-only admin dashboard ✅
```

---

## Quick Start

### 1. Install Dependencies

```bash
cd admin-dashboard
npm install
```

### 2. Start Backend API

```bash
cd ../backend
conda activate ml
python main_sqlalchemy.py
```

### 3. Start Admin Dashboard

```bash
cd ../admin-dashboard
npm run dev
```

**Admin dashboard**: http://localhost:5174

---

## First Time Setup

### Make Yourself Admin

**Option A - Database (Quick)**:

```bash
cd backend
conda activate ml
python
```

```python
from db_sqlalchemy import SessionLocal, User
from tag_checker import assign_tag_to_user

db = SessionLocal()

# Find your user
user = db.query(User).filter(User.email == 'your@email.com').first()
print(f"User ID: {user.id}")

# Assign admin tag
assign_tag_to_user(user.id, "admin", db)
print("✅ Admin tag assigned!")

db.close()
```

**Option B - SQL (Manual)**:

```sql
-- Add admin tag if it doesn't exist
INSERT INTO customer_tags (tag_name, description)
VALUES ('admin', 'Administrator access')
ON CONFLICT (tag_name) DO NOTHING;

-- Assign admin tag to your user
INSERT INTO user_customer_tags (user_id, tag_id, synced_from_shopify)
SELECT
    u.id,
    ct.id,
    FALSE
FROM users u
CROSS JOIN customer_tags ct
WHERE u.email = 'your@email.com'
  AND ct.tag_name = 'admin'
ON CONFLICT DO NOTHING;
```

### Login

1. Go to http://localhost:5174
2. Enter your email and password
3. You'll be logged in to the admin dashboard!

---

## Features

### Announcements Management

- ✅ Create announcements with targeting
- ✅ Edit existing announcements
- ✅ Delete announcements
- ✅ Toggle active/inactive
- ✅ Schedule (start/end dates)
- ✅ Action buttons (e.g., "Subscribe Now")
- ✅ User targeting by tags

### Security

- 🔐 Login required
- 🔐 Admin tag verification
- 🔐 JWT authentication
- 🔐 Separate from mobile app
- 🔐 Backend validates admin status

---

## Production Deployment

### Build for Production

```bash
cd admin-dashboard
npm run build
```

### Deploy Options

**Option 1: Netlify** (Recommended)

```bash
# Connect your repo and deploy
netlify deploy --prod --dir=dist
```

**Option 2: Vercel**

```bash
vercel --prod
```

**Option 3: Traditional Hosting**

Upload `dist/` folder to your web server. Configure:

```nginx
# nginx example
server {
    listen 80;
    server_name admin.yoursite.com;
    root /var/www/admin-dashboard/dist;

    location / {
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
    }
}
```

### Environment Configuration

Create `.env.production`:

```env
VITE_API_URL=https://api.yoursite.com
```

---

## Moving to Separate Repository

When ready to move this to its own repo:

```bash
# 1. Copy folder
cp -r admin-dashboard ~/stitch-tracker-admin

# 2. Initialize new repo
cd ~/stitch-tracker-admin
git init
git add .
git commit -m "Initial commit: Admin dashboard"

# 3. Push to GitHub
git remote add origin https://github.com/yourusername/stitch-tracker-admin.git
git push -u origin main
```

---

## Adding More Admin Features

The dashboard is designed to be extensible. Add new pages easily:

### Example: Users Management

**1. Create page**:

```tsx
// src/pages/UsersPage.tsx
export default function UsersPage() {
  // Fetch users from /api/admin/users
  // Display in table
  // CRUD operations
}
```

**2. Add route**:

```tsx
// src/App.tsx
<Route path="/users" element={<UsersPage />} />
```

**3. Create backend endpoint**:

```python
# backend/routes/admin_users.py
@router.get("/api/admin/users")
async def get_users(
    db: Session = Depends(get_db_session),
    current_admin: any = Depends(get_current_admin_user)
):
    users = db.query(User).all()
    return users
```

**4. Add navigation** (optional):

```tsx
// Add menu in AnnouncementsPage AppBar
<Button onClick={() => navigate('/users')}>
  Users
</Button>
```

---

## Future Enhancements

Ready to add:

### Analytics Dashboard
- User growth metrics
- Pattern popularity
- Engagement stats
- Revenue tracking

### User Management
- View all users
- Assign/remove tags
- Ban/unban users
- View user activity

### Pattern Management
- Upload new patterns
- Edit pattern metadata
- Bulk operations
- Thumbnail generation

### Content Moderation
- Review user photos
- Flagged content
- Approve/reject

### System Settings
- App configuration
- Feature flags
- Maintenance mode
- Email templates

### Tracking Metrics
- Implement the tracking system from `TRACKING_SYSTEM_PLAN.md`
- View analytics dashboard
- Export data

---

## Architecture

### Separation of Concerns

**Mobile App** (`frontend/`):
- Customer-facing
- Capacitor (iOS/Android)
- Pattern browsing, stitching tracker
- **No admin code** ✅

**Admin Dashboard** (`admin-dashboard/`):
- Admin-only
- Web-only (React + Vite)
- Management interface
- Announcements, users, analytics
- **Separate deployment** ✅

**Backend API** (`backend/`):
- Shared by both apps
- FastAPI + SQLAlchemy
- Protected admin endpoints
- Single source of truth

### Benefits

✅ **Security**: Admin features not exposed in mobile app
✅ **Performance**: Mobile app smaller without admin UI
✅ **Maintenance**: Update admin dashboard independently
✅ **Scalability**: Different deployment strategies
✅ **User Experience**: Clean separation of concerns

---

## Troubleshooting

### Can't Login

1. **Check user has admin tag**:
   ```sql
   SELECT u.email, ct.tag_name
   FROM users u
   JOIN user_customer_tags uct ON u.id = uct.user_id
   JOIN customer_tags ct ON uct.tag_id = ct.id
   WHERE u.email = 'your@email.com';
   ```

2. **Check backend is running**:
   ```bash
   curl http://localhost:8000/health
   ```

3. **Check credentials**:
   - Make sure you're using the correct email/password
   - Try logging into mobile app first to verify

### 403 Forbidden

- User logged in but doesn't have "admin" tag
- Run the "Make Yourself Admin" script above

### API Errors

- Check backend logs
- Verify `VITE_API_URL` in `.env` (if set)
- Check proxy configuration in `vite.config.ts`

---

## Summary

You now have:
- ✅ Separate admin dashboard (web-only)
- ✅ Secure authentication (admin tag required)
- ✅ Announcements management
- ✅ Clean, extensible architecture
- ✅ Ready to move to separate repo
- ✅ Ready to expand with more features

**Access**: http://localhost:5174
**Port**: 5174 (different from mobile app's 5173)
**Login**: Use your app credentials + "admin" tag
