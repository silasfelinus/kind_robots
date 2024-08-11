/*
  Warnings:

  - You are about to alter the column `checkpoint` on the `Art` table. The data in that column could be lost. The data in that column will be cast from `VarChar(764)` to `VarChar(256)`.

*/
-- AlterTable
ALTER TABLE `Art` MODIFY `checkpoint` VARCHAR(256) NULL;
