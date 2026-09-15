-- Add the four embodiment axes to FacetTaxonomy: AGE, BUILD, HAIR, ORIGIN.
--
-- Silas, 2026-09-15: "When we develop a character, say for a dream digest,
-- there are lots of factors that could be switched. Hair color, style, age,
-- gender presentation, body shape, size, racial background, default emotional
-- state."
--
-- The catalog had rich vocabulary for what a character IS (GENRE, SPECIES,
-- OCCUPATION, ARCHETYPE, PERSONALITY) and none at all for what a character
-- LOOKS LIKE. Generators therefore rolled the first set and invented the
-- second unaided, and unaided bodies converge hard. Measured over all 98
-- authored Daily Dream characters: 0% saturated hair colour, 0% long hair,
-- 23.5% mentioned hair at all, 14.3% named an age, 9.2% named a skin tone,
-- and she/her outnumbered he/him 4.3 to 1. The axes the seed plan rolled
-- varied; the axes it did not roll collapsed to a single value each.
--
-- GENDER already existed with 15 rows and was simply never drawn, so it needs
-- no schema change -- only a caller that draws it.
--
-- Deliberately NOT added:
--
--   COMPLEXION / ETHNICITY / RACE  -- a standalone phenotype table read off
--     per character is exactly the shape that tokenizes. ORIGIN carries
--     heritage as CULTURE instead, and a humanoid's complexion is derived
--     from it by the author. This also makes the axis coherent for the
--     non-human characters that dominate this catalog: a walrus can be from
--     a Lisbon-facing trade quarter (culture) but cannot have its people's
--     cheekbones (phenotype).
--
--   MOOD  -- "default emotional state" is already carried by PERSONALITY
--     (207 randomizable rows). MOOD is empty BY POLICY here; the catalog
--     directives migrated narrative tone to THEME and randomStore's `mood`
--     key already points at THEME. Resurrecting it would re-fork a taxonomy
--     this repo deliberately collapsed. The real gap was that PERSONALITY
--     never reached the VISIBLE description, which is an authoring-contract
--     fix, not a schema one.
--
-- EXPAND ONLY. Four values are appended to the enum; nothing is dropped,
-- renamed, or rewritten, and no row changes. The column keeps its NOT NULL
-- DEFAULT 'OTHER'. A build running during the deploy handoff is unaffected:
-- it never writes the new values, and every value it does write is still
-- accepted.
--
-- Hand-authored to match `prisma migrate diff`'s emission for this schema
-- (this sandbox has no MIGRATION_DATABASE_URL / shadow database -- see
-- docs/runbooks/migration-credential-boundary.md). The value order below is
-- facet-catalog.prisma's order, which is what Prisma renders.

ALTER TABLE `FacetProfile`
  MODIFY `taxonomy` ENUM(
    'GENRE',
    'ANIMAL',
    'COLOR',
    'THEME',
    'CORE',
    'MOOD',
    'STYLE',
    'SETTING',
    'ART_DIRECTION',
    'SPECIES',
    'OCCUPATION',
    'ARCHETYPE',
    'ROLE',
    'ALIGNMENT',
    'GENDER',
    'AGE',
    'BUILD',
    'HAIR',
    'ORIGIN',
    'BOT_TYPE',
    'DREAM_TYPE',
    'REWARD_TYPE',
    'RARITY',
    'PERSONALITY',
    'BACKSTORY',
    'QUIRK',
    'MATERIAL',
    'PROMPT_ENHANCEMENT',
    'OTHER'
  ) NOT NULL DEFAULT 'OTHER';
