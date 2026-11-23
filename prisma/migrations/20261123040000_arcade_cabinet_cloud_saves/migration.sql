-- Additive, private cross-device arcade save. Existing device saves are untouched.
CREATE TABLE `ArcadeCabinetSave` (
  `userId` INTEGER NOT NULL,
  `gameSlug` VARCHAR(40) NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `revision` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`userId`, `gameSlug`),
  CONSTRAINT `ArcadeCabinetSave_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
