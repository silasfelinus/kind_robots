-- AlterTable
ALTER TABLE `ChatExchange` MODIFY `userPrompt` VARCHAR(2000) NOT NULL,
    MODIFY `botResponse` VARCHAR(2000) NOT NULL;
