-- Admin User Setup SQL Script
-- Run this in Supabase SQL Editor after creating the user in Auth

-- Step 1: Check if user exists (for reference)
-- SELECT id, email FROM auth.users WHERE email = 'owsmboy7383@gmail.com';

-- Step 2: Insert admin role for the user
-- Replace {USER_ID} with the actual user ID from Step 1
INSERT INTO public.user_roles (user_id, role)
VALUES ('{USER_ID}', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Or use this query if you prefer email-based lookup:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'owsmboy7383@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the role was assigned
SELECT u.id, u.email, ur.role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'owsmboy7383@gmail.com';
