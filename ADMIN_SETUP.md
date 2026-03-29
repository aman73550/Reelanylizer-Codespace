# Admin Setup Guide

This document reflects the current working admin flow.

## Admin URLs

- Login: `http://localhost:8080/bosspage-login`
- Dashboard: `http://localhost:8080/bosspage`

## Recommended Method (Edge Function)

1. In Supabase Edge Function secrets, set:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

2. Deploy `create-admin` function.

3. Call the function once to create/admin-assign the user.

4. Login via `/bosspage-login`.

## Manual Method (SQL role assignment)

If user already exists in Supabase Auth, assign role:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = '<admin-email>'
ON CONFLICT (user_id, role) DO NOTHING;
```

## Script-Based Method (Optional)

Scripts available:

- `setup-admin.js`
- `setup-admin.py`
- `setup-admin.sql`

Before using scripts, verify environment variables expected by script:

- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` (or service-role equivalent)

Important: Current setup scripts contain hardcoded sample credentials. Update email/password constants in script files before using in production.

## Current Admin Modules (UI)

- Dashboard
- User Management
- Payments
- Plans and Pricing
- AI Assistant
- Manage Creators
- Traffic Analytics
- Usage Analytics

## Troubleshooting

### Access denied / admin required

- Confirm entry exists in `user_roles` with `role = 'admin'`.
- Confirm you are logged in with the same user id.

### Admin page redirects to login

- Session may be expired. Re-login.
- Confirm Supabase URL/public key in `.env` are correct.

### Admin module errors

- Ensure related edge functions are deployed:
  - `admin-users`
  - `admin-ai-chat`
  - `manage-creators`
  - `traffic-analytics`
  - `usage-analyzer`
