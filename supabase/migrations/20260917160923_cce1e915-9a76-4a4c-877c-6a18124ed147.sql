
REVOKE ALL ON FUNCTION public.award_room_activity(UUID, UUID, BIGINT, BIGINT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_room_message_activity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_gift_event_activity() FROM PUBLIC, anon, authenticated;
