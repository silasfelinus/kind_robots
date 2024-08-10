// server/api/galleries/random/index.get.ts
import { defineEventHandler } from 'h3'

import { randomGallery } from './..'

export default defineEventHandler(async () => {
  try {
    const gallery = await randomGallery()

    if (!gallery || !gallery.name) {
      throw new Error(`No galleries available.`)
    }

    return { success: true, galleryName: gallery.name }
  }
  catch (error: any) {
    return {
      success: false,
      message: 'Failed to fetch a random gallery name.',
      error: error.message,
    }
  }
})
