/*
  Warnings:

  - You are about to drop the `Resonate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Resonate` DROP FOREIGN KEY `Resonate_userId_fkey`;

-- DropTable
DROP TABLE `Resonate`;

-- CreateTable
CREATE TABLE `Resonance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(255) NOT NULL,
    `description` VARCHAR(512) NULL,
    `imagePath` VARCHAR(764) NOT NULL,
    `audioPath` VARCHAR(764) NULL,
    `userId` INTEGER NULL DEFAULT 10,
    `chapterData` LONGTEXT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isPreset` BOOLEAN NOT NULL DEFAULT false,
    `genres` VARCHAR(512) NULL,

    INDEX `Resonance_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArtToResonance` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtToResonance_AB_unique`(`A`, `B`),
    INDEX `_ArtToResonance_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CharacterToResonance` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CharacterToResonance_AB_unique`(`A`, `B`),
    INDEX `_CharacterToResonance_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ResonanceToScenario` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ResonanceToScenario_AB_unique`(`A`, `B`),
    INDEX `_ResonanceToScenario_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Resonance` ADD CONSTRAINT `Resonance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtToResonance` ADD CONSTRAINT `_ArtToResonance_A_fkey` FOREIGN KEY (`A`) REFERENCES `Art`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtToResonance` ADD CONSTRAINT `_ArtToResonance_B_fkey` FOREIGN KEY (`B`) REFERENCES `Resonance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CharacterToResonance` ADD CONSTRAINT `_CharacterToResonance_A_fkey` FOREIGN KEY (`A`) REFERENCES `Character`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CharacterToResonance` ADD CONSTRAINT `_CharacterToResonance_B_fkey` FOREIGN KEY (`B`) REFERENCES `Resonance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ResonanceToScenario` ADD CONSTRAINT `_ResonanceToScenario_A_fkey` FOREIGN KEY (`A`) REFERENCES `Resonance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ResonanceToScenario` ADD CONSTRAINT `_ResonanceToScenario_B_fkey` FOREIGN KEY (`B`) REFERENCES `Scenario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
