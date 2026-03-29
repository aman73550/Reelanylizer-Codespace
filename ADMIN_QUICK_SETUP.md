# Admin Quick Setup

## 1. Set admin secrets in Supabase

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## 2. Deploy required admin functions

- `create-admin`
- `admin-users`
- `admin-ai-chat`
- `manage-creators`
- `traffic-analytics`
- `usage-analyzer`

## 3. Create admin user

Call `create-admin` function once.

## 4. Login

- Login: `/bosspage-login`
- Dashboard: `/bosspage`

## Current Admin Sections

- Dashboard
- User Management
- Payments
- Plans and Pricing
- AI Assistant
- Manage Creators
- Traffic Analytics
- Usage Analytics

## If Login Fails

- Verify user has `admin` role in `user_roles`
- Verify frontend `.env` has valid `VITE_SUPABASE_*`
- Recheck edge function deployment and secrets
