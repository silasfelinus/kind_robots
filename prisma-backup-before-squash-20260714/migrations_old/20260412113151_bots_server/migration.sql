-- AlterTable
ALTER TABLE `Bot` ADD COLUMN `serverId` INTEGER NULL,
    ADD COLUMN `serverName` VARCHAR(256) NULL;

-- CreateIndex
CREATE INDEX `Bot_serverId_fkey` ON `Bot`(`serverId`);

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `Server`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
