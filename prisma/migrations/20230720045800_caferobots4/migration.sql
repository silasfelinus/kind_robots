/*
  Warnings:

  - You are about to drop the column `dislikes` on the `UserReview` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `UserReview` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` MODIFY `avatarImage` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `UserReview` DROP COLUMN `dislikes`,
    DROP COLUMN `likes`,
    ADD COLUMN `isDisliked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isLiked` BOOLEAN NOT NULL DEFAULT false;
