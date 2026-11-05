CREATE TABLE public.room_fx_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  scope text NOT NULL DEFAULT 'room',
  actor_name text NOT NULL DEFAULT 'Player',
  actor_avatar text,
  room_name text,
  target_name text,
  gift_name text,
  emoji text,
  amount bigint,
  vip_level integer,
  dedupe_key text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.room_fx_events TO authenticated;
GRANT ALL ON public.room_fx_events TO service_role;

ALTER TABLE public.room_fx_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fx_events_select" ON public.room_fx_events
  FOR SELECT TO authenticated USING (true);

CREATE INDEX room_fx_events_room_idx ON public.room_fx_events (room_id, created_at DESC);
CREATE INDEX room_fx_events_created_idx ON public.room_fx_events (created_at DESC);

ALTER TABLE public.room_fx_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_fx_events;

-- VIP level from current coin balance
CREATE OR REPLACE FUNCTION public.vip_level_for(_coins bigint)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _coins >= 500000 THEN 5
    WHEN _coins >= 200000 THEN 4
    WHEN _coins >= 80000 THEN 3
    WHEN _coins >= 30000 THEN 2
    WHEN _coins >= 10000 THEN 1
    ELSE 0 END
$$;

-- internal: idempotent fx insert
CREATE OR REPLACE FUNCTION public.log_fx(
  _room_id uuid,
  _actor_id uuid,
  _kind text,
  _scope text,
  _dedupe_key text,
  _target_name text DEFAULT NULL,
  _gift_name text DEFAULT NULL,
  _emoji text DEFAULT NULL,
  _amount bigint DEFAULT NULL,
  _vip_level integer DEFAULT NULL
)
RETURNS public.room_fx_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _row public.room_fx_events;
BEGIN
  INSERT INTO public.room_fx_events (
    room_id, actor_id, kind, scope, actor_name, actor_avatar, room_name,
    target_name, gift_name, emoji, amount, vip_level, dedupe_key
  )
  SELECT _room_id, _actor_id, _kind, _scope,
         COALESCE(p.display_name, 'Player'), p.avatar_url, r.name,
         _target_name, _gift_name, _emoji, _amount, _vip_level, _dedupe_key
  FROM public.profiles p
  LEFT JOIN public.rooms r ON r.id = _room_id
  WHERE p.id = _actor_id
  ON CONFLICT (dedupe_key) DO NOTHING
  RETURNING * INTO _row;

  IF _row.id IS NULL THEN
    SELECT * INTO _row FROM public.room_fx_events WHERE dedupe_key = _dedupe_key;
  END IF;

  RETURN _row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_fx(uuid, uuid, text, text, text, text, text, text, bigint, integer) FROM public, anon, authenticated;

-- VIP entry: level computed live from the caller's balance
CREATE OR REPLACE FUNCTION public.record_vip_entry(_room_id uuid)
RETURNS public.room_fx_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- same user + room + level only animates once per 10 minute window,
  -- but a level-up during the session produces a new key => new animation
  _key := 'vip:' || _room_id::text || ':' || _uid::text || ':' || _level::text
          || ':' || floor(extract(epoch from now()) / 600)::text;

  RETURN public.log_fx(
    _room_id, _uid, 'vip_entry',
    CASE WHEN _level >= 4 THEN 'global' ELSE 'room' END,
    _key, NULL, NULL, NULL, NULL, _level
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_vip_entry(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.record_vip_entry(uuid) TO authenticated;

-- red packet: log fx inside the same transaction, keyed by the packet id
CREATE OR REPLACE FUNCTION public.send_red_packet(_room_id uuid, _amount bigint, _packet_count integer DEFAULT 5, _message text DEFAULT 'Lucky Red Packet'::text)
RETURNS red_packets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _balance bigint;
  _row public.red_packets;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount < 100 THEN RAISE EXCEPTION 'Minimum red packet is 100 coins'; END IF;
  IF _packet_count < 1 OR _packet_count > 50 THEN RAISE EXCEPTION 'Invalid packet count'; END IF;

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
$$;

-- gift: log fx for 40k+ totals, keyed by the gift event id
CREATE OR REPLACE FUNCTION public.send_gift(_room_id uuid, _receiver_id uuid, _gift_id uuid, _quantity integer DEFAULT 1)
RETURNS gift_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;