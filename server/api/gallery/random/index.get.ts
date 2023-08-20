// server/api/gallery/random/index.get.ts

import { randomGallery } from './..'

export default defineEventHandler(async () => {
  try {
    const gallery = await randomGallery()

    if (!gallery) {
      throw new Error(`No galleries available.`)
    }

    return { success: true, gallery }
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to fetch a random gallery.',
      error: error.message
    }
  }
})
