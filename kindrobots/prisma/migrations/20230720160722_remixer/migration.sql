/*
  Warnings:

  - The values [ARTMAKER,ARTREMIXER,ARTDESIGNER] on the enum `Bot_BotType` will be removed. If these variants are still used in the database, this will fail.
  - The values [ARTMAKER,ARTREMIXER,ARTDESIGNER] on the enum `Bot_BotType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Bot` MODIFY `BotType` ENUM('CHATBOT', 'RAPBOT', 'CODEBOT', 'PRODUCTBOT', 'FORTUNEBOT', 'PROMPTMAKER', 'ARTBOT', 'ARTMIXER', 'ARTEDITOR', 'STORYTELLER', 'QUESTMASTER', 'GAMESMASTER', 'PROJECTMANAGER') NOT NULL DEFAULT 'CHATBOT';

-- AlterTable
ALTER TABLE `BotInput` MODIFY `BotType` ENUM('CHATBOT', 'RAPBOT', 'CODEBOT', 'PRODUCTBOT', 'FORTUNEBOT', 'PROMPTMAKER', 'ARTBOT', 'ARTMIXER', 'ARTEDITOR', 'STORYTELLER', 'QUESTMASTER', 'GAMESMASTER', 'PROJECTMANAGER') NOT NULL;
