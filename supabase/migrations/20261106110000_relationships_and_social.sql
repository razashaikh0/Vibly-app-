-- Relationship rings, proposals, profile visitors and follows.
CREATE TABLE IF NOT EXISTS public.relationship_rings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💍',
  price BIGINT NOT NULL CHECK (price > 0),
  style TEXT NOT NULL DEFAULT 'crystal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.relationship_rings (name, emoji, price, style) VALUES
  ('Unicorn Ring', '🦄', 131466, 'unicorn'),
  ('Heart Ring', '💍', 41900, 'heart'),
  ('Crystal Ring', '💠', 30000, 'crystal'),
  ('Half Moon Ring', '💫', 11111, 'emerald')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.ring_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ring_id UUID NOT NULL REFERENCES public.relationship_rings(id) ON DELETE RESTRICT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.relationship_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ring_id UUID NOT NULL REFERENCES public.relationship_rings(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  CHECK (proposer_id <> recipient_id)
);

CREATE TABLE IF NOT EXISTS public.profile_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (visitor_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.profile_follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE OR REPLACE FUNCTION public.buy_ring(_ring_name TEXT)
RETURNS public.ring_inventory
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $function$
DECLARE
  _uid UUID := auth.uid();
  _ring public.relationship_rings;
  _row public.ring_inventory;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _ring FROM public.relationship_rings WHERE name = _ring_name;
  IF _ring.id IS NULL THEN RAISE EXCEPTION 'Ring not found'; END IF;
  UPDATE public.profiles SET coins = coins - _ring.price, updated_at = now()
    WHERE id = _uid AND coins >= _ring.price;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not enough coins'; END IF;
  INSERT INTO public.ring_inventory (owner_id, ring_id) VALUES (_uid, _ring.id) RETURNING * INTO _row;
  RETURN _row;
END;
$function$;

REVOKE ALL ON FUNCTION public.buy_ring(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buy_ring(TEXT) TO authenticated;

GRANT SELECT ON public.relationship_rings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ring_inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.relationship_proposals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profile_visits TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.profile_follows TO authenticated;
GRANT ALL ON public.relationship_rings, public.ring_inventory, public.relationship_proposals, public.profile_visits, public.profile_follows TO service_role;

ALTER TABLE public.relationship_rings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ring_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY rings_read ON public.relationship_rings FOR SELECT TO authenticated USING (true);
CREATE POLICY inventory_own ON public.ring_inventory FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY proposals_participants ON public.relationship_proposals FOR SELECT TO authenticated USING (proposer_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY proposals_create_own ON public.relationship_proposals FOR INSERT TO authenticated WITH CHECK (proposer_id = auth.uid());
CREATE POLICY proposals_respond_recipient ON public.relationship_proposals FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());
CREATE POLICY visits_visible ON public.profile_visits FOR SELECT TO authenticated USING (profile_id = auth.uid() OR visitor_id = auth.uid());
CREATE POLICY visits_create_own ON public.profile_visits FOR INSERT TO authenticated WITH CHECK (visitor_id = auth.uid() AND profile_id <> auth.uid());
CREATE POLICY follows_visible ON public.profile_follows FOR SELECT TO authenticated USING (follower_id = auth.uid() OR following_id = auth.uid());
CREATE POLICY follows_create_own ON public.profile_follows FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY follows_delete_own ON public.profile_follows FOR DELETE TO authenticated USING (follower_id = auth.uid());
