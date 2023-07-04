/*
  Warnings:

  - You are about to drop the column `content` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `dateCreated` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `Prompt` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `sender` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Conversation` DROP COLUMN `content`;

-- AlterTable
ALTER TABLE `Message` DROP COLUMN `dateCreated`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `sender` VARCHAR(191) NOT NULL,
    ADD COLUMN `tokenCount` INTEGER NULL,
    ADD COLUMN `type` ENUM('PROMPT', 'RESPONSE', 'IMAGE', 'MASK') NOT NULL;

-- DropTable
DROP TABLE `Prompt`;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
