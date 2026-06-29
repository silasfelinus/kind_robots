-- Art queue + bounty fields on Prompt
ALTER TABLE `Prompt`
  ADD COLUMN `serverId`      INT          NULL,
  ADD COLUMN `artStatus`     ENUM('PENDING','QUEUED','GENERATING','DONE','FAILED','CANCELLED') NULL,
  ADD COLUMN `batchId`       VARCHAR(191) NULL,
  ADD COLUMN `batchIndex`    INT          NULL,
  ADD COLUMN `queuePosition` INT          NULL,
  ADD COLUMN `startedAt`     DATETIME(3)  NULL,
  ADD COLUMN `completedAt`   DATETIME(3)  NULL,
  ADD COLUMN `errorMessage`  LONGTEXT     NULL,
  ADD COLUMN `notifiedAt`    DATETIME(3)  NULL,
  ADD COLUMN `isBounty`      BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN `bountyStatus`  ENUM('OPEN','CLAIMED','FULFILLED','EXPIRED','CANCELLED') NULL,
  ADD COLUMN `claimerId`     INT          NULL;

-- Indexes on Prompt
CREATE INDEX `Prompt_serverId_idx`   ON `Prompt`(`serverId`);
CREATE INDEX `Prompt_claimerId_idx`  ON `Prompt`(`claimerId`);
CREATE INDEX `Prompt_artStatus_idx`  ON `Prompt`(`artStatus`);
CREATE INDEX `Prompt_batchId_idx`    ON `Prompt`(`batchId`);

-- Foreign keys on Prompt
ALTER TABLE `Prompt`
  ADD CONSTRAINT `Prompt_serverId_fkey`
    FOREIGN KEY (`serverId`) REFERENCES `Server`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Prompt_claimerId_fkey`
    FOREIGN KEY (`claimerId`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- referralCode on User
ALTER TABLE `User`
  ADD COLUMN `referralCode` VARCHAR(64) NULL;

CREATE UNIQUE INDEX `User_referralCode_key` ON `User`(`referralCode`);

-- KarmaTransaction table
CREATE TABLE `KarmaTransaction` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `userId`       INT          NOT NULL,
  `amount`       INT          NOT NULL,
  `reason`       ENUM('REACTION_GIVEN','REACTION_RECEIVED','CONTENT_CREATED_PUBLIC','CONTENT_SHARED','GENERATION_COMPLETED','BOUNTY_POSTED','BOUNTY_FULFILLED','BOUNTY_CLAIMED','REFERRAL_SIGNUP','REFERRAL_CUT','ADMIN_ADJUSTMENT') NOT NULL,
  `balanceAfter` INT          NOT NULL,
  `refId`        VARCHAR(191) NULL,
  `note`         LONGTEXT     NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `KarmaTransaction_userId_createdAt_idx` ON `KarmaTransaction`(`userId`, `createdAt`);

ALTER TABLE `KarmaTransaction`
  ADD CONSTRAINT `KarmaTransaction_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Referral table
CREATE TABLE `Referral` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `referrerId` INT          NOT NULL,
  `referredId` INT          NOT NULL,
  `codeUsed`   VARCHAR(64)  NULL,
  `cutRate`    DOUBLE       NOT NULL DEFAULT 0.05,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `Referral_referredId_key` ON `Referral`(`referredId`);
CREATE INDEX `Referral_referrerId_idx`        ON `Referral`(`referrerId`);

ALTER TABLE `Referral`
  ADD CONSTRAINT `Referral_referrerId_fkey`
    FOREIGN KEY (`referrerId`) REFERENCES `User`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `Referral_referredId_fkey`
    FOREIGN KEY (`referredId`) REFERENCES `User`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
