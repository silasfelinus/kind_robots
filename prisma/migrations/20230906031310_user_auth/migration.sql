/*
  Warnings:

  - A unique constraint covering the columns `[userAuthId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `UserAuth` DROP FOREIGN KEY `UserAuth_userId_fkey`;

-- AlterTable
ALTER TABLE `UserAuth` MODIFY `userId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_userAuthId_key` ON `User`(`userAuthId`);

-- AddForeignKey
ALTER TABLE `UserAuth` ADD CONSTRAINT `UserAuth_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
