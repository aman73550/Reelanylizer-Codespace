-- First, find your user ID - run this to see who you are:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@here.com';

-- Then update the user_id below and run this:
-- Replace 'YOUR-USER-ID-HERE' with the actual UUID from above

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = (
  SELECT email FROM auth.users ORDER BY created_at DESC LIMIT 1
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify it worked:
SELECT u.email, ur.role 
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
ORDER BY u.created_at DESC
LIMIT 5;
