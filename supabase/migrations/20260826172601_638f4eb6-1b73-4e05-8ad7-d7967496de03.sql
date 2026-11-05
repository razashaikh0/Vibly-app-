CREATE TABLE public.task_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_key text NOT NULL,
  category text NOT NULL,
  activeness integer NOT NULL DEFAULT 0,
  coins_awarded bigint NOT NULL DEFAULT 0,
  claim_day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX task_claims_daily_unique ON public.task_claims(user_id, task_key, claim_day);
GRANT SELECT, INSERT ON public.task_claims TO authenticated;
GRANT ALL ON public.task_claims TO service_role;
ALTER TABLE public.task_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY task_claims_select_own ON public.task_claims FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY task_claims_insert_own ON public.task_claims FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.guard_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  is_cp boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guard_relations_not_self CHECK (guardian_id <> target_id),
  CONSTRAINT guard_relations_unique UNIQUE (guardian_id, target_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guard_relations TO authenticated;
GRANT ALL ON public.guard_relations TO service_role;
ALTER TABLE public.guard_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY guard_relations_select ON public.guard_relations FOR SELECT TO authenticated USING (guardian_id = auth.uid() OR target_id = auth.uid());
CREATE POLICY guard_relations_insert_own ON public.guard_relations FOR INSERT TO authenticated WITH CHECK (guardian_id = auth.uid());
CREATE POLICY guard_relations_update_own ON public.guard_relations FOR UPDATE TO authenticated USING (guardian_id = auth.uid()) WITH CHECK (guardian_id = auth.uid());
CREATE POLICY guard_relations_delete_own ON public.guard_relations FOR DELETE TO authenticated USING (guardian_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_guard_relations_updated_at BEFORE UPDATE ON public.guard_relations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.claim_task(_task_key text, _category text, _activeness integer, _coins bigint)
RETURNS public.task_claims
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.task_claims;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _activeness < 0 OR _activeness > 50 OR _coins < 0 OR _coins > 500 THEN
    RAISE EXCEPTION 'Invalid reward';
  END IF;

  INSERT INTO public.task_claims(user_id, task_key, category, activeness, coins_awarded)
  VALUES (_uid, _task_key, _category, _activeness, _coins)
  RETURNING * INTO _row;

  IF _coins > 0 THEN
    UPDATE public.profiles SET coins = coins + _coins, updated_at = now() WHERE id = _uid;
  END IF;

  RETURN _row;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.claim_task(text, text, integer, bigint) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_task(text, text, integer, bigint) TO authenticated;

CREATE OR REPLACE FUNCTION public.add_guard_points(_target_id uuid, _points integer)
RETURNS public.guard_relations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.guard_relations;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _target_id = _uid THEN RAISE EXCEPTION 'Cannot protect yourself'; END IF;
  IF _points < 1 OR _points > 500 THEN RAISE EXCEPTION 'Invalid points'; END IF;

  INSERT INTO public.guard_relations(guardian_id, target_id, points)
  VALUES (_uid, _target_id, _points)
  ON CONFLICT (guardian_id, target_id)
  DO UPDATE SET points = public.guard_relations.points + EXCLUDED.points, updated_at = now()
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.add_guard_points(uuid, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.add_guard_points(uuid, integer) TO authenticated;