
CREATE TABLE public.room_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_presence TO authenticated;
GRANT ALL ON public.room_presence TO service_role;
ALTER TABLE public.room_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "presence_select" ON public.room_presence FOR SELECT TO authenticated USING (true);
CREATE POLICY "presence_insert_own" ON public.room_presence FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "presence_update_own" ON public.room_presence FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "presence_delete_own" ON public.room_presence FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_room_host(room_id, auth.uid()));

CREATE TABLE public.room_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points BIGINT NOT NULL DEFAULT 0,
  charm BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);
GRANT SELECT ON public.room_activity TO authenticated;
GRANT ALL ON public.room_activity TO service_role;
ALTER TABLE public.room_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_select" ON public.room_activity FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.award_room_activity(_room_id UUID, _user_id UUID, _points BIGINT, _charm BIGINT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.room_activity (room_id, user_id, points, charm)
  VALUES (_room_id, _user_id, GREATEST(_points, 0), GREATEST(_charm, 0))
  ON CONFLICT (room_id, user_id) DO UPDATE
    SET points = public.room_activity.points + GREATEST(_points, 0),
        charm = public.room_activity.charm + GREATEST(_charm, 0),
        updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.join_room(_room_id UUID)
RETURNS public.room_presence LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _row public.room_presence;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.room_presence (room_id, user_id)
  VALUES (_room_id, _uid)
  ON CONFLICT (room_id, user_id) DO UPDATE SET last_seen = now()
  RETURNING * INTO _row;
  PERFORM public.award_room_activity(_room_id, _uid, 1, 0);
  RETURN _row;
END;
$$;
REVOKE ALL ON FUNCTION public.join_room(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_room(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.leave_room(_room_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  DELETE FROM public.room_presence WHERE room_id = _room_id AND user_id = _uid;
  UPDATE public.room_seats SET user_id = NULL, is_muted = false, updated_at = now()
    WHERE room_id = _room_id AND user_id = _uid;
END;
$$;
REVOKE ALL ON FUNCTION public.leave_room(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leave_room(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.on_room_message_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.award_room_activity(NEW.room_id, NEW.user_id, 2, 0);
  UPDATE public.room_presence SET last_seen = now() WHERE room_id = NEW.room_id AND user_id = NEW.user_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER room_message_activity AFTER INSERT ON public.room_messages
  FOR EACH ROW EXECUTE FUNCTION public.on_room_message_activity();

CREATE OR REPLACE FUNCTION public.on_gift_event_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.award_room_activity(NEW.room_id, NEW.sender_id, GREATEST(NEW.total_price / 10, 1), 0);
  PERFORM public.award_room_activity(NEW.room_id, NEW.receiver_id, 0, NEW.total_price);
  RETURN NEW;
END;
$$;
CREATE TRIGGER gift_event_activity AFTER INSERT ON public.gift_events
  FOR EACH ROW EXECUTE FUNCTION public.on_gift_event_activity();

ALTER TABLE public.room_presence REPLICA IDENTITY FULL;
ALTER TABLE public.room_activity REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_activity;
