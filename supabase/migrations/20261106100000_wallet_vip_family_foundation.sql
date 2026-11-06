-- Monetization and family foundation tables. Payment activation is intentionally
-- server/webhook-only; clients cannot mint coins or VIP access directly.
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('coin_purchase', 'gift_spend', 'family_creation', 'refund', 'adjustment')),
  amount_coins BIGINT NOT NULL DEFAULT 0,
  amount_money NUMERIC(12,2),
  currency TEXT,
  provider TEXT,
  provider_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_payment_id)
);

CREATE TABLE IF NOT EXISTS public.vip_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'quarterly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'refunded')),
  provider TEXT,
  provider_subscription_id TEXT,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subscription_id)
);

CREATE TABLE IF NOT EXISTS public.family_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE (family_id, invitee_id, status)
);

GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT SELECT ON public.vip_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.family_invites TO authenticated;
GRANT ALL ON public.wallet_transactions, public.vip_subscriptions, public.family_invites TO service_role;

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY wallet_transactions_own_read ON public.wallet_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY vip_subscriptions_own_read ON public.vip_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY family_invites_visible ON public.family_invites FOR SELECT TO authenticated USING (inviter_id = auth.uid() OR invitee_id = auth.uid());
CREATE POLICY family_invites_create ON public.family_invites FOR INSERT TO authenticated WITH CHECK (inviter_id = auth.uid());
CREATE POLICY family_invites_update_invitee ON public.family_invites FOR UPDATE TO authenticated USING (invitee_id = auth.uid()) WITH CHECK (invitee_id = auth.uid());
CREATE POLICY family_invites_cancel_inviter ON public.family_invites FOR UPDATE TO authenticated USING (inviter_id = auth.uid()) WITH CHECK (inviter_id = auth.uid());
