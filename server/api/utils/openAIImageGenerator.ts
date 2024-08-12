// /server/api/utils/openAIImageGenerator.ts
import type { ErrorHandlerOutput } from '../utils/error';
import { errorHandler } from '../utils/error';

export async function generateImageWithOpenAI(prompt: string, user: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY; // Ensure this is loaded from your runtime config

  if (!apiKey) {
    throw { success: false, message: 'API key is not defined.', statusCode: 500 } as ErrorHandlerOutput;
  }

  const requestBody = {
    prompt,
    n: 1,
    size: '512x512',
    response_format: 'url',
    user,
  };

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.statusText}. Details: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const generatedImageUrl = data.data[0].url; // Assuming the URL is located here
    return generatedImageUrl;
  } catch (error) {
    const handledError = errorHandler(error);
    throw new Error(handledError.message); // This will pass the error message up the chain
  }
}
