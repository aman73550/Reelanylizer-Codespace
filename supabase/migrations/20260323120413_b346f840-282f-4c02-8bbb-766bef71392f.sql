
-- User management table for admin controls (block, extra credits)
CREATE TABLE public.user_management (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_blocked boolean NOT NULL DEFAULT false,
  extra_credits integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_management ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can read user_management"
  ON public.user_management FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert
CREATE POLICY "Admins can insert user_management"
  ON public.user_management FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update user_management"
  ON public.user_management FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete user_management"
  ON public.user_management FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can read their own blocked status
CREATE POLICY "Users can read own management status"
  ON public.user_management FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
