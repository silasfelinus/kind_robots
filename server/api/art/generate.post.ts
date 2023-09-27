import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import { saveImage } from '../utils/saveImage'
import { fetchGalleryByName, createGallery } from '../galleries'
import { generateImage, createArt } from '.'

// Define types for better type safety
type RequestData = {
  prompt?: string
  user?: string
  galleryName?: string
}

type GenerateImageResponse = {
  images: string[]
  error?: string
}

export default defineEventHandler(async (event) => {
  let user: string | undefined // Declare user here
  let prompt: string | undefined // Declare prompt here

  try {
    const requestData: RequestData = await readBody(event)
    prompt = requestData.prompt // Assign value here
    user = requestData.user // Assign value here
    const galleryName = requestData.galleryName || 'cafefred'

    // Validate prompt and user
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid or missing prompt')
    }

    if (!user || typeof user !== 'string') {
      throw new Error('Invalid or missing user')
    }

    // Generate image with modeller
    const response: GenerateImageResponse = await generateImage(prompt, user)

    // Log the response for debugging
    console.log('Response from generateImage:', JSON.stringify(response, null, 2))

    // Declare base64Image variable here
    let base64Image: string

    // Validate the image generation response
    if (Array.isArray(response)) {
      if (!response.length) {
        throw new Error('No images were generated. Please validate the prompt and user.')
      }
      base64Image = response[0] // Directly assign the first element if response is an array
    } else {
      if (!response.images || !response.images.length) {
        if (response.error) {
          throw new Error(`Image generation failed due to: ${response.error}`)
        }
        throw new Error('No images were generated. Please validate the prompt and user.')
      }
      base64Image = response.images[0] // Use the first image from the images array if response is an object
    }

    // Save the image and get its path
    const imagePath = await saveImage(base64Image, galleryName)

    // Attempt to fetch the gallery, create if not exists
    let gallery = await fetchGalleryByName(galleryName)
    if (!gallery) {
      console.log(`Creating new gallery: ${galleryName}`) // Logging the gallery creation
      gallery = await createGallery({ name: galleryName })
    }

    // Check if gallery is null before proceeding
    if (gallery) {
      // Store the generated art and return success
      const newArt = await createArt({
        path: imagePath,
        prompt,
        galleryId: gallery.id // Now safe to access .id
      })

      return { success: true, newArt }
    }
  } catch (error: any) {
    console.error('Art Generation Error:', error)
    return errorHandler({ error, context: `Art Generation - Prompt: ${prompt}, User: ${user}` })
  }
})
