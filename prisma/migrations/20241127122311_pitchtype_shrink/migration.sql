/*
  Warnings:

  - The values [BOT,INSPIRATION,TEXTPITCH] on the enum `Pitch_PitchType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Pitch` MODIFY `PitchType` ENUM('ARTPITCH', 'BRAINSTORM', 'ARTGALLERY', 'RANDOMLIST', 'TITLE') NOT NULL DEFAULT 'ARTPITCH';
