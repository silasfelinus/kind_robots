/*
  Warnings:

  - You are about to drop the `UserAuth` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[apiKey]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `UserAuth` DROP FOREIGN KEY `UserAuth_username_fkey`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `apiKey` VARCHAR(191) NULL,
    ADD COLUMN `password` VARCHAR(191) NULL,
    ADD COLUMN `spotifyAccessToken` VARCHAR(191) NULL,
    ADD COLUMN `spotifyID` VARCHAR(191) NULL,
    ADD COLUMN `spotifyRefreshToken` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `UserAuth`;

-- CreateIndex
CREATE UNIQUE INDEX `User_apiKey_key` ON `User`(`apiKey`);
