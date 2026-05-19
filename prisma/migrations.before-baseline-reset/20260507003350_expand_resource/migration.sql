-- AlterTable
ALTER TABLE `Resource` ADD COLUMN `supportedServer` ENUM('SD15', 'SDXL', 'COMFY', 'FLUX', 'KONTEXT', 'GENERIC', 'UNKNOWN', 'OPENAI') NOT NULL DEFAULT 'SDXL';

-- CreateTable
CREATE TABLE `_ResourceToServer` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ResourceToServer_AB_unique`(`A`, `B`),
    INDEX `_ResourceToServer_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ResourceToServer` ADD CONSTRAINT `_ResourceToServer_A_fkey` FOREIGN KEY (`A`) REFERENCES `Resource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ResourceToServer` ADD CONSTRAINT `_ResourceToServer_B_fkey` FOREIGN KEY (`B`) REFERENCES `Server`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
