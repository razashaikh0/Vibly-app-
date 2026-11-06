-- Families are created with the requested 25,000 coin cost.
CREATE OR REPLACE FUNCTION public.create_family(
  _name TEXT,
  _badge TEXT DEFAULT NULL,
  _intro TEXT DEFAULT NULL
)
RETURNS public.families
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  _uid UUID := auth.uid();
  _family public.families;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF COALESCE(length(trim(_name)), 0) < 3 THEN
    RAISE EXCEPTION 'Family name must be at least 3 characters';
  END IF;
  IF EXISTS (SELECT 1 FROM public.family_members WHERE user_id = _uid) THEN
    RAISE EXCEPTION 'Leave your current family before creating another one';
  END IF;

  UPDATE public.profiles
  SET coins = coins - 25000, updated_at = now()
  WHERE id = _uid AND coins >= 25000;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not enough coins — family creation costs 25,000 coins';
  END IF;

  INSERT INTO public.families (name, badge, intro, leader_id)
  VALUES (trim(_name), NULLIF(trim(_badge), ''), NULLIF(trim(_intro), ''), _uid)
  RETURNING * INTO _family;

  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (_family.id, _uid, 'leader');

  RETURN _family;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_family(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_family(TEXT, TEXT, TEXT) TO authenticated;
