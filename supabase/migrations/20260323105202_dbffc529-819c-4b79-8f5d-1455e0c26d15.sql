CREATE POLICY "Anyone can read credit_configs"
ON public.site_config
FOR SELECT
TO anon, authenticated
USING (config_key IN ('default_free_credits', 'unlimited_credits'));