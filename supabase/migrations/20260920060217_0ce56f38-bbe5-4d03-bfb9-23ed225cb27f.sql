
CREATE TABLE public.game_word_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  civilian_word text NOT NULL,
  spy_word text NOT NULL
);
GRANT SELECT ON public.game_word_pairs TO authenticated;
GRANT ALL ON public.game_word_pairs TO service_role;
ALTER TABLE public.game_word_pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "word pairs readable" ON public.game_word_pairs FOR SELECT TO authenticated USING (true);

INSERT INTO public.game_word_pairs (civilian_word, spy_word) VALUES
('Tea','Coffee'),('Samosa','Kachori'),('Cricket','Baseball'),('Train','Bus'),
('Winter','Autumn'),('Guitar','Sitar'),('Mango','Papaya'),('Doctor','Nurse'),
('Ocean','Lake'),('Pizza','Burger'),('Diamond','Crystal'),('Rain','Snow'),
('Wedding','Engagement'),('Lion','Tiger'),('Camera','Mobile'),('Chess','Ludo'),
('Ice cream','Kulfi'),('Village','Town'),('Painter','Sculptor'),('Moon','Sun');

CREATE TABLE public.game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  game_key text NOT NULL DEFAULT 'spy',
  host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phase text NOT NULL DEFAULT 'lobby',
  round integer NOT NULL DEFAULT 0,
  civilian_word text,
  spy_word text,
  winner text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
GRANT SELECT ON public.game_sessions TO authenticated;
GRANT ALL ON public.game_sessions TO service_role;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions readable" ON public.game_sessions FOR SELECT TO authenticated USING (true);
CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX game_sessions_room_idx ON public.game_sessions(room_id, created_at DESC);

CREATE TABLE public.game_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text,
  word text,
  is_alive boolean NOT NULL DEFAULT true,
  eliminated_round integer,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);
GRANT SELECT ON public.game_players TO authenticated;
GRANT ALL ON public.game_players TO service_role;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players readable" ON public.game_players FOR SELECT TO authenticated USING (true);

CREATE TABLE public.game_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  round integer NOT NULL,
  voter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, round, voter_id)
);
GRANT SELECT ON public.game_votes TO authenticated;
GRANT ALL ON public.game_votes TO service_role;
ALTER TABLE public.game_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes readable" ON public.game_votes FOR SELECT TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_votes;

