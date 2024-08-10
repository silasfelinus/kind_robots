// /server/api/utils/openAIImageGenerator.ts
import axios from 'axios'
import { errorHandler } from '../utils/error'

export async function generateImageWithOpenAI(prompt: string, user: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY // Make sure to load this from your runtime config

  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
  }

  const requestBody = {
    prompt,
    n: 1,
    size: '512x512',
    response_format: 'url',
    user,
  }

  try {
    const response = await axios.post('https://api.openai.com/v1/images/generations', requestBody, config)
    const generatedImageUrl = response.data.data[0].url // Assuming the URL is located here
    return generatedImageUrl
  }
  catch (error: any) {
    throw errorHandler(error)
  }
}
