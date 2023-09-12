-- AlterTable
ALTER TABLE `UserAuth` ADD COLUMN `spotifyAccessToken` VARCHAR(191) NULL,
    ADD COLUMN `spotifyID` VARCHAR(191) NULL,
    ADD COLUMN `spotifyRefreshToken` VARCHAR(191) NULL;
