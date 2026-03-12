# Access Rules Management - Admin Dashboard

The admin dashboard now includes a UI for managing access permission rules.

## What's New

### New Page: Access Rules (`/access-rules`)

A complete interface to manage flexible, database-driven permission rules that control which pattern labels users can access based on their tags.

### Features

1. **View All Rules**
   - See all active and inactive rules
   - Shows priority, conditions, and grants for each rule
   - Rules listed by priority (highest first)

2. **Create New Rules**
   - Define rule name and description
   - Set priority (higher = evaluated first)
   - Add user conditions (who the rule applies to):
     - Tag-based conditions (e.g., "premium", "bundle-pack-subscription")
     - Guest user conditions
     - AND/OR logic support via condition groups
   - Add pattern grants (what users can access):
     - Specific pattern labels (e.g., "Free", "Premium")
     - "All Labels" option for unrestricted access

3. **Manage Rules**
   - Activate/deactivate rules without deleting them
   - Delete rules (with confirmation)
   - Changes take effect immediately (no server restart needed)

## UI Navigation

After logging in, you'll see two menu items:
- **Announcements** - Manage system announcements
- **Access Rules** - Manage permission rules (NEW)

## Example Use Cases

### Creating a Rule for Premium Users

1. Click "Create Rule"
2. Fill in:
   - **Rule Name**: `premium_access`
   - **Description**: `Premium users see Premium and Free patterns`
   - **Priority**: `5`
3. User Conditions:
   - Condition Group: `1`
   - User Tag Name: `premium`
4. Pattern Grants:
   - Add grant: Pattern Label = `Premium`
   - Add grant: Pattern Label = `Free`
5. Click "Create Rule"

### Rule for Users with Multiple Tags

To create a rule like "Users with (tag_a AND tag_b) OR (tag_c) get access":

1. User Conditions:
   - Group `1`: Tag = `tag_a`
   - Group `1`: Tag = `tag_b`
   - Group `2`: Tag = `tag_c`

Within the same group = AND logic
Between groups = OR logic

### Unrestricted Access Rule

To give certain users access to ALL patterns:

1. User Conditions:
   - User Tag Name: `gp_int_test` (or any tag)
2. Pattern Grants:
   - Toggle "All Labels" = ON
   - (Leave Pattern Label empty)

## How It Works

### Rule Evaluation

1. Backend evaluates rules by priority (highest first)
2. For each rule, checks if user matches conditions
3. Collects all granted pattern labels
4. If any rule grants "All Labels", user sees everything
5. Otherwise, user sees patterns with matching labels

### Immediate Effect

- All changes take effect immediately
- No server restart required
- Rules are evaluated from database on every request

## API Endpoints Used

- `GET /api/access-rules/admin/rules` - List all rules
- `POST /api/access-rules/admin/rules` - Create rule
- `DELETE /api/access-rules/admin/rules/{id}` - Delete rule
- `POST /api/access-rules/admin/rules/{id}/activate` - Activate rule
- `POST /api/access-rules/admin/rules/{id}/deactivate` - Deactivate rule

## Files Added/Modified

### New Files
- `src/types/access_rules.ts` - TypeScript types
- `src/services/accessRules.ts` - API service
- `src/pages/AccessRulesPage.tsx` - UI component

### Modified Files
- `src/App.tsx` - Added route
- `src/components/Layout.tsx` - Added navigation item

## Development

To test locally:

```bash
# Make sure backend is running with the new access rules API
cd the_stitch_tracker/backend
alembic upgrade head
python ../scripts/database/seed_access_rules.py

# Start admin dashboard
cd ../../tsp-admin-dashboard
npm run dev
```

Navigate to http://localhost:5173/access-rules (after logging in)

## Security

- All endpoints require admin authentication
- Admin users must have the "admin" tag in their user account
- Changes are logged and tracked with created_at/updated_at timestamps
