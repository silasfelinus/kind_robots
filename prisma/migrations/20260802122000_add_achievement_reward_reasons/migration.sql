ALTER TABLE `KarmaTransaction`
  MODIFY `reason` ENUM(
    'REACTION_GIVEN',
    'REACTION_RECEIVED',
    'CONTENT_CREATED_PUBLIC',
    'CONTENT_SHARED',
    'GENERATION_COMPLETED',
    'BOUNTY_POSTED',
    'BOUNTY_FULFILLED',
    'BOUNTY_CLAIMED',
    'REFERRAL_SIGNUP',
    'REFERRAL_CUT',
    'ADMIN_ADJUSTMENT',
    'ACHIEVEMENT_CONFIRMED'
  ) NOT NULL;

ALTER TABLE `ManaTransaction`
  MODIFY `reason` ENUM(
    'SIGNUP_BONUS',
    'CYCLE_REFILL',
    'GENERATION_ART',
    'GENERATION_TEXT',
    'SOCIAL_REACTION',
    'SOCIAL_SHARE',
    'BOUNTY_CREATE',
    'BOUNTY_REWARD',
    'PURCHASE',
    'SUBSCRIPTION_GRANT',
    'ADMIN_REFUND',
    'KARMA_CONVERSION',
    'ADJUSTMENT',
    'ACHIEVEMENT_CONFIRMED'
  ) NOT NULL;

-- Re-open the two confirmations made by the sole alpha user while the client
-- balance patch was failing. The records remain earned; the next acknowledgement
-- will pass through the new idempotent ledger transaction.
UPDATE `AchievementRecord` AS record
JOIN `Achievement` AS achievement
  ON achievement.id = record.achievementId
SET record.isConfirmed = false
WHERE record.userId = 1
  AND record.isConfirmed = true
  AND achievement.triggerCode IN ('theme', 'achievement-tour');
