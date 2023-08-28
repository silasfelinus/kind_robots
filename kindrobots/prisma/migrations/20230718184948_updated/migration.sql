/*
  Warnings:

  - You are about to drop the column `channel` on the `Message` table. All the data in the column will be lost.
  - The values [ADMIN,GUEST] on the enum `User_role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Message` DROP COLUMN `channel`;

-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('SYSTEM', 'USER', 'ASSISTANT') NOT NULL DEFAULT 'USER';
