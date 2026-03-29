CREATE POLICY "Anyone can read pack_configs"
ON public.site_config
FOR SELECT
TO anon, authenticated
USING (config_key LIKE 'pack_%');