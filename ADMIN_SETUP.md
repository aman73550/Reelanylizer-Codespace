# Admin Login Setup Guide

## ✅ Admin Credentials

- **Email:** owsmboy7383@gmail.com
- **Password:** Aman@73550
- **Login URL:** http://localhost:8080/bosspage-login
- **Admin Dashboard:** http://localhost:8080/bosspage

## 🚀 Setup Instructions

### Option 1: Using Setup Script (Recommended - Node.js)

1. **Set Environment Variables** (important!)
   ```bash
   export VITE_SUPABASE_URL="your-supabase-url"
   export SUPABASE_SERVICE_KEY="your-service-key"
   ```

2. **Run the setup script**
   ```bash
   node setup-admin.js
   ```

### Option 2: Manual Setup via Supabase Dashboard

1. Go to your Supabase project: [https://app.supabase.com](https://app.supabase.com)

2. **Create Auth User:**
   - Navigate to Authentication > Users
   - Click "Add User"
   - Email: `owsmboy7383@gmail.com`
   - Password: `Aman@73550`
   - Confirm email during creation
   - Click "Create User"

3. **Assign Admin Role:**
   - Navigate to SQL Editor
   - Run this query:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   SELECT id, 'admin'
   FROM auth.users
   WHERE email = 'owsmboy7383@gmail.com'
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

### Option 3: Direct Database Insert (SQL)

Run this SQL in your Supabase SQL Editor:

```sql
-- First, create the user (this creates auth entry)
-- This typically requires going through the UI or using Auth API

-- Then assign admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'owsmboy7383@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

## 🔐 Admin Panel Features

Once logged in, you'll have access to:

1. **📊 Dashboard** - View analytics and statistics
2. **👥 User Management** - Manage users and their credits
3. **💳 Payments** - View payment and transaction history
4. **💰 Plans & Pricing** - Control pricing and credit limits in real-time
5. **⚙️ Payment & Config** - Configure payment gateway settings
6. **🔑 API Keys** - Manage API keys for integrations

## 📱 Mobile Testing

The admin panel is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile devices

## 🆘 Troubleshooting

### "Admin privileges required" error
- Make sure the `user_roles` table has an entry with `role = 'admin'` for your user
- Verify the user_id matches correctly

### User not found
- Ensure the user was created in Supabase Auth
- Check email spelling: `owsmboy7383@gmail.com`

### Connection issues
- Verify Supabase URL and keys are correct
- Check network connectivity
- Ensure CORS is configured properly

## 🔗 Related Files

- Admin Login Page: `/src/pages/AdminLogin.tsx`
- Admin Dashboard: `/src/pages/AdminDashboard.tsx`
- Admin Components: `/src/components/Admin*.tsx`
- Database Schema: `/database-setup.sql`

## ⚠️ Security Notes

- Never share the admin password publicly
- Always use HTTPS in production
- Keep the service key secure
- Regularly audit admin access logs
- Change password after first login

---

**Last Updated:** 2025-03-29
**Status:** Ready for use ✅
