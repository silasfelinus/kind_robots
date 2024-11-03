/*
  Warnings:

  - You are about to alter the column `name` on the `Gallery` table. The data in that column could be lost. The data in that column will be cast from `VarChar(764)` to `VarChar(256)`.
  - You are about to alter the column `url` on the `Gallery` table. The data in that column could be lost. The data in that column will be cast from `VarChar(764)` to `VarChar(256)`.
  - You are about to alter the column `custodian` on the `Gallery` table. The data in that column could be lost. The data in that column will be cast from `VarChar(764)` to `VarChar(256)`.
  - You are about to alter the column `highlightImage` on the `Gallery` table. The data in that column could be lost. The data in that column will be cast from `VarChar(764)` to `VarChar(256)`.

*/
-- DropIndex
DROP INDEX `Gallery_id_key` ON `Gallery`;

-- AlterTable
ALTER TABLE `Gallery` MODIFY `name` VARCHAR(256) NOT NULL,
    MODIFY `url` VARCHAR(256) NULL,
    MODIFY `custodian` VARCHAR(256) NULL,
    MODIFY `highlightImage` VARCHAR(256) NULL;
