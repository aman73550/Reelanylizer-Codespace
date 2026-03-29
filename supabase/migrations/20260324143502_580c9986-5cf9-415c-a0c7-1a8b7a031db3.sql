
-- Activity logs for audit trail
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type text NOT NULL DEFAULT 'admin',
  actor_id text,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage activity_logs" ON public.activity_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert activity_logs" ON public.activity_logs FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);
