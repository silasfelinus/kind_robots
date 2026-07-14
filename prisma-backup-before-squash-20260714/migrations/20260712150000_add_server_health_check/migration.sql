-- Time-series health/uptime samples for a Server.
--
-- Additive only: one new CREATE TABLE plus a foreign key to Server (cascade on
-- delete). The point-in-time Server.lastStatus/lastCheckedAt are overwritten on
-- every check; this table keeps history so the ArtJob dashboard can show
-- ComfyUI/SD uptime over time. Rows are written by the relay heartbeat
-- (/api/server/heartbeat) and by the browser/server health checks
-- (/api/server/health/[id]).

-- CreateTable
CREATE TABLE `ServerHealthCheck` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `serverId` INTEGER NOT NULL,
    `checkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `ok` BOOLEAN NOT NULL DEFAULT false,
    `latencyMs` INTEGER NULL,
    `source` VARCHAR(32) NOT NULL DEFAULT 'server',
    `note` TEXT NULL,

    INDEX `ServerHealthCheck_serverId_checkedAt_idx`(`serverId`, `checkedAt`),
    INDEX `ServerHealthCheck_checkedAt_idx`(`checkedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ServerHealthCheck` ADD CONSTRAINT `ServerHealthCheck_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `Server`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
