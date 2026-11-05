ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'chats';

CREATE OR REPLACE FUNCTION public.create_room(_name text, _topic text, _cover_emoji text, _theme text, _seat_count integer, _category text DEFAULT 'chats')
RETURNS public.rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_room public.rooms;
  i integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  INSERT INTO public.rooms (name, topic, cover_emoji, theme, host_id, seat_count, category)
  VALUES (coalesce(nullif(_name, ''), 'New Room'), _topic, coalesce(nullif(_cover_emoji,''), '🎧'), coalesce(nullif(_theme,''), 'violet'), auth.uid(), greatest(4, least(12, coalesce(_seat_count, 9))), coalesce(nullif(_category,''), 'chats'))
  RETURNING * INTO new_room;

  FOR i IN 0..(new_room.seat_count - 1) LOOP
    INSERT INTO public.room_seats (room_id, seat_index) VALUES (new_room.id, i);
  END LOOP;

  RETURN new_room;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_room(text, text, text, text, integer, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_room(text, text, text, text, integer, text) TO authenticated;