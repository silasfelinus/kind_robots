import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

console.log("🚀 Starting up the video generation engine with Deforum!")

type GenerateVideoResponse = {
  video_url: string
  error?: string
}

type RequestData = {
  promptString: string
  checkpoint?: string
  frames?: number
  translation2D?: string
  translation3D?: string
  seed?: number
  designer?: string
  userId?: number
  username?: string
}

export default defineEventHandler(async (event) => {
  try {
    console.log('🌟 Event triggered! Reading request body...')
    const requestData: RequestData = await readBody(event)

    // Ensure prompt is present
    if (!requestData.promptString) {
      throw new Error('Missing prompt in request data.')
    }

    console.log('🎉 Generating video with prompt:', requestData.promptString)

    // 2. Generate Video Using Deforum
    const response: GenerateVideoResponse = await generateVideo(
      requestData.promptString,
      requestData.designer || requestData.username || 'Anonymous',
      requestData.checkpoint || 'default',
      requestData.frames || 200,
      requestData.translation2D || '0:(0)',  // Default 2D translation
      requestData.translation3D || '0:(0)'  // Default 3D translation
    )

    if (!response || !response.video_url) {
      throw new Error(`Video generation failed: ${response?.error || 'No video generated.'}`)
    }

    console.log('🎥 Video generated successfully!')

    // 3. Save Prompt to Database
    const newPrompt = await prisma.prompt.create({
      data: {
        prompt: requestData.promptString,
        userId: requestData.userId,
        designer: requestData.designer || 'Anonymous',
        frames: requestData.frames || 200,
        translation2D: requestData.translation2D || '0:(0)',
        translation3D: requestData.translation3D || '0:(0)',
        checkpoint: requestData.checkpoint || 'default',
        seed: requestData.seed || -1
      }
    })

    console.log('💾 Prompt saved successfully:', newPrompt)

    // Return success response
    return {
      success: true,
      message: 'Video generated and prompt saved successfully!',
      videoUrl: response.video_url,
      promptId: newPrompt.id
    }
  } catch (error: unknown) {
    console.error('Video Generation Error:', error)
    return errorHandler({
      error,
      context: `Video Generation - ${event.req.url}`
    })
  }
})

// Function to generate video from Deforum API
async function generateVideo(
  prompt: string,
  user: string,
  checkpoint: string,
  frames: number,
  translation2D: string,
  translation3D: string
): Promise<{ video_url: string }> {
  console.log('🎥 Starting video generation...')
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  }

  const requestBody = {
    prompt,
    user,
    checkpoint,
    frames,
    translation2D,
    translation3D,
    response_format: 'url',
  }
  
  console.log('🚀 Video generation payload:', requestBody)

  try {
    const response = await fetch('https://lola.acrocatranch.com/deforum/v1/txt2video', {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`Video generation failed: ${response.status} ${response.statusText}`)
    }

    const responseData = await response.json()
    return { video_url: responseData.video_url }
  } catch (error) {
    throw new Error('Video generation failed.')
  }
}
