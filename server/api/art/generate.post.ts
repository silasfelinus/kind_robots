import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import { generateAndSaveImage } from '.'

// Define types for better type safety
type RequestData = {
  prompt?: string
  username?: string
  galleryName?: string
}

export default defineEventHandler(async (event) => {
  let username: string | undefined // Declare user here
  let prompt: string | undefined // Declare prompt here

  try {
    const requestData: RequestData = await readBody(event)
    prompt = requestData.prompt // Assign value here
    username = requestData.username // Assign value here
    const galleryName = requestData.galleryName || 'cafefred'

    // Validate prompt and user
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid or missing prompt')
    }

    if (!username || typeof username !== 'string') {
      throw new Error('Invalid or missing user')
    }

    // Call your utility function to generate and save the image
    const result = await generateAndSaveImage(prompt, username, galleryName)

    // Check if result is not undefined
    if (result) {
      return { success: result.success, newArt: result.newArt } // Return the result
    } else {
      throw new Error('Image generation and saving failed')
    }
  } catch (error: any) {
    console.error('Art Generation Error:', error)
    return errorHandler({ error, context: `Art Generation - Prompt: ${prompt}, User: ${username}` })
  }
})
