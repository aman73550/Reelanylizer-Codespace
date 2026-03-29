-- Allow delete on tables that need cleanup (edge function uses service role so this is fine)
DROP POLICY IF EXISTS "No public access to rate_limits" ON public.rate_limits;

CREATE POLICY "Rate limits service access" ON public.rate_limits
FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);