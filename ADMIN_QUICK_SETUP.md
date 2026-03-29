# 🔐 Admin Setup Quick Reference

## Admin Credentials
```
Email:    owsmboy7383@gmail.com
Password: Aman@73550
```

## URLs
```
Login:     http://localhost:8080/bosspage-login
Dashboard: http://localhost:8080/bosspage
```

---

## Setup Options

### ✅ Option 1: Supabase Dashboard (Easiest)

1. Go to: https://app.supabase.com
2. Select your project: `Reelanylizer-Codespace` (rixowqvcfdcznjjurmnl)
3. **Create User in Auth:**
   - Authentication > Users > "Add User"
   - Email: `owsmboy7383@gmail.com`
   - Password: `Aman@73550`
   - Confirm email (check the checkbox)
   - Click "Create User"

4. **Add Admin Role in Database:**
   - SQL Editor > "New Query"
   - Copy & Run:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   SELECT id, 'admin' FROM auth.users
   WHERE email = 'owsmboy7383@gmail.com'
   ON CONFLICT (user_id, role) DO NOTHING;
   ```
5. ✅ Done! Login at `/bosspage-login`

---

### 🚀 Option 2: Python Script

```bash
# Install dependencies
pip install supabase python-dotenv

# Set environment variables
export VITE_SUPABASE_URL="your-project-url"
export SUPABASE_SERVICE_KEY="your-service-key"

# Run setup
python setup-admin.py
```

---

### 🟢 Option 3: Node.js Script

```bash
# Set environment variables
export VITE_SUPABASE_URL="your-project-url"
export SUPABASE_SERVICE_KEY="your-service-key"

# Run setup
node setup-admin.js
```

---

## Admin Panel Features

Once logged in with the admin credentials, you'll access:

| Feature | Description |
|---------|-------------|
| **📊 Dashboard** | View usage statistics, trends, and analytics |
| **👥 Users** | Manage users, view profiles, adjust credits |
| **💳 Payments** | View transactions, payment history, revenue |
| **💰 Plans** | Control pricing, credit limits, packages |
| **⚙️ Config** | Payment gateway settings, API configs |
| **🔑 API Keys** | Manage integration keys |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Admin privileges required" | Run SQL to insert admin role in `user_roles` table |
| Login fails | Verify user exists in Supabase Auth with exact email |
| Access denied | Check `user_roles` table - ensure role = 'admin' entry exists |
| Database connection error | Verify Supabase credentials in .env file |

---

## Files Created

- `setup-admin.js` - Node.js setup script
- `setup-admin.py` - Python setup script  
- `setup-admin.sql` - SQL-only setup script
- `ADMIN_SETUP.md` - Detailed documentation
- `ADMIN_QUICK_SETUP.md` - This file

📖 See `ADMIN_SETUP.md` for detailed instructions
