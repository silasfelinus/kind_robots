// server/api/art/generate.post.ts

import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { saveImage } from './../../../server/api/utils/saveImage'
import type { Art } from '@prisma/client'
import {
  type RequestData,
  validateAndLoadDesignerName,
  validateAndLoadGalleryId,
  validateAndLoadPitchId,
  validateAndLoadPromptId,
  validateAndLoadUserId,
} from '.'

type GenerateImageResponse = {
  images: string[]
  error?: string
}

export default defineEventHandler(async (event) => {
  let imageId: number | null = null
  let newArt: Art | null = null

  try {
    const requestData: RequestData = await readBody(event)

    // Validate required fields
    if (!requestData.promptString) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: "promptString".',
      })
    }

    // Authorization check
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Authorization token required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true, karma: true },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired authorization token.',
      })
    }

    if (user.id !== requestData.userId) {
      throw createError({
        statusCode: 403,
        message:
          'User ID in the request does not match the authenticated user.',
      })
    }

    if (user.karma <= 0) {
      throw createError({
        statusCode: 403,
        message: 'Insufficient karma to generate an image.',
      })
    }

    // Validate and load additional required data
    const validatedData: Partial<RequestData> = {}
    validatedData.userId = await validateAndLoadUserId(
      requestData,
      validatedData,
    )
    validatedData.promptId = await validateAndLoadPromptId(
      requestData,
      validatedData,
    )
    validatedData.pitchId = await validateAndLoadPitchId(requestData)
    validatedData.galleryId = await validateAndLoadGalleryId(requestData)
    validatedData.designer = validateAndLoadDesignerName(requestData)

    const rawCfg = Number(requestData.cfg)
    const cfgValue = calculateCfg(
      isNaN(rawCfg) ? 3 : rawCfg,
      requestData.cfgHalf ?? false,
    )

    const response: GenerateImageResponse = await generateImage(
      requestData.promptString,
      validatedData.designer || 'kindguest',
      cfgValue || 3,
      requestData.negativePrompt || '',
      requestData.seed || -1,
      requestData.steps || 20,
      requestData.checkpoint,
      requestData.sampler || 'Euler a',
    )

    if (!response.images?.length) {
      throw createError({
        statusCode: 500,
        message: `Image generation failed: ${response.error || 'No images generated.'}`,
      })
    }

    // Save the generated image
    const base64Image = response.images[0]
    const savedImage = await saveImage(
      base64Image,
      requestData.galleryName || 'cafefred',
      validatedData.userId,
      validatedData.galleryId,
    )

    imageId = savedImage.id
    if (!imageId) {
      throw createError({
        statusCode: 500,
        message: 'Failed to save generated image.',
      })
    }

    // Create a new art entry linked to the image
    newArt = await prisma.art.create({
      data: {
        path: savedImage.fileName,
        cfg: requestData.cfg,
        cfgHalf: requestData.cfgHalf,
        checkpoint: requestData.checkpoint,
        sampler: requestData.sampler,
        seed: requestData.seed,
        steps: requestData.steps,
        designer: validatedData.designer,
        promptString: requestData.promptString,
        negativePrompt: requestData.negativePrompt,
        isPublic: requestData.isPublic,
        isMature: requestData.isMature,
        userId: validatedData.userId,
        promptId: validatedData.promptId,
        pitchId: validatedData.pitchId,
        galleryId: validatedData.galleryId,
        artImageId: imageId,
      },
    })

    await prisma.artImage.update({
      where: { id: imageId },
      data: { artId: newArt.id },
    })
    await prisma.user.update({
      where: { id: user.id },
      data: { karma: user.karma - 1 },
    })

    event.node.res.statusCode = 201

    const data = newArt
    return {
      success: true,
      message: 'Art and image saved successfully!',
      data,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message: handledError.message || 'Failed to create new art.',
    }
  }
})

export async function generateImage(
  prompt: string,
  user: string,
  cfgValue: number,
  negativePrompt?: string,
  seed?: number,
  steps?: number,
  checkpoint?: string,
  sampler?: string,
): Promise<{ images: string[] }> {
  console.log('📸 Starting image generation...')

  const config = {
    headers: { 'Content-Type': 'application/json' },
  }

  const requestBody = {
    prompt,
    negative_prompt: negativePrompt || ' ',
    steps: steps || 10,
    cfg_scale: cfgValue ?? 0,
    seed: seed ?? -1,
    width: 512,
    height: 512,
    sampler_index: sampler || 'Euler a',
    override_settings: {
      sd_model_checkpoint: checkpoint || 'Flux/flux1-dev-fp8.safetensors',
    },
    user,
  }

  console.log('[🧪 Backend Request Body]', requestBody)

  try {
    const response = await fetch(
      'https://lola.acrocatranch.com/sdapi/v1/txt2img',
      {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(requestBody),
      },
    )

    if (!response.ok) {
      console.error(`Image generation failed: ${response.statusText}`)
      throw new Error(
        `Image generation failed: ${response.status} ${response.statusText}`,
      )
    }

    const responseData = await response.json()
    return { images: responseData.images }
  } catch (error) {
    console.error('Error during image generation:', error)
    throw new Error('Image generation failed.')
  }
}

function calculateCfg(cfg: number, cfgHalf: boolean): number {
  return cfgHalf ? cfg + 0.5 : cfg
}
