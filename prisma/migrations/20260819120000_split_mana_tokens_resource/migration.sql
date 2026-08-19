-- kind-economy/t-006: split the single `User.mana` balance into two
-- distinct resources per Silas's 2026-08-19 model:
--   - mana: the free, given-away resource. Never purchased, never
--     withdrawable, and it never becomes tokens.
--   - tokens: the paid resource, credited only by real money (PURCHASE /
--     SUBSCRIPTION_GRANT reasons going forward). Spendable on generation,
--     but NOT itself the creator-payout balance.
--   - earnedTokens: the creator-payout-eligible balance, credited from
--     someone else's paid (tokens) spend. This migration only adds the
--     column -- no crediting logic is wired by this task (see t-007/t-008).
--
-- Also adds `ManaTransaction.resource` so every ledger row records which
-- pool it actually affected, making the tokens-vs-mana funding source of a
-- spend auditable (needed by t-007/t-008 to gate creator-crediting on
-- token-funded spends only).
--
-- SAFETY: purely additive. No existing column is dropped, renamed, or
-- rewritten, and no existing `User.mana` value changes.
--
-- DELIBERATE NON-BACKFILL: this migration does NOT attempt to retroactively
-- split any user's current `mana` balance into "how much was really free
-- vs really purchased". Past ManaTransaction rows never recorded which pool
-- funded them (that's exactly the bug this task fixes going forward, not
-- backward), so that split is not reliably reconstructable. Every existing
-- user's current `mana` value is left exactly as-is (zero behavior change
-- for users who never bought anything), and `tokens`/`earnedTokens` start
-- at 0 for everyone -- including users who previously paid real money via
-- Stripe. See the PR description for the full reasoning; this is flagged
-- there as a known, deliberate limitation, not something to silently
-- rediscover later.
--
-- IF NOT EXISTS on every DDL statement: DDL is not transactional here, so a
-- re-run after a partial failure must be a no-op on whatever already landed
-- (same convention as 20260809210000_art_job_attempt_fingerprint).

-- AlterTable: new paid + earned balances on User, both defaulting to 0.
ALTER TABLE `User`
  ADD COLUMN IF NOT EXISTS `tokens` INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `earnedTokens` INT NOT NULL DEFAULT 0;

-- AlterTable: which resource pool a given ManaTransaction row affected.
-- Defaults to 'MANA' so every historical row -- which, before this task,
-- only ever touched the single `mana` balance -- reads correctly with no
-- backfill UPDATE needed.
ALTER TABLE `ManaTransaction`
  ADD COLUMN IF NOT EXISTS `resource` ENUM('MANA', 'TOKENS', 'EARNED') NOT NULL DEFAULT 'MANA';
