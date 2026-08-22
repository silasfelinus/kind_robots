-- The database-driven Butterfly project was retired long ago: there is no
-- Butterfly model, no /api/butterfl* route, and no relation on Reaction. What
-- survived is a dangling `Reaction.butterflyId` column plus a BUTTERFLY value
-- in the reactionCategory enum, which together still read as a live reaction
-- target. utils/karmaRefTypes.ts already documents the column as an orphan and
-- deliberately excludes it, so nothing in the app can write or read one.
--
-- The surviving butterflies are the decorative swarm (stores/butterflyStore.ts,
-- stores/helpers/butterfly*.ts, components/screenfx/*, components/butterfly/*).
-- Those are pure client-side animation -- no fetch, no API, no Prisma -- and
-- are deliberately untouched here.
--
-- Follows the shape of 20260812040500_retire_component_schema.

-- `butterflyId` carries only an INDEX named `Reaction_butterflyId_fkey`; there
-- is no FOREIGN KEY constraint to drop. The name is Prisma's index-naming
-- convention, not evidence of one -- verified against the squashed migration,
-- which declares the column as a bare `INTEGER NULL` with an INDEX and no
-- CONSTRAINT. This is why the column outlived the Butterfly table at all: a
-- real FK would have blocked the drop and forced the cleanup then.

-- Any row still carrying one is already unreachable: reactionTargetOf() in
-- server/utils/reactionVisibility.ts iterates KARMA_REF_TARGET_COLUMNS, which
-- has never included butterflyId, so such a row resolves to no target and
-- cannot be read back through any route.
DELETE FROM `Reaction`
WHERE `butterflyId` IS NOT NULL
   OR `reactionCategory` = 'BUTTERFLY';

ALTER TABLE `Reaction`
  DROP INDEX `Reaction_butterflyId_fkey`,
  DROP COLUMN `butterflyId`;

-- MariaDB has no DROP VALUE for an enum, so narrowing it means restating the
-- whole list. The DELETE above must run first: MODIFY would otherwise have to
-- coerce any surviving BUTTERFLY row to '' under a non-strict sql_mode.
--
-- COMPONENT is likewise dead -- retired in 20260812040500_retire_component_schema,
-- which dropped the column but left the enum value behind. It is kept here
-- rather than removed, to hold this migration to the one target it is about.
-- Removing it is a clean follow-up. COMPOSITION and POST are the same shape,
-- left over from 20260717113000_remove_code_and_composition and
-- 20260718200000_remove_social_publishing.
ALTER TABLE `Reaction`
  MODIFY COLUMN `reactionCategory` ENUM(
    'ART_IMAGE',
    'ART_COLLECTION',
    'BOT',
    'CHALLENGE_SUBMISSION',
    'CHARACTER',
    'CHAT_EXCHANGE',
    'COMPONENT',
    'COMPOSITION',
    'DREAM',
    'FACET',
    'PROJECT',
    'MESSAGE',
    'POST',
    'PROMPT',
    'RESOURCE',
    'REWARD',
    'SCENARIO',
    'THEME'
  ) NOT NULL DEFAULT 'ART_IMAGE';
