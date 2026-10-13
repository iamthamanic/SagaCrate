-- #sagatree-eradicate-legacy-ids — Hard-cut: remove SagaDrive schema aliases.
-- After this migration only sagatree_* identifiers remain in the live schema.
-- Historical migrations 001–078 are intentionally left unchanged.

-- ---------------------------------------------------------------------------
-- 1) Backfill canonical profile + ruleset
-- ---------------------------------------------------------------------------
UPDATE public.characters
SET sagatree_profile = COALESCE(sagatree_profile, sagadrive_profile)
WHERE sagatree_profile IS NULL
  AND sagadrive_profile IS NOT NULL;

UPDATE public.characters
SET ruleset_key = 'sagatree-core'
WHERE ruleset_key = 'sagadrive-core';

UPDATE public.character_presets
SET ruleset_key = 'sagatree-core'
WHERE ruleset_key = 'sagadrive-core';

-- Rewrite preset version snapshots: sagadrive_profile → sagatree_profile,
-- ruleset_key sagadrive-core → sagatree-core.
UPDATE public.character_presets
SET versions = (
  SELECT COALESCE(
    jsonb_agg(
      CASE
        WHEN jsonb_typeof(elem) = 'object' AND (elem ? 'snapshot') THEN
          elem || jsonb_build_object(
            'snapshot',
            (
              SELECT
                CASE
                  WHEN snap ? 'sagadrive_profile' AND NOT (snap ? 'sagatree_profile') THEN
                    (snap - 'sagadrive_profile')
                      || jsonb_build_object('sagatree_profile', snap -> 'sagadrive_profile')
                  WHEN snap ? 'sagadrive_profile' THEN
                    snap - 'sagadrive_profile'
                  ELSE snap
                END
                || CASE
                     WHEN coalesce(snap ->> 'ruleset_key', '') = 'sagadrive-core' THEN
                       jsonb_build_object('ruleset_key', 'sagatree-core')
                     ELSE '{}'::jsonb
                   END
              FROM (SELECT elem -> 'snapshot' AS snap) s
            )
          )
        ELSE elem
      END
      ORDER BY ordinality
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(versions) WITH ORDINALITY AS t(elem, ordinality)
)
WHERE versions::text LIKE '%sagadrive%';

-- ---------------------------------------------------------------------------
-- 2) Drop profile sync trigger / function
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_sagatree_sync_profile_columns ON public.characters;
DROP FUNCTION IF EXISTS public.sagatree_sync_profile_columns();

-- ---------------------------------------------------------------------------
-- 3) Sheet-complete guard: sagatree_profile + sagatree-core only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_character_sheet_status_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ruleset TEXT := COALESCE(NEW.ruleset_key, 'sagatree-core');
  v_profile JSONB := NEW.sagatree_profile;
BEGIN
  IF NEW.sheet_status IS DISTINCT FROM 'complete' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND COALESCE(OLD.sheet_status, 'incomplete') = 'complete'
  THEN
    RETURN NEW;
  END IF;

  IF NEW.name IS NULL OR length(btrim(NEW.name)) < 1
     OR NEW.class IS NULL OR length(btrim(NEW.class)) < 1
     OR NEW.race IS NULL OR length(btrim(NEW.race)) < 1
     OR NEW.level IS NULL OR NEW.level < 1 OR NEW.level > 20
  THEN
    RAISE EXCEPTION 'Unvollständiger Charakter kann nicht als complete markiert werden'
      USING ERRCODE = '22023';
  END IF;

  IF v_ruleset = 'sagatree-core'
     AND (
       v_profile IS NULL
       OR NEW.attributes IS NULL
       OR NEW.skills IS NULL
     )
  THEN
    RAISE EXCEPTION 'SagaTree-Bögen brauchen Profil, Attribute und Skills für complete'
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_character_sheet_status_complete ON public.characters;
CREATE TRIGGER trg_enforce_character_sheet_status_complete
  BEFORE INSERT OR UPDATE OF sheet_status, name, class, race, level, ruleset_key,
    sagatree_profile, attributes, skills
  ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_character_sheet_status_complete();

-- ---------------------------------------------------------------------------
-- 4) Drop legacy sagadrive_* SQL wrappers
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.generate_sagadrive_public_id(TEXT);
DROP FUNCTION IF EXISTS public.sagadrive_empty_adventure_runtime();
DROP FUNCTION IF EXISTS public.sagadrive_ensure_adventure_v2(JSONB);
DROP FUNCTION IF EXISTS public.sagadrive_ensure_saga_draft(UUID);
DROP FUNCTION IF EXISTS public.sagadrive_find_session_consequence(UUID, TEXT);
DROP FUNCTION IF EXISTS public.sagadrive_project_saga_definition_payload(JSONB, BOOLEAN);
DROP FUNCTION IF EXISTS public.sagadrive_project_shared_adventure(JSONB, BOOLEAN);
DROP FUNCTION IF EXISTS public.sagadrive_resolve_adventure_command(UUID, JSONB, BOOLEAN, JSONB);

-- ---------------------------------------------------------------------------
-- 5) Drop sagadrive_profile column
-- ---------------------------------------------------------------------------
ALTER TABLE public.characters
  DROP COLUMN IF EXISTS sagadrive_profile;

COMMENT ON COLUMN public.characters.sagatree_profile IS
  'SagaTree Core character profile (canonical).';

-- ---------------------------------------------------------------------------
-- 6) Tighten ruleset CHECKs (no sagadrive-core)
-- ---------------------------------------------------------------------------
ALTER TABLE public.characters DROP CONSTRAINT IF EXISTS characters_ruleset_key_check;
ALTER TABLE public.characters
  ADD CONSTRAINT characters_ruleset_key_check
  CHECK (ruleset_key = ANY (ARRAY['sagatree-core'::text, 'dnd-5.5e'::text]));

ALTER TABLE public.character_presets DROP CONSTRAINT IF EXISTS character_presets_ruleset_key_check;
ALTER TABLE public.character_presets
  ADD CONSTRAINT character_presets_ruleset_key_check
  CHECK (ruleset_key = ANY (ARRAY['sagatree-core'::text, 'dnd-5.5e'::text]));

ALTER TABLE public.characters ALTER COLUMN ruleset_key SET DEFAULT 'sagatree-core';
ALTER TABLE public.character_presets ALTER COLUMN ruleset_key SET DEFAULT 'sagatree-core';
