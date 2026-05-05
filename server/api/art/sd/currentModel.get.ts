// /server/api/art/sd/currentModel.get.ts
import { defineEventHandler, createError } from 'h3'

type SDOptionsResponse = {
  sd_model_checkpoint?: unknown
}

function safeText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)

  return ''
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    const record = error as {
      message?: unknown
      statusCode?: unknown
      statusMessage?: unknown
      data?: unknown
    }

    const message =
      safeText(record.message).trim() || safeText(record.statusMessage).trim()

    if (message) return message
  }

  return fallback
}

export default defineEventHandler(async () => {
  try {
    const data = await $fetch<SDOptionsResponse>(
      'https://lola.acrocatranch.com/sdapi/v1/options',
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
    )

    const model = safeText(data.sd_model_checkpoint).trim()

    if (!model) {
      throw createError({
        statusCode: 502,
        statusMessage:
          'Stable Diffusion options response did not include sd_model_checkpoint.',
      })
    }

    return {
      success: true,
      data: model,
      message: 'Current model fetched.',
    }
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to fetch current model.')

    return {
      success: false,
      data: null,
      message,
    }
  }
})
