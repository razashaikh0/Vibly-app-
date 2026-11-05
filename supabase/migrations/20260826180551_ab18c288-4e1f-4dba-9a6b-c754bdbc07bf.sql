CREATE TABLE public.fx_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, action)
);

GRANT SELECT ON public.fx_rate_limits TO authenticated;
GRANT ALL ON public.fx_rate_limits TO service_role;

ALTER TABLE public.fx_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fx_rate_limits_select_own" ON public.fx_rate_limits
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER update_fx_rate_limits_updated_at
  BEFORE UPDATE ON public.fx_rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Returns true when the action is allowed, and records the usage.
CREATE OR REPLACE FUNCTION public.fx_rate_ok(_user_id uuid, _action text, _window_seconds integer, _max_count integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.fx_rate_limits;
BEGIN
  SELECT * INTO _row FROM public.fx_rate_limits
    WHERE user_id = _user_id AND action = _action FOR UPDATE;

  IF _row.id IS NULL THEN
    INSERT INTO public.fx_rate_limits(user_id, action, window_start, count)
    VALUES (_user_id, _action, now(), 1)
    ON CONFLICT (user_id, action) DO UPDATE SET count = public.fx_rate_limits.count + 1, updated_at = now();
    RETURN true;
  END IF;

  IF now() - _row.window_start >= make_interval(secs => _window_seconds) THEN
    UPDATE public.fx_rate_limits SET window_start = now(), count = 1, updated_at = now()
      WHERE id = _row.id;
    RETURN true;
  END IF;

  IF _row.count >= _max_count THEN
    RETURN false;
  END IF;

  UPDATE public.fx_rate_limits SET count = _row.count + 1, updated_at = now() WHERE id = _row.id;
  RETURN true;
END;
$$;

-- Red packets: 1 per 30 seconds per user.
CREATE OR REPLACE FUNCTION public.send_red_packet(_room_id uuid, _amount bigint, _packet_count integer DEFAULT 5, _message text DEFAULT 'Lucky Red Packet'::text)
RETURNS red_packets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _balance bigint;
  _row public.red_packets;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount < 100 THEN RAISE EXCEPTION 'Minimum red packet is 100 coins'; END IF;
  IF _packet_count < 1 OR _packet_count > 50 THEN RAISE EXCEPTION 'Invalid packet count'; END IF;

  IF NOT public.fx_rate_ok(_uid, 'red_packet', 30, 1) THEN
    RAISE EXCEPTION 'Slow down — you can drop one red packet every 30 seconds';
  END IF;

  SELECT coins INTO _balance FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF _balance IS NULL OR _balance < _amount THEN RAISE EXCEPTION 'Not enough coins'; END IF;

  UPDATE public.profiles SET coins = coins - _amount, updated_at = now() WHERE id = _uid;

  INSERT INTO public.red_packets (room_id, sender_id, amount, packet_count, message)
  VALUES (_room_id, _uid, _amount, _packet_count, COALESCE(NULLIF(_message, ''), 'Lucky Red Packet'))
  RETURNING * INTO _row;

  INSERT INTO public.room_messages (room_id, user_id, content, kind)
  VALUES (_room_id, _uid, 'dropped a Lucky Red Packet of ' || _amount || ' coins!', 'red_packet');

  PERFORM public.log_fx(
    _room_id, _uid, 'red_packet', 'global', 'rp:' || _row.id::text,
    NULL, NULL, '🧧', _amount, NULL
  );

  RETURN _row;
END;
$function$;

-- Gifts: 5 sends per minute per user.
CREATE OR REPLACE FUNCTION public.send_gift(_room_id uuid, _receiver_id uuid, _gift_id uuid, _quantity integer DEFAULT 1)
RETURNS gift_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _sender UUID := auth.uid();
  _price BIGINT;
  _total BIGINT;
  _row public.gift_events;
  _gift public.gifts;
  _receiver_name text;
BEGIN
  IF _sender IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _quantity IS NULL OR _quantity < 1 OR _quantity > 99 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;

  IF NOT public.fx_rate_ok(_sender, 'gift', 60, 5) THEN
    RAISE EXCEPTION 'Slow down — you can send up to 5 gifts per minute';
  END IF;

  SELECT * INTO _gift FROM public.gifts WHERE id = _gift_id;
  IF _gift.id IS NULL THEN RAISE EXCEPTION 'Gift not found'; END IF;
  _price := _gift.price;
  _total := _price * _quantity;

  UPDATE public.profiles SET coins = coins - _total, updated_at = now()
    WHERE id = _sender AND coins >= _total;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not enough coins'; END IF;

  IF _receiver_id <> _sender THEN
    UPDATE public.profiles SET coins = coins + _total, updated_at = now() WHERE id = _receiver_id;
  END IF;

  INSERT INTO public.gift_events (room_id, sender_id, receiver_id, gift_id, quantity, total_price)
  VALUES (_room_id, _sender, _receiver_id, _gift_id, _quantity, _total)
  RETURNING * INTO _row;

  IF _total >= 40000 THEN
    SELECT COALESCE(display_name, 'Player') INTO _receiver_name FROM public.profiles WHERE id = _receiver_id;
    PERFORM public.log_fx(
      _room_id, _sender, 'big_gift', 'global', 'gift:' || _row.id::text,
      CASE WHEN _receiver_id = _sender THEN 'themselves' ELSE _receiver_name END,
      _gift.name || ' ×' || _quantity::text, _gift.emoji, _total, NULL
    );
  END IF;

  RETURN _row;
END;
$function$;

-- VIP entries: 1 animation per 10 minutes per user (silently skipped, not an error).
CREATE OR REPLACE FUNCTION public.record_vip_entry(_room_id uuid)
RETURNS room_fx_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _coins bigint;
  _level integer;
  _key text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT coins INTO _coins FROM public.profiles WHERE id = _uid;
  _level := public.vip_level_for(COALESCE(_coins, 0));
  IF _level < 1 THEN RETURN NULL; END IF;

  _key := 'vip:' || _room_id::text || ':' || _uid::text || ':' || _level::text
          || ':' || floor(extract(epoch from now()) / 600)::text;

  IF EXISTS (SELECT 1 FROM public.room_fx_events WHERE dedupe_key = _key) THEN
    RETURN NULL;
  END IF;

  IF NOT public.fx_rate_ok(_uid, 'vip_entry', 600, 1) THEN
    RETURN NULL;
  END IF;

  RETURN public.log_fx(
    _room_id, _uid, 'vip_entry',
    CASE WHEN _level >= 4 THEN 'global' ELSE 'room' END,
    _key, NULL, NULL, NULL, NULL, _level
  );
END;
$function$;