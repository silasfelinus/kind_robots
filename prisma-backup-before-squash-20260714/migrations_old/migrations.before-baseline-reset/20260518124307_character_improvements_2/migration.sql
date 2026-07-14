-- DropForeignKey
ALTER TABLE `Butterfly` DROP FOREIGN KEY `Butterfly_characterId_fkey`;

-- AlterTable
ALTER TABLE `Character` DROP COLUMN `goalStat1Name`,
    DROP COLUMN `goalStat1Value`,
    DROP COLUMN `goalStat2Name`,
    DROP COLUMN `goalStat2Value`,
    DROP COLUMN `goalStat3Name`,
    DROP COLUMN `goalStat3Value`,
    DROP COLUMN `goalStat4Name`,
    DROP COLUMN `goalStat4Value`,
    DROP COLUMN `inventory`,
    DROP COLUMN `skills`,
    DROP COLUMN `statName1`,
    DROP COLUMN `statName2`,
    DROP COLUMN `statName3`,
    DROP COLUMN `statName4`,
    DROP COLUMN `statName5`,
    DROP COLUMN `statName6`,
    DROP COLUMN `statValue1`,
    DROP COLUMN `statValue2`,
    DROP COLUMN `statValue3`,
    DROP COLUMN `statValue4`,
    DROP COLUMN `statValue5`,
    DROP COLUMN `statValue6`,
    ADD COLUMN `charm` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    ADD COLUMN `empathy` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    ADD COLUMN `genderIdentity` VARCHAR(256) NULL,
    ADD COLUMN `grace` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    ADD COLUMN `luck` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    ADD COLUMN `might` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    ADD COLUMN `presentation` VARCHAR(764) NULL,
    ADD COLUMN `role` VARCHAR(256) NULL,
    ADD COLUMN `title` VARCHAR(256) NULL,
    ADD COLUMN `wits` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    MODIFY `achievements` VARCHAR(764) NULL,
    MODIFY `experience` INTEGER NOT NULL DEFAULT 0,
    MODIFY `level` INTEGER NOT NULL DEFAULT 1,
    MODIFY `backstory` TEXT NULL,
    MODIFY `quirks` TEXT NULL,
    MODIFY `honorific` VARCHAR(256) NULL DEFAULT 'adventurer',
    MODIFY `imagePath` VARCHAR(764) NULL,
    MODIFY `designer` VARCHAR(256) NULL,
    MODIFY `personality` TEXT NULL;

-- AlterTable: Reward, split safely because rarity used to contain numeric values
ALTER TABLE `Reward`
    ADD COLUMN `rewardType` ENUM('SKILL', 'ITEM', 'TREASURE', 'TITLE', 'POWER', 'STORY') NOT NULL DEFAULT 'ITEM',
    MODIFY `icon` VARCHAR(256) NULL,
    MODIFY `text` TEXT NOT NULL,
    MODIFY `power` TEXT NOT NULL,
    MODIFY `collection` VARCHAR(764) NULL,
    MODIFY `imagePath` VARCHAR(764) NULL;

ALTER TABLE `Reward` MODIFY `rarity` VARCHAR(32) NULL;

UPDATE `Reward`
SET `rarity` = CASE
  WHEN `rarity` IS NULL THEN 'COMMON'
  WHEN UPPER(`rarity`) IN ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') THEN UPPER(`rarity`)
  WHEN CAST(`rarity` AS UNSIGNED) >= 100 THEN 'MYTHIC'
  WHEN CAST(`rarity` AS UNSIGNED) >= 80 THEN 'LEGENDARY'
  WHEN CAST(`rarity` AS UNSIGNED) >= 60 THEN 'EPIC'
  WHEN CAST(`rarity` AS UNSIGNED) >= 40 THEN 'RARE'
  WHEN CAST(`rarity` AS UNSIGNED) >= 20 THEN 'UNCOMMON'
  ELSE 'COMMON'
END;

ALTER TABLE `Reward` MODIFY `rarity` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON';

-- AlterTable
ALTER TABLE `Server` MODIFY `workflowJson` JSON NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `HiddenServers` JSON NULL;

-- CreateIndex
CREATE INDEX `Character_isPublic_idx` ON `Character`(`isPublic`);

-- CreateIndex
CREATE INDEX `Character_isActive_idx` ON `Character`(`isActive`);

-- CreateIndex
CREATE INDEX `Character_name_idx` ON `Character`(`name`);

-- CreateIndex
CREATE INDEX `Reward_rewardType_idx` ON `Reward`(`rewardType`);

-- CreateIndex
CREATE INDEX `Reward_rarity_idx` ON `Reward`(`rarity`);

