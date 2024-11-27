/*
  Warnings:

  - The values [ARTGALLERY] on the enum `Pitch_PitchType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Pitch` MODIFY `PitchType` ENUM('ARTPITCH', 'BRAINSTORM', 'WEIRDLANDIA', 'RANDOMLIST', 'TITLE') NOT NULL DEFAULT 'ARTPITCH';
