-- CreateTable
CREATE TABLE `ChatExchange` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `botId` INTEGER NOT NULL,
    `botName` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `userPrompt` VARCHAR(191) NOT NULL,
    `botResponse` VARCHAR(191) NOT NULL,
    `liked` BOOLEAN NULL,
    `hated` BOOLEAN NULL,
    `loved` BOOLEAN NULL,
    `flagged` BOOLEAN NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChatExchange` ADD CONSTRAINT `ChatExchange_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatExchange` ADD CONSTRAINT `ChatExchange_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
