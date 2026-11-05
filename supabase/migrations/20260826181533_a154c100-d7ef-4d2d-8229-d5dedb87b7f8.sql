-- FRIENDSHIPS -------------------------------------------------------------
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  is_bff boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT friendships_status_check CHECK (status IN ('pending','accepted','declined')),
  CONSTRAINT friendships_not_self CHECK (requester_id <> addressee_id),
  UNIQUE (requester_id, addressee_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friendships_select_own" ON public.friendships
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "friendships_insert_own" ON public.friendships
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid() AND addressee_id <> auth.uid() AND status = 'pending');

CREATE POLICY "friendships_update_participant" ON public.friendships
  FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid())
  WITH CHECK (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "friendships_delete_participant" ON public.friendships
  FOR DELETE TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX friendships_addressee_idx ON public.friendships (addressee_id, status);
CREATE INDEX friendships_requester_idx ON public.friendships (requester_id, status);

-- DIRECT MESSAGES ----------------------------------------------------------
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  content text NOT NULL,
  is_mention boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT direct_messages_content_len CHECK (char_length(content) BETWEEN 1 AND 2000),
  CONSTRAINT direct_messages_not_self CHECK (sender_id <> recipient_id)
);

GRANT SELECT, INSERT, UPDATE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dm_select_participant" ON public.direct_messages
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "dm_insert_own" ON public.direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND recipient_id <> auth.uid());

CREATE POLICY "dm_update_recipient" ON public.direct_messages
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE INDEX direct_messages_pair_idx ON public.direct_messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX direct_messages_inbox_idx ON public.direct_messages (recipient_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;

-- GAMES CATALOG ------------------------------------------------------------
CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🎮',
  gradient text NOT NULL DEFAULT 'from-sky-400 to-blue-500',
  tag text,
  description text NOT NULL DEFAULT '',
  min_players integer NOT NULL DEFAULT 2,
  max_players integer NOT NULL DEFAULT 12,
  is_wide boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.games TO authenticated;
GRANT ALL ON public.games TO service_role;

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "games_select" ON public.games
  FOR SELECT TO authenticated USING (is_active);

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.games (slug, name, emoji, gradient, tag, description, min_players, max_players, is_wide, sort_order) VALUES
  ('whos-the-spy','Who''s the Spy','🕵️','from-sky-400 to-blue-500',NULL,'Everyone gets a word except the spy. Talk, bluff and vote out the odd one.',4,12,true,1),
  ('paint-to-hide','Paint to Hide','🎨','from-amber-400 to-orange-500','New','Paint your hiding spot and see who spots you first.',3,10,true,2),
  ('tricksters-cafe','Trickster''s Cafe','🐊','from-amber-700 to-rose-800',NULL,'Serve orders, dodge the crocodile and keep your cafe alive.',2,8,false,3),
  ('hide-and-seek','Hide And Seek','🚪','from-teal-400 to-cyan-500',NULL,'Classic hide and seek with room voice chat.',3,10,false,4),
  ('space-werewolf','Space Werewolf','🐺','from-violet-500 to-indigo-600',NULL,'Crew versus werewolf deduction in deep space.',5,12,false,5),
  ('oh-my-card','Oh My Card','🃏','from-lime-400 to-green-500',NULL,'Fast card duels with power-up combos.',2,6,false,6),
  ('ludo','Ludo','🎲','from-purple-500 to-fuchsia-600',NULL,'The classic four-player board race.',2,4,false,7),
  ('guess-my-drawing','Guess My Drawing','✏️','from-emerald-400 to-green-600',NULL,'Draw the word while the room guesses out loud.',3,10,false,8),
  ('mic-grab','Mic Grab','🎤','from-rose-500 to-pink-600',NULL,'Grab the mic and finish the line before time runs out.',3,9,false,9),
  ('crazy-alpaca','Crazy Alpaca','🦙','from-lime-500 to-emerald-500',NULL,'Race your alpaca through chaotic obstacle runs.',2,8,false,10),
  ('jackaroo','Jackaroo','🀄','from-yellow-400 to-amber-500',NULL,'Board and card strategy for teams of two.',4,4,false,11),
  ('survival-challenge','Survival Challenge','🎪','from-orange-700 to-amber-800',NULL,'Survive escalating mini-rounds until one player is left.',4,12,false,12),
  ('video-room','Video Room','📺','from-indigo-400 to-violet-500',NULL,'Watch a video together and chat with the whole room.',2,12,false,13),
  ('bingo','Bingo','🔢','from-violet-400 to-purple-600','Free Power-ups','Mark your card as numbers drop live in the room.',2,50,false,14);