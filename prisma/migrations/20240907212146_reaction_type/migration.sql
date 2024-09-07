-- AlterTable
ALTER TABLE `Reaction` ADD COLUMN `ReactionType` ENUM('Component', 'Art', 'Channel', 'User', 'Pitch') NOT NULL DEFAULT 'Channel';
