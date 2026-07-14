-- AlterTable
ALTER TABLE `Dream` ADD COLUMN `allowReviews` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `cardPath` TEXT NULL,
    ADD COLUMN `heroPath` TEXT NULL,
    ADD COLUMN `liveUrl` VARCHAR(512) NULL,
    ADD COLUMN `projectStatus` ENUM('ACTIVE', 'PAUSED', 'DONE', 'ARCHIVED') NULL,
    ADD COLUMN `repoUrl` VARCHAR(512) NULL,
    MODIFY `dreamType` ENUM('ART', 'BRAINSTORM', 'PROMPTBOT', 'NARRATOR', 'CHARACTER', 'PROJECT', 'REWARD', 'SCENARIO', 'LOCATION', 'PITCH', 'GENRE') NOT NULL DEFAULT 'PITCH';

-- CreateIndex
CREATE INDEX `Dream_projectStatus_idx` ON `Dream`(`projectStatus`);
