-- AlterTable
ALTER TABLE `Bot` MODIFY `BotType` ENUM('PROMPTBOT', 'CHATBOT', 'ARTBOT') NOT NULL DEFAULT 'CHATBOT';
