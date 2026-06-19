/*
  Warnings:

  - The values [A111] on the enum `Server_serverType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Server` MODIFY `serverType` ENUM('A1111', 'COMFY', 'OPENAI', 'ANTHROPIC', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM';