CREATE OR REPLACE FUNCTION public.open_game_session(_room_id uuid)
RETURNS public.game_sessions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _row public.game_sessions;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _row FROM public.game_sessions
    WHERE room_id = _room_id AND phase <> 'ended' ORDER BY created_at DESC LIMIT 1;
  IF _row.id IS NOT NULL THEN
    INSERT INTO public.game_players(session_id, user_id) VALUES (_row.id, _uid)
      ON CONFLICT (session_id, user_id) DO NOTHING;
    RETURN _row;
  END IF;
  INSERT INTO public.game_sessions(room_id, host_id) VALUES (_room_id, _uid) RETURNING * INTO _row;
  INSERT INTO public.game_players(session_id, user_id) VALUES (_row.id, _uid);
  RETURN _row;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.open_game_session(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.open_game_session(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.start_game_session(_session_id uuid)
RETURNS public.game_sessions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.game_sessions;
  _pair public.game_word_pairs;
  _count integer;
  _spy uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _row FROM public.game_sessions WHERE id = _session_id FOR UPDATE;
  IF _row.id IS NULL THEN RAISE EXCEPTION 'Game not found'; END IF;
  IF _row.host_id <> _uid THEN RAISE EXCEPTION 'Only the host can start'; END IF;
  IF _row.phase <> 'lobby' THEN RAISE EXCEPTION 'Game already started'; END IF;

  SELECT count(*) INTO _count FROM public.game_players WHERE session_id = _session_id;
  IF _count < 3 THEN RAISE EXCEPTION 'Need at least 3 players'; END IF;

  SELECT * INTO _pair FROM public.game_word_pairs ORDER BY random() LIMIT 1;
  SELECT user_id INTO _spy FROM public.game_players WHERE session_id = _session_id ORDER BY random() LIMIT 1;

  UPDATE public.game_players
    SET role = CASE WHEN user_id = _spy THEN 'spy' ELSE 'civilian' END,
        word = CASE WHEN user_id = _spy THEN _pair.spy_word ELSE _pair.civilian_word END,
        is_alive = true, eliminated_round = NULL
    WHERE session_id = _session_id;

  UPDATE public.game_sessions
    SET phase = 'describe', round = 1, civilian_word = _pair.civilian_word,
        spy_word = _pair.spy_word, winner = NULL, ended_at = NULL
    WHERE id = _session_id RETURNING * INTO _row;
  RETURN _row;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.start_game_session(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.start_game_session(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_game_phase(_session_id uuid, _phase text)
RETURNS public.game_sessions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _row public.game_sessions;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _phase NOT IN ('describe','vote','ended') THEN RAISE EXCEPTION 'Invalid phase'; END IF;
  SELECT * INTO _row FROM public.game_sessions WHERE id = _session_id;
  IF _row.host_id <> _uid THEN RAISE EXCEPTION 'Only the host can do this'; END IF;
  UPDATE public.game_sessions
    SET phase = _phase, ended_at = CASE WHEN _phase = 'ended' THEN now() ELSE NULL END
    WHERE id = _session_id RETURNING * INTO _row;
  RETURN _row;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_game_phase(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_game_phase(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.cast_game_vote(_session_id uuid, _target_id uuid)
RETURNS public.game_sessions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.game_sessions;
  _alive integer; _votes integer; _out uuid; _top integer; _tied integer;
  _spy_out boolean; _alive_after integer; _spies_left integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _row FROM public.game_sessions WHERE id = _session_id FOR UPDATE;
  IF _row.id IS NULL OR _row.phase <> 'vote' THEN RAISE EXCEPTION 'Voting is not open'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.game_players
                 WHERE session_id = _session_id AND user_id = _uid AND is_alive) THEN
    RAISE EXCEPTION 'You are not in this round';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.game_players
                 WHERE session_id = _session_id AND user_id = _target_id AND is_alive) THEN
    RAISE EXCEPTION 'Invalid target';
  END IF;

  INSERT INTO public.game_votes(session_id, round, voter_id, target_id)
  VALUES (_session_id, _row.round, _uid, _target_id)
  ON CONFLICT (session_id, round, voter_id) DO UPDATE SET target_id = EXCLUDED.target_id;

  SELECT count(*) INTO _alive FROM public.game_players WHERE session_id = _session_id AND is_alive;
  SELECT count(*) INTO _votes FROM public.game_votes WHERE session_id = _session_id AND round = _row.round;
  IF _votes < _alive THEN RETURN _row; END IF;

  SELECT target_id, count(*) INTO _out, _top FROM public.game_votes
    WHERE session_id = _session_id AND round = _row.round
    GROUP BY target_id ORDER BY count(*) DESC LIMIT 1;
  SELECT count(*) INTO _tied FROM (
    SELECT target_id FROM public.game_votes
      WHERE session_id = _session_id AND round = _row.round
      GROUP BY target_id HAVING count(*) = _top) t;

  IF _tied > 1 THEN
    DELETE FROM public.game_votes WHERE session_id = _session_id AND round = _row.round;
    UPDATE public.game_sessions SET round = round + 1, phase = 'describe'
      WHERE id = _session_id RETURNING * INTO _row;
    RETURN _row;
  END IF;

  UPDATE public.game_players SET is_alive = false, eliminated_round = _row.round
    WHERE session_id = _session_id AND user_id = _out;

  SELECT role = 'spy' INTO _spy_out FROM public.game_players
    WHERE session_id = _session_id AND user_id = _out;
  SELECT count(*) INTO _alive_after FROM public.game_players WHERE session_id = _session_id AND is_alive;
  SELECT count(*) INTO _spies_left FROM public.game_players
    WHERE session_id = _session_id AND is_alive AND role = 'spy';

  IF _spy_out THEN
    UPDATE public.game_sessions SET phase = 'ended', winner = 'civilians', ended_at = now()
      WHERE id = _session_id RETURNING * INTO _row;
  ELSIF _spies_left > 0 AND _alive_after <= 2 THEN
    UPDATE public.game_sessions SET phase = 'ended', winner = 'spy', ended_at = now()
      WHERE id = _session_id RETURNING * INTO _row;
  ELSE
    UPDATE public.game_sessions SET round = round + 1, phase = 'describe'
      WHERE id = _session_id RETURNING * INTO _row;
  END IF;
  RETURN _row;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.cast_game_vote(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cast_game_vote(uuid, uuid) TO authenticated;
