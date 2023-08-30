-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `Gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
