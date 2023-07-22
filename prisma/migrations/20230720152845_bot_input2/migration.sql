/*
  Warnings:

  - You are about to alter the column `temperature` on the `BotInput` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Double`.

*/
-- AlterTable
ALTER TABLE `BotInput` MODIFY `temperature` DOUBLE NULL;
