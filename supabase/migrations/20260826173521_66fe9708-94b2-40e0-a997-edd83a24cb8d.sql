CREATE OR REPLACE FUNCTION public.send_gift(_room_id uuid, _receiver_id uuid, _gift_id uuid, _quantity integer DEFAULT 1)
RETURNS public.gift_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sender UUID := auth.uid();
  _price BIGINT;
  _total BIGINT;
  _row public.gift_events;
BEGIN
  IF _sender IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _quantity IS NULL OR _quantity < 1 OR _quantity > 99 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;

  SELECT price INTO _price FROM public.gifts WHERE id = _gift_id;
  IF _price IS NULL THEN RAISE EXCEPTION 'Gift not found'; END IF;
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

  RETURN _row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_gift(uuid, uuid, uuid, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.send_gift(uuid, uuid, uuid, integer) TO authenticated;