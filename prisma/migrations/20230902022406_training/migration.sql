-- CreateTable
CREATE TABLE `TrainingData` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `label` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `TrainingData_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrainingLine` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role` ENUM('SYSTEM', 'USER', 'ASSISTANT', 'ADMIN', 'GUEST', 'BOT', 'DESIGNER') NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `trainingDataId` INTEGER NULL,

    UNIQUE INDEX `TrainingLine_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_BotToTrainingData` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_BotToTrainingData_AB_unique`(`A`, `B`),
    INDEX `_BotToTrainingData_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TrainingLine` ADD CONSTRAINT `TrainingLine_trainingDataId_fkey` FOREIGN KEY (`trainingDataId`) REFERENCES `TrainingData`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BotToTrainingData` ADD CONSTRAINT `_BotToTrainingData_A_fkey` FOREIGN KEY (`A`) REFERENCES `Bot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BotToTrainingData` ADD CONSTRAINT `_BotToTrainingData_B_fkey` FOREIGN KEY (`B`) REFERENCES `TrainingData`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
