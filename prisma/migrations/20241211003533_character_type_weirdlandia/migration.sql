-- AlterTable
ALTER TABLE `Chat` MODIFY `type` ENUM('ToBot', 'BotResponse', 'ToForum', 'ToUser', 'ToCharacter', 'Weirdlandia') NOT NULL;
