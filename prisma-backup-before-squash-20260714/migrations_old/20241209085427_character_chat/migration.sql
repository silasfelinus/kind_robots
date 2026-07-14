-- AlterTable
ALTER TABLE `Chat` ADD COLUMN `characterId` INTEGER NULL,
    MODIFY `type` ENUM('ToBot', 'BotResponse', 'ToForum', 'ToUser', 'ToCharacter') NOT NULL;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
