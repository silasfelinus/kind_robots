-- CreateTable
CREATE TABLE `_ChannelToPlayer` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ChannelToPlayer_AB_unique`(`A`, `B`),
    INDEX `_ChannelToPlayer_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ChannelToPlayer` ADD CONSTRAINT `_ChannelToPlayer_A_fkey` FOREIGN KEY (`A`) REFERENCES `Channel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ChannelToPlayer` ADD CONSTRAINT `_ChannelToPlayer_B_fkey` FOREIGN KEY (`B`) REFERENCES `Player`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
