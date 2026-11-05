CREATE TABLE IF NOT EXISTS public.red_packets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount bigint NOT NULL,
  packet_count integer NOT NULL DEFAULT 5,
  message text NOT NULL DEFAULT 'Lucky Red Packet',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.red_packets TO authenticated;
GRANT ALL ON public.red_packets TO service_role;

ALTER TABLE public.red_packets ENABLE ROW LEVEL SECURITY;

CREATE POLICY red_packets_select ON public.red_packets
  FOR SELECT TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.red_packets;

CREATE OR REPLACE FUNCTION public.send_red_packet(_room_id uuid, _amount bigint, _packet_count integer DEFAULT 5, _message text DEFAULT 'Lucky Red Packet')
RETURNS public.red_packets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  RETURN _row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_red_packet(uuid, bigint, integer, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.send_red_packet(uuid, bigint, integer, text) TO authenticated;