/*
  Warnings:

  - You are about to drop the column `isNsfw` on the `ChatRoom` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `ChatRoom` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `ChatRoom` DROP COLUMN `isNsfw`,
    ADD COLUMN `nsfw` BOOLEAN NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ChatRoom_id_key` ON `ChatRoom`(`id`);
