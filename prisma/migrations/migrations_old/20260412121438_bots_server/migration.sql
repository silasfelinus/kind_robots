-- AlterTable
ALTER TABLE `Art` MODIFY `serverName` VARCHAR(256) NULL,
    MODIFY `serverUrl` VARCHAR(764) NULL;

-- AlterTable
ALTER TABLE `Chat` ADD COLUMN `serverId` INTEGER NULL,
    ADD COLUMN `serverName` VARCHAR(256) NULL;

-- CreateIndex
CREATE INDEX `Chat_serverId_fkey` ON `Chat`(`serverId`);

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `Server`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
