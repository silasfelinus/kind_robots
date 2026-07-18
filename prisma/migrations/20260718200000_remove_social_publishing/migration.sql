-- Remove the abandoned SocialPost/SocialTarget publishing prototype.
-- POST reactions had no target foreign key and only existed for that prototype.
DELETE FROM `Reaction` WHERE `reactionCategory` = 'POST';

DROP TABLE IF EXISTS `SocialTarget`;
DROP TABLE IF EXISTS `SocialPost`;

ALTER TABLE `Reaction`
  MODIFY `reactionCategory` ENUM(
    'ART_IMAGE',
    'ART_COLLECTION',
    'BOT',
    'BUTTERFLY',
    'CHALLENGE_SUBMISSION',
    'CHARACTER',
    'CHAT_EXCHANGE',
    'COMPONENT',
    'DREAM',
    'FACET',
    'PROJECT',
    'MESSAGE',
    'PROMPT',
    'RESOURCE',
    'REWARD',
    'SCENARIO',
    'THEME'
  ) NOT NULL DEFAULT 'ART_IMAGE';
