-- kind-economy/t-007: attribute each chargeable generation to the creator
-- whose object (Bot, Character, Facet, Scenario, PitchSheet, ArtImage,
-- Pack, Reward, or Dream) seeded the interaction, when one seeded it.
--
-- Purely additive, same shape as 20260819120000_split_mana_tokens_resource:
-- every existing ManaTransaction row gets sourceType/sourceId/creatorUserId
-- = NULL and isSelfAttribution = false. No source was ever recorded before
-- this task, so there is nothing to backfill -- fixed going forward, not
-- backward, same call t-006 made for the tokens/mana split.
--
-- FALLBACK: a NULL creatorUserId (no source given, an unresolvable source,
-- or a deleted/system-owned object) means the creator-share of any future
-- RevenueSplit (t-008) falls through to the mission share, per the
-- kind-economy design brief -- never to the platform.
--
-- SELF-ATTRIBUTION: isSelfAttribution records when the resolved creator IS
-- the spending user (a creator generating from their own object). This is
-- data only -- whether a creator earns a share on their own spend is
-- t-021's policy call ("Self-attribution policy"), not decided by this
-- migration or by server/utils/manaAttribution.ts.
--
-- No FK on sourceId (polymorphic -- see Grant.subjectId's identical
-- unenforced-cross-reference precedent) or on creatorUserId (denormalized
-- lookup column, same "plain scalar" treatment this model already gives
-- reversedById).
--
-- IF NOT EXISTS on the ALTER TABLE (DDL is not transactional here, so a
-- re-run after a partial failure must be a no-op on whatever already
-- landed -- same convention as 20260809210000_art_job_attempt_fingerprint
-- and 20260819120000_split_mana_tokens_resource). The two CREATE INDEX
-- statements below can't take IF NOT EXISTS -- MySQL doesn't support that
-- clause on CREATE INDEX -- matching every other index-adding migration in
-- this repo (e.g. 20260726111500_add_pack_model).

ALTER TABLE `ManaTransaction`
  ADD COLUMN IF NOT EXISTS `sourceType` ENUM('BOT', 'CHARACTER', 'FACET', 'SCENARIO', 'PITCH', 'ART', 'PACK', 'REWARD', 'DREAM') NULL,
  ADD COLUMN IF NOT EXISTS `sourceId` INT NULL,
  ADD COLUMN IF NOT EXISTS `creatorUserId` INT NULL,
  ADD COLUMN IF NOT EXISTS `isSelfAttribution` BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX `ManaTransaction_creatorUserId_idx` ON `ManaTransaction`(`creatorUserId`);
CREATE INDEX `ManaTransaction_sourceType_sourceId_idx` ON `ManaTransaction`(`sourceType`, `sourceId`);
