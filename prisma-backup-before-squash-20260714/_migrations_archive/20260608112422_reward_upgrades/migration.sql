/*
  Warnings:

  - You are about to drop the column `label` on the `Reward` table. All the data in the column will be lost.
  - You are about to drop the column `power` on the `Reward` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `Reward` table. All the data in the column will be lost.
  - The values [TREASURE,TITLE,STORY] on the enum `Reward_rewardType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Reward` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Reward` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Reward` DROP COLUMN `label`,
    DROP COLUMN `power`,
    DROP COLUMN `text`,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `effect` TEXT NULL,
    ADD COLUMN `flavorText` VARCHAR(512) NULL,
    ADD COLUMN `name` VARCHAR(256) NOT NULL,
    ADD COLUMN `slug` VARCHAR(256) NULL,
    MODIFY `rewardType` ENUM('SKILL', 'ITEM', 'POWER', 'PET', 'MAGIC', 'FAVOR') NOT NULL DEFAULT 'ITEM';

-- CreateIndex
CREATE UNIQUE INDEX `Reward_slug_key` ON `Reward`(`slug`);

-- CreateIndex
CREATE INDEX `Reward_slug_idx` ON `Reward`(`slug`);
