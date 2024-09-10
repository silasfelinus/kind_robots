-- Step 1: Add the `reactionType` column with a default value
ALTER TABLE `Reaction`
  ADD COLUMN `reactionType` ENUM('LOVED', 'CLAPPED', 'BOOED', 'HATED', 'NEUTRAL', 'FLAGGED') NOT NULL DEFAULT 'NEUTRAL';

-- Step 2: Transfer the old data into the new `reactionType` column
UPDATE `Reaction`
SET `reactionType` = 'LOVED'
WHERE `isLoved` = TRUE;

UPDATE `Reaction`
SET `reactionType` = 'CLAPPED'
WHERE `isClapped` = TRUE;

UPDATE `Reaction`
SET `reactionType` = 'BOOED'
WHERE `isBooed` = TRUE;

UPDATE `Reaction`
SET `reactionType` = 'HATED'
WHERE `isHated` = TRUE;

-- Optional: Set any rows where no specific reaction was set to 'NEUTRAL'
UPDATE `Reaction`
SET `reactionType` = 'NEUTRAL'
WHERE `reactionType` IS NULL;

-- Step 3: Drop the old columns
ALTER TABLE `Reaction`
  DROP COLUMN `isBooed`,
  DROP COLUMN `isClapped`,
  DROP COLUMN `isHated`,
  DROP COLUMN `isLoved`,
  DROP COLUMN `reaction`,
  DROP COLUMN `title`;

-- Step 4: Modify the `ReactionCategory` enum if necessary
ALTER TABLE `Reaction`
  MODIFY `ReactionCategory` ENUM('ART', 'PITCH', 'COMPONENT', 'CHANNEL') NOT NULL DEFAULT 'CHANNEL';
