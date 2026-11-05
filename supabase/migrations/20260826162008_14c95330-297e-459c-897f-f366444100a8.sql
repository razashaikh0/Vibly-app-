
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'Player',
  avatar_url TEXT,
  bio TEXT,
  coins BIGINT NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ROOMS
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  topic TEXT,
  cover_emoji TEXT NOT NULL DEFAULT '🎧',
  theme TEXT NOT NULL DEFAULT 'violet',
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seat_count INT NOT NULL DEFAULT 9,
  is_live BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_select" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "rooms_insert_own" ON public.rooms FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());
CREATE POLICY "rooms_update_host" ON public.rooms FOR UPDATE TO authenticated USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());
CREATE POLICY "rooms_delete_host" ON public.rooms FOR DELETE TO authenticated USING (host_id = auth.uid());

-- helper
CREATE OR REPLACE FUNCTION public.is_room_host(_room_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = _room_id AND r.host_id = _user_id)
$$;

-- SEATS
CREATE TABLE public.room_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  seat_index INT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_muted BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, seat_index)
);
CREATE UNIQUE INDEX room_seats_one_per_user ON public.room_seats (room_id, user_id) WHERE user_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_seats TO authenticated;
GRANT ALL ON public.room_seats TO service_role;
ALTER TABLE public.room_seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seats_select" ON public.room_seats FOR SELECT TO authenticated USING (true);
CREATE POLICY "seats_insert" ON public.room_seats FOR INSERT TO authenticated WITH CHECK (public.is_room_host(room_id, auth.uid()) OR user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "seats_update" ON public.room_seats FOR UPDATE TO authenticated USING (public.is_room_host(room_id, auth.uid()) OR user_id = auth.uid() OR user_id IS NULL) WITH CHECK (public.is_room_host(room_id, auth.uid()) OR user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "seats_delete_host" ON public.room_seats FOR DELETE TO authenticated USING (public.is_room_host(room_id, auth.uid()));

-- MESSAGES
CREATE TABLE public.room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.room_messages TO authenticated;
GRANT ALL ON public.room_messages TO service_role;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select" ON public.room_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "messages_insert_own" ON public.room_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "messages_delete" ON public.room_messages FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_room_host(room_id, auth.uid()));

-- GIFTS
CREATE TABLE public.gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  price BIGINT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'common'
);
GRANT SELECT ON public.gifts TO authenticated;
GRANT ALL ON public.gifts TO service_role;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gifts_select" ON public.gifts FOR SELECT TO authenticated USING (true);

INSERT INTO public.gifts (name, emoji, price, tier) VALUES
  ('Rose', '🌹', 10, 'common'),
  ('Ice Cream', '🍦', 25, 'common'),
  ('Teddy', '🧸', 50, 'common'),
  ('Guitar', '🎸', 120, 'rare'),
  ('Crown', '👑', 300, 'rare'),
  ('Rocket', '🚀', 700, 'epic'),
  ('Sports Car', '🏎️', 1500, 'epic'),
  ('Castle', '🏰', 5000, 'legendary');

-- GIFT EVENTS
CREATE TABLE public.gift_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gift_id UUID NOT NULL REFERENCES public.gifts(id),
  quantity INT NOT NULL DEFAULT 1,
  total_price BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gift_events TO authenticated;
GRANT ALL ON public.gift_events TO service_role;
ALTER TABLE public.gift_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gift_events_select" ON public.gift_events FOR SELECT TO authenticated USING (true);

-- send gift atomically
CREATE OR REPLACE FUNCTION public.send_gift(_room_id UUID, _receiver_id UUID, _gift_id UUID, _quantity INT DEFAULT 1)
RETURNS public.gift_events LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _sender UUID := auth.uid();
  _price BIGINT;
  _total BIGINT;
  _row public.gift_events;
BEGIN
  IF _sender IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _quantity IS NULL OR _quantity < 1 OR _quantity > 99 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
  IF _receiver_id = _sender THEN RAISE EXCEPTION 'Cannot gift yourself'; END IF;

  SELECT price INTO _price FROM public.gifts WHERE id = _gift_id;
  IF _price IS NULL THEN RAISE EXCEPTION 'Gift not found'; END IF;
  _total := _price * _quantity;

  UPDATE public.profiles SET coins = coins - _total, updated_at = now()
    WHERE id = _sender AND coins >= _total;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not enough coins'; END IF;

  UPDATE public.profiles SET coins = coins + _total, updated_at = now() WHERE id = _receiver_id;

  INSERT INTO public.gift_events (room_id, sender_id, receiver_id, gift_id, quantity, total_price)
  VALUES (_room_id, _sender, _receiver_id, _gift_id, _quantity, _total)
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.send_gift(UUID, UUID, UUID, INT) TO authenticated;

-- create room with seats
CREATE OR REPLACE FUNCTION public.create_room(_name TEXT, _topic TEXT, _cover_emoji TEXT, _theme TEXT, _seat_count INT DEFAULT 9)
RETURNS public.rooms LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _room public.rooms;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _seat_count < 4 OR _seat_count > 12 THEN _seat_count := 9; END IF;

  INSERT INTO public.rooms (name, topic, cover_emoji, theme, host_id, seat_count)
  VALUES (COALESCE(NULLIF(trim(_name), ''), 'New Room'), _topic, COALESCE(_cover_emoji, '🎧'), COALESCE(_theme, 'violet'), _uid, _seat_count)
  RETURNING * INTO _room;

  INSERT INTO public.room_seats (room_id, seat_index, user_id)
  SELECT _room.id, g, CASE WHEN g = 0 THEN _uid ELSE NULL END
  FROM generate_series(0, _seat_count - 1) g;

  RETURN _room;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_room(TEXT, TEXT, TEXT, TEXT, INT) TO authenticated;

-- new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Player'),
    lower(split_part(COALESCE(NEW.email, NEW.id::text), '@', 1)) || '_' || substr(NEW.id::text, 1, 4),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- realtime
ALTER TABLE public.room_seats REPLICA IDENTITY FULL;
ALTER TABLE public.room_messages REPLICA IDENTITY FULL;
ALTER TABLE public.gift_events REPLICA IDENTITY FULL;
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_seats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gift_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
