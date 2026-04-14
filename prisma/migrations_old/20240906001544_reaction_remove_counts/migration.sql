/*
  Warnings:

  - You are about to drop the column `boos` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `claps` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `hates` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `loves` on the `Reaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Reaction` DROP COLUMN `boos`,
    DROP COLUMN `claps`,
    DROP COLUMN `hates`,
    DROP COLUMN `loves`;
