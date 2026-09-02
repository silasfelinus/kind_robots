CREATE TABLE `RainbowDirectoryPreference` (
    `userId` INTEGER NOT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `allowMessages` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`userId`),
    CONSTRAINT `RainbowDirectoryPreference_userId_fkey`
      FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
