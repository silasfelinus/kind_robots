-- AlterTable
ALTER TABLE `Chat` MODIFY `type` ENUM('ToBot', 'BotResponse', 'ToForum', 'ToUser', 'ToCharacter', 'Weirdlandia', 'Dream', 'Reward', 'Story', 'Scenario', 'Character', 'Bot') NOT NULL;
