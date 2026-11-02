-- Additive, account-owned Space Couch alien scrapbook.
-- Existing browser-local data remains untouched and can be merged after login.
CREATE TABLE `SpaceCouchAlienGuide` (
  `userId` INTEGER NOT NULL,
  `data` JSON NOT NULL,
  `version` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`userId`),
  CONSTRAINT `SpaceCouchAlienGuide_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
