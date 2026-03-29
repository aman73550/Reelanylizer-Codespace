
-- Creators table (separate login, not auth.users)
CREATE TABLE public.creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  profile_image text,
  platform text NOT NULL DEFAULT 'instagram',
  username text,
  followers text DEFAULT '0',
  tags text[] DEFAULT '{}',
  promo_video_url text,
  is_top_partner boolean DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage creators" ON public.creators FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read active creators" ON public.creators FOR SELECT TO anon, authenticated
  USING (status = 'active');

-- Campaigns table
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  campaign_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  revenue_share_percent numeric(5,2) NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaigns" ON public.campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read active campaigns" ON public.campaigns FOR SELECT TO anon, authenticated
  USING (status = 'active');

-- Creator payouts table
CREATE TABLE public.creator_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  bonus numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payouts" ON public.creator_payouts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_campaigns_creator ON public.campaigns(creator_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_creators_status ON public.creators(status);
CREATE INDEX idx_payouts_campaign ON public.creator_payouts(campaign_id);
