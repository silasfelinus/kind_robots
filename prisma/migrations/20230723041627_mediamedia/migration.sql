/*
  Warnings:

  - You are about to alter the column `BotType` on the `Bot` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(6))` to `Enum(EnumId(0))`.
  - You are about to drop the `ExifData` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `ExifData` DROP FOREIGN KEY `ExifData_MediaId_fkey`;

-- AlterTable
ALTER TABLE `Bot` MODIFY `BotType` ENUM('CHATBOT', 'ARTBOT') NOT NULL DEFAULT 'CHATBOT';

-- AlterTable
ALTER TABLE `Media` ADD COLUMN `cfg` VARCHAR(191) NULL,
    ADD COLUMN `clipData` VARCHAR(191) NULL,
    ADD COLUMN `deepboroData` VARCHAR(191) NULL,
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `modelHash` VARCHAR(191) NULL,
    ADD COLUMN `modelName` VARCHAR(191) NULL,
    ADD COLUMN `negTemplate` VARCHAR(191) NULL,
    ADD COLUMN `negative` VARCHAR(191) NULL,
    ADD COLUMN `sampler` VARCHAR(191) NULL,
    ADD COLUMN `seed` INTEGER NULL,
    ADD COLUMN `size` VARCHAR(191) NULL,
    ADD COLUMN `steps` INTEGER NULL,
    ADD COLUMN `template` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `ExifData`;
