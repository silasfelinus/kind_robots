-- First-launch intro dismissal, persisted on the User record (not
-- localStorage) so it follows the account across devices. NULL means the
-- walkthrough has not been dismissed yet; a timestamp means it has, and the
-- user can still re-open the walkthrough from the dashboard at any time.
--
-- SAFETY: additive nullable column only; existing Users are untouched.

ALTER TABLE `User` ADD COLUMN `introDismissedAt` DATETIME(3) NULL;
