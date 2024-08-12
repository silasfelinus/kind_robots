// server/api/galleries/random/index.get.ts
import { defineEventHandler } from 'h3'
import { randomGallery } from '..' // Adjusted import path to match file structure

export default defineEventHandler(async () => {
  try {
    const gallery = await randomGallery()

    if (!gallery || !gallery.name) {
      return { success: false, message: 'No galleries available.' }
    }

    return { success: true, galleryName: gallery.name }
  }
  catch (error: unknown) {
    return {
      success: false,
      message: 'Failed to fetch a random gallery name.',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})
