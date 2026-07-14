/*
  Warnings:

  - You are about to drop the `Blueprint` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Hybrid` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pantheon` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Resonance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ArtToResonance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BlueprintToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CharacterToResonance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ResonanceToScenario` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Blueprint` DROP FOREIGN KEY `Blueprint_coverArtId_fkey`;

-- DropForeignKey
ALTER TABLE `Blueprint` DROP FOREIGN KEY `Blueprint_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Hybrid` DROP FOREIGN KEY `Hybrid_artId_fkey`;

-- DropForeignKey
ALTER TABLE `Hybrid` DROP FOREIGN KEY `Hybrid_artImageId_fkey`;

-- DropForeignKey
ALTER TABLE `Hybrid` DROP FOREIGN KEY `Hybrid_promptId_fkey`;

-- DropForeignKey
ALTER TABLE `Hybrid` DROP FOREIGN KEY `Hybrid_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Pantheon` DROP FOREIGN KEY `Pantheon_chatId_fkey`;

-- DropForeignKey
ALTER TABLE `Pantheon` DROP FOREIGN KEY `Pantheon_coverArtImageId_fkey`;

-- DropForeignKey
ALTER TABLE `Pantheon` DROP FOREIGN KEY `Pantheon_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Resonance` DROP FOREIGN KEY `Resonance_userId_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtToResonance` DROP FOREIGN KEY `_ArtToResonance_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtToResonance` DROP FOREIGN KEY `_ArtToResonance_B_fkey`;

-- DropForeignKey
ALTER TABLE `_BlueprintToTag` DROP FOREIGN KEY `_BlueprintToTag_A_fkey`;

-- DropForeignKey
ALTER TABLE `_BlueprintToTag` DROP FOREIGN KEY `_BlueprintToTag_B_fkey`;

-- DropForeignKey
ALTER TABLE `_CharacterToResonance` DROP FOREIGN KEY `_CharacterToResonance_A_fkey`;

-- DropForeignKey
ALTER TABLE `_CharacterToResonance` DROP FOREIGN KEY `_CharacterToResonance_B_fkey`;

-- DropForeignKey
ALTER TABLE `_ResonanceToScenario` DROP FOREIGN KEY `_ResonanceToScenario_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ResonanceToScenario` DROP FOREIGN KEY `_ResonanceToScenario_B_fkey`;

-- DropTable
DROP TABLE `Blueprint`;

-- DropTable
DROP TABLE `Hybrid`;

-- DropTable
DROP TABLE `Pantheon`;

-- DropTable
DROP TABLE `Resonance`;

-- DropTable
DROP TABLE `_ArtToResonance`;

-- DropTable
DROP TABLE `_BlueprintToTag`;

-- DropTable
DROP TABLE `_CharacterToResonance`;

-- DropTable
DROP TABLE `_ResonanceToScenario`;
