-- CreateIndex
CREATE INDEX `ArtImage_imagePath_idx` ON `ArtImage`(`imagePath`(255));

-- CreateIndex
CREATE INDEX `ArtImage_fileName_idx` ON `ArtImage`(`fileName`(191));
