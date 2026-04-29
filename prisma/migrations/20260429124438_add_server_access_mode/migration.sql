-- AlterTable
ALTER TABLE `Server` ADD COLUMN `accessMode` ENUM('LOCAL', 'TAILSCALE', 'PUBLIC_PROTECTED', 'PUBLIC_API_KEY', 'PUBLIC_OIDC', 'PUBLIC_UNPROTECTED') NOT NULL DEFAULT 'LOCAL',
    ADD COLUMN `allowBrowserRequests` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isPrivateNetwork` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `requiresClientSideCheck` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `Server_accessMode_idx` ON `Server`(`accessMode`);
