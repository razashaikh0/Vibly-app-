
ALTER TABLE public.rooms DROP CONSTRAINT rooms_host_id_fkey,
  ADD CONSTRAINT rooms_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.room_seats DROP CONSTRAINT room_seats_user_id_fkey,
  ADD CONSTRAINT room_seats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.room_messages DROP CONSTRAINT room_messages_user_id_fkey,
  ADD CONSTRAINT room_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.gift_events DROP CONSTRAINT gift_events_sender_id_fkey,
  ADD CONSTRAINT gift_events_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.gift_events DROP CONSTRAINT gift_events_receiver_id_fkey,
  ADD CONSTRAINT gift_events_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
