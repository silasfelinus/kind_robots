// server/api/galleries/random/count/count.get.ts
import { defineEventHandler } from 'h3';
import prisma from '../../../utils/prisma';
import { getGalleryImages } from '../..';

interface ImageResponse {
  success: boolean;
  images?: string[];
  message?: string;
  error?: string;
}

export default defineEventHandler(async (event): Promise<ImageResponse> => {
  try {
    const count = Number(event.context.params?.count);

    // Validate the count parameter
    if (isNaN(count) || count <= 0) {
      return {
        success: false,
        message: 'Invalid count parameter. It must be a positive number.',
        error: 'Invalid count',
      };
    }

    // Fetch gallery IDs with imagePaths
    const initialGalleryIDs = await prisma.gallery.findMany({
      where: {
        imagePaths: {
          not: null,
        },
      },
      select: { id: true },
    });

    if (initialGalleryIDs.length === 0) {
      return {
        success: false,
        message: 'No galleries found with imagePaths.',
        error: 'No galleries',
      };
    }

    // Shuffle the gallery IDs
    let remainingGalleryIDs = initialGalleryIDs.sort(() => 0.5 - Math.random()).map((g) => g.id);

    const selectedImages: string[] = [];

    // Retry until we have enough images or run out of galleries
    while (selectedImages.length < count && remainingGalleryIDs.length > 0) {
      const batchSize = Math.min(remainingGalleryIDs.length, count - selectedImages.length);
      const selectedBatchIDs = remainingGalleryIDs.slice(0, batchSize);
      remainingGalleryIDs = remainingGalleryIDs.slice(batchSize); // Reduce the list of remaining galleries

      // Fetch galleries using the selected IDs
      const galleries = await prisma.gallery.findMany({
        where: {
          id: { in: selectedBatchIDs },
        },
      });

      // Extract images from each gallery
      const imagesPromises = galleries.map((gallery) =>
        getGalleryImages(gallery.id),
      );
      const allImagesArrays = await Promise.all(imagesPromises);

      // Extract one image path from each gallery and add to the selectedImages
      allImagesArrays.forEach((galleryImages) => {
        if (galleryImages.length > 0) {
          const randomImage = galleryImages[Math.floor(Math.random() * galleryImages.length)];
          selectedImages.push(randomImage);
        }
      });
    }

    if (selectedImages.length < count) {
      return {
        success: false,
        message: `Could not fetch the required number of random images. Requested: ${count}, Received: ${selectedImages.length}`,
        error: 'Insufficient images',
      };
    }

    return { success: true, images: selectedImages };
  } catch (error: unknown) {
    return {
      success: false,
      message: 'Failed to fetch random images.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});
