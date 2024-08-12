// /server/api/galleries/index.post.ts
import { defineEventHandler, readBody } from 'h3';
import { addGalleries } from '.';
import { errorHandler } from '../utils/error';
import type { Prisma } from '@prisma/client';

// Define the type for gallery items according to Prisma.GalleryCreateManyInput
type GalleryItem = {
  name: string; // Required
  content?: string; // Optional
  description?: string; // Optional
  mediaId?: string | null; // Optional
  url?: string | null; // Optional
  isMature?: boolean; // Optional
  custodian?: string | null; // Optional
  userId?: number | null; // Ensure this matches Prisma type
  highlightImage?: string | null; // Optional
  imagePaths?: string | null; // Optional
};

// Define GalleryData as an array of GalleryItem
type GalleryData = GalleryItem[];

export default defineEventHandler(async (event) => {
  try {
    // Read and parse gallery data from the request body
    const galleryData: GalleryData = await readBody(event);

    // Validate the format of galleryData
    if (!Array.isArray(galleryData)) {
      return {
        success: false,
        message: 'Expected the gallery data to be an array.',
        error: 'Invalid data format',
        statusCode: 400, // Bad Request
      };
    }

    // Transform galleryData to match Prisma.GalleryCreateManyInput
    const formattedData: Prisma.GalleryCreateManyInput[] = galleryData.map(item => ({
      name: item.name,
      content: item.content || '',
      description: item.description || null,
      mediaId: item.mediaId || null, // Ensure this is a string or null
      url: item.url || null,
      isMature: item.isMature || false,
      custodian: item.custodian || null,
      userId: item.userId !== undefined ? item.userId : null, // Ensure this is a number or null
      highlightImage: item.highlightImage || null,
      imagePaths: item.imagePaths || null,
    }));

    // Add galleries and handle the result
    const result = await addGalleries(formattedData);
    
    return { success: true, ...result };
  } catch (error: unknown) {
    // Use the errorHandler for consistent error handling
    const handledError = errorHandler(error);
    return {
      success: false,
      message: 'Failed to create new galleries.',
      error: handledError.message,
      statusCode: handledError.statusCode || 500,
    };
  }
});
