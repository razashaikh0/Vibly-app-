-- Advanced wedding flow: proposal -> recipient decision -> official wedding hall.
CREATE TABLE IF NOT EXISTS public.weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_one_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_two_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ring_id UUID NOT NULL REFERENCES public.relationship_rings(id) ON DELETE RESTRICT,
  wedding_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (partner_one_id <> partner_two_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS weddings_active_partner_one_idx
  ON public.weddings (partner_one_id) WHERE status = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS weddings_active_partner_two_idx
  ON public.weddings (partner_two_id) WHERE status = 'active';

ALTER TABLE public.relationship_proposals
  ADD COLUMN IF NOT EXISTS message TEXT;

CREATE TABLE IF NOT EXISTS public.wedding_gift_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift_id UUID NOT NULL REFERENCES public.gifts(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 99),
  total_price BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.send_relationship_proposal(
  _recipient_id UUID,
  _ring_id UUID,
  _message TEXT DEFAULT NULL
)
RETURNS public.relationship_proposals
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $function$
DECLARE
  _uid UUID := auth.uid();
  _row public.relationship_proposals;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _uid = _recipient_id THEN RAISE EXCEPTION 'You cannot propose to yourself'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.ring_inventory WHERE id = _ring_id AND owner_id = _uid AND used_at IS NULL) THEN
    RAISE EXCEPTION 'Buy an unused ring before proposing';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.weddings
    WHERE status = 'active' AND (partner_one_id IN (_uid, _recipient_id) OR partner_two_id IN (_uid, _recipient_id))
  ) THEN
    RAISE EXCEPTION 'One of you is already married';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.relationship_proposals
    WHERE status = 'pending' AND proposer_id = _uid AND recipient_id = _recipient_id
  ) THEN
    RAISE EXCEPTION 'A proposal is already pending';
  END IF;

  INSERT INTO public.relationship_proposals (proposer_id, recipient_id, ring_id, message)
  VALUES (_uid, _recipient_id, _ring_id, NULLIF(trim(_message), ''))
  RETURNING * INTO _row;
  RETURN _row;
END;
$function$;

CREATE OR REPLACE FUNCTION public.respond_relationship_proposal(
  _proposal_id UUID,
  _accept BOOLEAN
)
RETURNS public.weddings
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $function$
DECLARE
  _uid UUID := auth.uid();
  _proposal public.relationship_proposals;
  _wedding public.weddings;
BEGIN
  SELECT * INTO _proposal FROM public.relationship_proposals
  WHERE id = _proposal_id AND recipient_id = _uid AND status = 'pending' FOR UPDATE;
  IF _proposal.id IS NULL THEN RAISE EXCEPTION 'Proposal not found or already handled'; END IF;

  IF NOT _accept THEN
    UPDATE public.relationship_proposals SET status = 'declined', responded_at = now() WHERE id = _proposal_id;
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.weddings
    WHERE status = 'active' AND (partner_one_id IN (_proposal.proposer_id, _uid) OR partner_two_id IN (_proposal.proposer_id, _uid))
  ) THEN
    RAISE EXCEPTION 'One of you is already married';
  END IF;

  INSERT INTO public.weddings (partner_one_id, partner_two_id, ring_id)
  VALUES (_proposal.proposer_id, _uid, _proposal.ring_id)
  RETURNING * INTO _wedding;

  UPDATE public.relationship_proposals SET status = 'accepted', responded_at = now() WHERE id = _proposal_id;
  UPDATE public.ring_inventory SET used_at = now() WHERE id = _proposal.ring_id AND owner_id = _proposal.proposer_id;
  RETURN _wedding;
END;
$function$;

CREATE OR REPLACE FUNCTION public.send_wedding_gift(
  _wedding_id UUID,
  _gift_id UUID,
  _quantity INTEGER DEFAULT 1
)
RETURNS public.wedding_gift_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $function$
DECLARE
  _uid UUID := auth.uid();
  _wedding public.weddings;
  _gift public.gifts;
  _total BIGINT;
  _row public.wedding_gift_events;
BEGIN
  SELECT * INTO _wedding FROM public.weddings
  WHERE id = _wedding_id AND status = 'active'
    AND (_uid = partner_one_id OR _uid = partner_two_id);
  IF _wedding.id IS NULL THEN RAISE EXCEPTION 'Wedding not found'; END IF;
  IF _quantity IS NULL OR _quantity < 1 OR _quantity > 99 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
  SELECT * INTO _gift FROM public.gifts WHERE id = _gift_id;
  IF _gift.id IS NULL THEN RAISE EXCEPTION 'Gift not found'; END IF;
  _total := _gift.price * _quantity;

  UPDATE public.profiles SET coins = coins - _total, updated_at = now()
  WHERE id = _uid AND coins >= _total;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not enough coins'; END IF;

  INSERT INTO public.wedding_gift_events (wedding_id, sender_id, gift_id, quantity, total_price)
  VALUES (_wedding_id, _uid, _gift_id, _quantity, _total)
  RETURNING * INTO _row;
  RETURN _row;
END;
$function$;

REVOKE ALL ON FUNCTION public.send_relationship_proposal(UUID, UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_relationship_proposal(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_wedding_gift(UUID, UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_relationship_proposal(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_relationship_proposal(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_wedding_gift(UUID, UUID, INTEGER) TO authenticated;

GRANT SELECT ON public.weddings TO authenticated;
GRANT SELECT, INSERT ON public.wedding_gift_events TO authenticated;
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_gift_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY weddings_participants_read ON public.weddings FOR SELECT TO authenticated USING (partner_one_id = auth.uid() OR partner_two_id = auth.uid());
CREATE POLICY wedding_gifts_participants_read ON public.wedding_gift_events FOR SELECT TO authenticated USING (sender_id = auth.uid() OR EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND (w.partner_one_id = auth.uid() OR w.partner_two_id = auth.uid())));
