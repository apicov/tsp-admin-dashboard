# The Stitch Tracker - Admin Dashboard

Web-based admin dashboard for managing The Stitch Tracker app.

## Features

- 🔐 Secure admin login (requires "admin" customer tag)
- 📢 Announcements management (create, edit, delete, toggle)
- 🎯 User targeting (all users or specific tags)
- 📅 Scheduled announcements (start/end dates)
- 🎨 Clean, responsive Material-UI interface

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Material-UI** - Component library
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client

## Prerequisites

- Node.js 18+ and npm
- Backend API running (see ../backend)
- Admin user account with "admin" tag

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API URL (Optional)

For development, the dashboard uses Vite proxy to connect to `http://localhost:8000`.

For production, set the API URL:

```bash
# Create .env file
echo "VITE_API_URL=https://api.yoursite.com" > .env
```

### 3. Run Development Server

```bash
npm run dev
```

The dashboard will be available at: **http://localhost:5174**

## Production Build

```bash
npm run build
```

Built files will be in the `dist/` folder. Deploy to any static hosting:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any web server

## Usage

### Login

1. Navigate to `http://localhost:5174`
2. Login with your admin credentials
3. Your user must have the "admin" Shopify customer tag

### Managing Announcements

**Create:**
- Click "New Announcement"
- Fill in title, message, and options
- Click "Create"

**Edit:**
- Click edit icon (pencil)
- Modify fields
- Click "Update"

**Delete:**
- Click delete icon (trash)
- Confirm deletion

**Toggle Active:**
- Use the switch in the "Active" column

## Making a User Admin

### Option 1: Shopify (Recommended)

1. Go to Shopify admin → Customers
2. Find your user
3. Add tag: `admin`
4. Wait for webhook sync

### Option 2: Database (Development)

```sql
-- Add admin tag to user
INSERT INTO customer_tags (tag_name, description)
VALUES ('admin', 'Administrator access')
ON CONFLICT (tag_name) DO NOTHING;

INSERT INTO user_customer_tags (user_id, tag_id, synced_from_shopify)
SELECT
    u.id,
    ct.id,
    FALSE
FROM users u, customer_tags ct
WHERE u.email = 'your@email.com'
  AND ct.tag_name = 'admin';
```

## Project Structure

```
admin-dashboard/
├── src/
│   ├── pages/
│   │   ├── LoginPage.tsx          # Admin login
│   │   └── AnnouncementsPage.tsx  # Announcements CRUD
│   ├── App.tsx                    # Main app & routing
│   └── main.tsx                   # Entry point
├── index.html                     # HTML template
├── vite.config.ts                 # Vite configuration
├── package.json                   # Dependencies
└── README.md                      # This file
```

## Adding More Admin Features

To add new admin pages (users, analytics, etc.):

1. Create new page in `src/pages/`
2. Add route in `App.tsx`
3. Create corresponding backend endpoints
4. Protect endpoints with `get_current_admin_user`

Example:

```tsx
// src/pages/UsersPage.tsx
export default function UsersPage() {
  // Fetch users from API
  // Display in table
  // CRUD operations
}

// App.tsx
<Route path="/users" element={<UsersPage />} />
```

## Security

- **Frontend**: Login required, token stored in localStorage
- **Backend**: All admin endpoints check for "admin" tag
- **No admin bundled in mobile app** - This is a separate web app

## Moving to Separate Repo

When ready to move this to its own repository:

```bash
# 1. Create new repo on GitHub
# 2. Copy this folder
cp -r admin-dashboard ../stitch-tracker-admin

# 3. Initialize git
cd ../stitch-tracker-admin
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/stitch-tracker-admin.git
git push -u origin main
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `` (uses proxy) |

## License

Same as main project.
