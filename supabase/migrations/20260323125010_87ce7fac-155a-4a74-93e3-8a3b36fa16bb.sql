-- Credit system tables

-- User credits table - tracks free and paid credits separately
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  free_credits integer NOT NULL DEFAULT 5,
  paid_credits integer NOT NULL DEFAULT 0,
  free_credits_reset_at timestamp with time zone NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  referral_code text UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  referred_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own credits" ON public.user_credits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" ON public.user_credits
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits" ON public.user_credits
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all credits" ON public.user_credits
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Credit transactions log
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  credit_type text NOT NULL DEFAULT 'free',
  description text,
  tool_used text,
  payment_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions" ON public.credit_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.credit_transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" ON public.credit_transactions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add credit cost configs to site_config
CREATE POLICY "Anyone can read credit_cost_configs" ON public.site_config
  FOR SELECT TO anon, authenticated
  USING (config_key IN ('credit_cost_reel_analysis', 'credit_cost_seo_optimizer', 'monthly_free_credits'));

-- Function to reset free credits monthly
CREATE OR REPLACE FUNCTION public.reset_free_credits_if_expired(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reset_at timestamp with time zone;
  v_monthly_free integer;
BEGIN
  SELECT free_credits_reset_at INTO v_reset_at
  FROM public.user_credits WHERE user_id = p_user_id;

  IF v_reset_at IS NOT NULL AND now() >= v_reset_at THEN
    SELECT COALESCE(config_value::integer, 5) INTO v_monthly_free
    FROM public.site_config WHERE config_key = 'monthly_free_credits';
    IF v_monthly_free IS NULL THEN v_monthly_free := 5; END IF;

    UPDATE public.user_credits
    SET free_credits = v_monthly_free,
        free_credits_reset_at = date_trunc('month', now()) + interval '1 month',
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;