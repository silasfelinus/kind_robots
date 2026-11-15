CREATE TABLE `TutorialNote` (
  `path` VARCHAR(180) NOT NULL,
  `draftText` TEXT NOT NULL,
  `publishedText` TEXT NULL,
  `publishedAt` DATETIME(3) NULL,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedById` INTEGER NULL,
  PRIMARY KEY (`path`),
  INDEX `TutorialNote_updatedAt_idx`(`updatedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
