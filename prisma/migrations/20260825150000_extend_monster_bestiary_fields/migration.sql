-- cthulhuquarium/t-042: four fish-bible fields discovered, while mapping all
-- 151 species for t-008's seed script, to have nowhere to land -- plus one
-- column (`behavior`) that was documented as holding the wrong axis.
--
-- Purely additive: three new nullable columns and one new enum value. No
-- DROP, no rename, no existing column touched (`behavior`'s own doc comment
-- is corrected in schema.prisma, not its type or data). See
-- projects/cthulhuquarium/roadmap.yaml t-042 for the full field-by-field
-- reasoning; short version:
--
--   depth       -- the bible's own 1-5 "how deep into the game" integer,
--                  distinct from the `tier` Rarity column already on this
--                  table. Lowest-priority of the four; nothing reads it yet.
--   dietRole    -- the bible's `diet_role` (predator/prey).
--   schoolRole  -- the bible's `school_role` (school/anchor/solitary).
--                  `behavior` was previously mis-documented as holding
--                  these two; it actually holds the bible's own `behavior`
--                  (movement mode), a different field entirely.
--   SECRET      -- the bible allows evolution_kind: growth | breeding |
--                  secret, but EvolutionKind only had GROWTH and BREEDING.
--                  Mapping secret onto BREEDING would be a lie -- SCHEMA.md
--                  defines breeding as needing two parents and secret as a
--                  hidden individual-stat roll, different mechanics that
--                  t-029 implements differently.
--
-- Hand-authored to match `prisma migrate diff`'s emission for this schema
-- (this sandbox has no MIGRATION_DATABASE_URL / local shadow database --
-- see docs/runbooks/migration-credential-boundary.md).

-- AlterTable
ALTER TABLE `Monster`
    ADD COLUMN `depth` INTEGER NULL,
    ADD COLUMN `dietRole` VARCHAR(255) NULL,
    ADD COLUMN `schoolRole` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `Monster`
    MODIFY `evolutionKind` ENUM('GROWTH', 'BREEDING', 'SECRET') NULL;
