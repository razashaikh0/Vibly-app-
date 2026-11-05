
REVOKE ALL ON FUNCTION public.send_gift(UUID, UUID, UUID, INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_room(TEXT, TEXT, TEXT, TEXT, INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_room_host(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_gift(UUID, UUID, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_room(TEXT, TEXT, TEXT, TEXT, INT) TO authenticated;
