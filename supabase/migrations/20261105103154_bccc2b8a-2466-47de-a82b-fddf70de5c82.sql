CREATE OR REPLACE FUNCTION public.send_red_packet(_room_id uuid, _amount bigint, _packet_count integer DEFAULT 5, _message text DEFAULT 'Lucky Red Packet'::text)
 RETURNS red_packets LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _balance bigint;
  _row public.red_packets;
  _live boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount < 100 THEN RAISE EXCEPTION 'Minimum red packet is 100 coins'; END IF;
  IF _packet_count < 1 OR _packet_count > 50 THEN RAISE EXCEPTION 'Invalid packet count'; END IF;
  SELECT is_live INTO _live FROM public.rooms WHERE id = _room_id;
  IF _live IS NULL THEN RAISE EXCEPTION 'Room not found'; END IF;
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
  -- Server-wide banner only while the room is live; otherwise only inside the room.
  PERFORM public.log_fx(_room_id, _uid, 'red_packet',
    CASE WHEN _live THEN 'global' ELSE 'room' END,
    'rp:' || _row.id::text, NULL, NULL, '🧧', _amount, NULL);
  RETURN _row;
END;
$function$;