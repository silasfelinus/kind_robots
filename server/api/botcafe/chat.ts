// server/api/botcafe/chat.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { OPENAI_API_KEY: defaultKey } = useRuntimeConfig();
    const apiKey = body.user_openai_key || event.req.headers['x-openai-key'] || defaultKey;

    const data = {
      model: body.model || 'gpt-4o-mini',
      messages: body.messages,
      temperature: body.temperature,
      max_tokens: body.maxTokens,
      n: body.n,
      stream: body.stream || false,
    };
    const post = body.post || 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(post, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw createError({
        statusCode: response.status,
        statusMessage: `Error from OpenAI: ${response.statusText}. Details: ${JSON.stringify(errorData)}`,
      });
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    let errorMessage = 'An error occurred while processing the request.';
    if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`;
    }

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage,
    });
  }
});
