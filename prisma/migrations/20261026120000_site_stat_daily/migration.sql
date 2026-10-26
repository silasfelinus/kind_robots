-- Additive first-party site counters (daily aggregates only). New table only;
-- nothing the running build reads is touched.
-- CreateTable
CREATE TABLE `SiteStatDaily` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `day` DATE NOT NULL,
    `kind` VARCHAR(16) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SiteStatDaily_kind_day_idx`(`kind`, `day`),
    UNIQUE INDEX `SiteStatDaily_day_kind_key_key`(`day`, `kind`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
