CREATE TABLE public.families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  badge text,
  leader_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  announcement text,
  intro text,
  avatar_url text,
  level int NOT NULL DEFAULT 1,
  activeness bigint NOT NULL DEFAULT 0,
  member_limit int NOT NULL DEFAULT 50,
  region text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  points int NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.families TO authenticated;
GRANT SELECT ON public.families TO anon;
GRANT ALL ON public.families TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT SELECT ON public.family_members TO anon;
GRANT ALL ON public.family_members TO service_role;

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "families_read" ON public.families FOR SELECT USING (true);
CREATE POLICY "families_create" ON public.families FOR INSERT TO authenticated WITH CHECK (leader_id = auth.uid());
CREATE POLICY "families_update_leader" ON public.families FOR UPDATE TO authenticated USING (leader_id = auth.uid()) WITH CHECK (leader_id = auth.uid());
CREATE POLICY "families_delete_leader" ON public.families FOR DELETE TO authenticated USING (leader_id = auth.uid());

CREATE POLICY "family_members_read" ON public.family_members FOR SELECT USING (true);
CREATE POLICY "family_members_join" ON public.family_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "family_members_leave" ON public.family_members FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "family_members_update_self" ON public.family_members FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX family_members_family_idx ON public.family_members(family_id);
