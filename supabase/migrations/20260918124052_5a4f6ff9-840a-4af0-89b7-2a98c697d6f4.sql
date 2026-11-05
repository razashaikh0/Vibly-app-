REVOKE EXECUTE ON FUNCTION public.award_room_activity(uuid, uuid, bigint, bigint) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.log_fx(uuid, uuid, text, text, text, text, text, text, bigint, integer) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.fx_rate_ok(uuid, text, integer, integer) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.on_gift_event_activity() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.on_room_message_activity() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.create_room(text, text, text, text, integer) FROM authenticated, anon;