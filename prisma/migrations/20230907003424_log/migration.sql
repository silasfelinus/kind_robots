/*
  Warnings:

  - The primary key for the `UserAuth` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `UserAuth` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `UserAuth` table. All the data in the column will be lost.
  - Made the column `password` on table `UserAuth` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `UserAuth` DROP FOREIGN KEY `UserAuth_userId_fkey`;

-- DropIndex
DROP INDEX `UserAuth_id_key` ON `UserAuth`;

-- AlterTable
ALTER TABLE `UserAuth` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    DROP COLUMN `userId`,
    MODIFY `password` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`username`);

-- CreateTable
CREATE TABLE `Log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `message` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `username` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserAuth` ADD CONSTRAINT `UserAuth_username_fkey` FOREIGN KEY (`username`) REFERENCES `User`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;
