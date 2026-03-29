
-- Payments table for Paytm UPI tracking
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id text UNIQUE NOT NULL,
  txn_id text,
  amount numeric NOT NULL,
  plan_id text NOT NULL,
  credits_added integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('SUCCESS', 'PENDING', 'FAILED')),
  payment_method text NOT NULL DEFAULT 'UPI',
  gateway_response jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own payments
CREATE POLICY "Users can read own payments"
ON public.payments FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all payments
CREATE POLICY "Admins can manage all payments"
ON public.payments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role / edge functions insert via service key (no RLS for anon insert needed)
CREATE POLICY "Service insert payments"
ON public.payments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow anon read for site_config payment_gateway_type
INSERT INTO public.site_config (config_key, config_value) 
VALUES ('payment_gateway', 'paytm')
ON CONFLICT DO NOTHING;

-- Add RLS policy for anyone to read payment_gateway config
CREATE POLICY "Anyone can read payment_gateway_config"
ON public.site_config FOR SELECT TO anon, authenticated
USING (config_key = 'payment_gateway');
