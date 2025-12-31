// /server/api/art/sd/currentModel.get.ts
import { defineEventHandler } from 'h3'

interface SDOptionsResponse {
  sd_model_checkpoint: string
}

export default defineEventHandler(async () => {
  try {
    const res = await $fetch<SDOptionsResponse>(
      'https://lola.acrocatranch.com/sdapi/v1/options',
    )
    return { success: true, data: res.sd_model_checkpoint }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to fetch current model',
    }
  }
})
