/*
  Warnings:

  - You are about to drop the column `access_token` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `id_token` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token_expires_in` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `session_state` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `token_type` on the `Account` table. All the data in the column will be lost.
  - Made the column `userId` on table `Todo` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Todo` DROP FOREIGN KEY `Todo_userId_fkey`;

-- AlterTable
ALTER TABLE `Account` DROP COLUMN `access_token`,
    DROP COLUMN `expires_at`,
    DROP COLUMN `id_token`,
    DROP COLUMN `refresh_token`,
    DROP COLUMN `refresh_token_expires_in`,
    DROP COLUMN `session_state`,
    DROP COLUMN `token_type`,
    ADD COLUMN `accessToken` VARCHAR(191) NULL,
    ADD COLUMN `expiresAt` INTEGER NULL,
    ADD COLUMN `idToken` VARCHAR(191) NULL,
    ADD COLUMN `refreshToken` VARCHAR(191) NULL,
    ADD COLUMN `refreshTokenExpiresIn` INTEGER NULL,
    ADD COLUMN `sessionState` VARCHAR(191) NULL,
    ADD COLUMN `tokenType` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Todo` MODIFY `userId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `userAuthId` INTEGER NULL,
    ADD COLUMN `userProfileId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
