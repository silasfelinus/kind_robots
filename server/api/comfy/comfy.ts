//server/api/utils/comfy.ts
import { defineEventHandler, readBody } from 'h3'

const targetUrl = 'https://comfy.acrocatranch.com/prompt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  try {
    const response = await $fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })
    return response // Ensure the response is passed back to the client
  } catch (error) {
    return {
      success: false,
      message: error || 'Failed to connect to Comfy server',
    }
  }
})
