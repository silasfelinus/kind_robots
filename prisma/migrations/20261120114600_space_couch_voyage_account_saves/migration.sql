-- Additive, private per-account Space Couch voyage backup. Existing v1
-- localStorage saves, completed-run archives and alien guides stay intact.
CREATE TABLE `SpaceCouchVoyageSave` (
  `userId` INTEGER NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `revision` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`userId`),
  CONSTRAINT `SpaceCouchVoyageSave_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
