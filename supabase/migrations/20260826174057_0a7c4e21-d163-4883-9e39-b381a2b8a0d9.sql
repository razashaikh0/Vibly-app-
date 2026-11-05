CREATE OR REPLACE FUNCTION public.vip_level_for(_coins bigint)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN _coins >= 500000 THEN 5
    WHEN _coins >= 200000 THEN 4
    WHEN _coins >= 80000 THEN 3
    WHEN _coins >= 30000 THEN 2
    WHEN _coins >= 10000 THEN 1
    ELSE 0 END
$$;