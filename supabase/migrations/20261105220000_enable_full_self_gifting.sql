-- Full self-gifting mode.
-- A self-gift spends coins, records a normal gift event, awards room activity/charm
-- through the existing trigger, emits luxury-gift FX, and adds lifetime VIP points.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vip_points BIGINT NOT NULL DEFAULT 0;

-- Preserve the current VIP level for existing users, then let future gifting
-- progress continue independently from the spendable coin balance.
UPDATE public.profiles
SET vip_points = GREATEST(COALESCE(vip_points, 0), COALESCE(coins, 0));

CREATE OR REPLACE FUNCTION public.send_gift(
  _room_id UUID,
  _receiver_id UUID,
  _gift_id UUID,
  _quantity INTEGER DEFAULT 1
)
RETURNS public.gift_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  _sender UUID := auth.uid();
  _price BIGINT;
  _total BIGINT;
  _row public.gift_events;
  _gift public.gifts;
  _receiver_name TEXT;
BEGIN
  IF _sender IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _quantity IS NULL OR _quantity < 1 OR _quantity > 99 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;
  IF NOT public.fx_rate_ok(_sender, 'gift', 60, 5) THEN
    RAISE EXCEPTION 'Slow down — you can send up to 5 gifts per minute';
  END IF;

  SELECT * INTO _gift FROM public.gifts WHERE id = _gift_id;
  IF _gift.id IS NULL THEN
    RAISE EXCEPTION 'Gift not found';
  END IF;
  _price := _gift.price;
  _total := _price * _quantity;

  UPDATE public.profiles
  SET coins = coins - _total,
      vip_points = COALESCE(vip_points, 0) + _total,
      updated_at = now()
  WHERE id = _sender AND coins >= _total;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not enough coins';
  END IF;

  -- Normal gifts credit the receiver. Self-gifts intentionally do not refund
  -- coins, so the economy remains spend-based while the event still counts.
  IF _receiver_id <> _sender THEN
    UPDATE public.profiles
    SET coins = coins + _total,
        updated_at = now()
    WHERE id = _receiver_id;
  END IF;

  INSERT INTO public.gift_events (
    room_id,
    sender_id,
    receiver_id,
    gift_id,
    quantity,
    total_price
  )
  VALUES (_room_id, _sender, _receiver_id, _gift_id, _quantity, _total)
  RETURNING * INTO _row;

  IF _total >= 40000 THEN
    SELECT COALESCE(display_name, 'Player')
    INTO _receiver_name
    FROM public.profiles
    WHERE id = _receiver_id;

    PERFORM public.log_fx(
      _room_id,
      _sender,
      'big_gift',
      'global',
      'gift:' || _row.id::TEXT,
      CASE WHEN _receiver_id = _sender THEN 'themselves' ELSE _receiver_name END,
      _gift.name || ' ×' || _quantity::TEXT,
      _gift.emoji,
      _total,
      NULL
    );
  END IF;

  RETURN _row;
END;
$function$;

REVOKE ALL ON FUNCTION public.send_gift(UUID, UUID, UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_gift(UUID, UUID, UUID, INTEGER) TO authenticated;

-- VIP entry animations now use lifetime VIP points, so self-gift spend upgrades
-- VIP even though the spendable coin balance decreases.
CREATE OR REPLACE FUNCTION public.record_vip_entry(_room_id UUID)
RETURNS public.room_fx_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  _uid UUID := auth.uid();
  _vip_points BIGINT;
  _level INTEGER;
  _key TEXT;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT vip_points INTO _vip_points
  FROM public.profiles
  WHERE id = _uid;

  _level := public.vip_level_for(COALESCE(_vip_points, 0));
  IF _level < 1 THEN
    RETURN NULL;
  END IF;

  _key := 'vip:' || _room_id::TEXT || ':' || _uid::TEXT || ':' || _level::TEXT
    || ':' || floor(EXTRACT(EPOCH FROM now()) / 600)::TEXT;
  IF EXISTS (SELECT 1 FROM public.room_fx_events WHERE dedupe_key = _key) THEN
    RETURN NULL;
  END IF;
  IF NOT public.fx_rate_ok(_uid, 'vip_entry', 600, 1) THEN
    RETURN NULL;
  END IF;

  RETURN public.log_fx(
    _room_id,
    _uid,
    'vip_entry',
    CASE WHEN _level >= 4 THEN 'global' ELSE 'room' END,
    _key,
    NULL,
    NULL,
    NULL,
    NULL,
    _level
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.record_vip_entry(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_vip_entry(UUID) TO authenticated;
