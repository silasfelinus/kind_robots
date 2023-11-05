import { defineEventHandler, readBody } from 'h3';
import { useRuntimeConfig, createError } from '#imports';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    const requiredFields = ['messages', 'post'];

    const { OPENAI_API_KEY } = useRuntimeConfig();

    for (const field of requiredFields) {
      if (!body[field]) {
        throw new Error(`Missing data. Please make sure to provide ${field}.`);
      }
    }

    const post = body.post;
    console.log('Sending ' + post);

    const response = await fetch(post, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: body.model || 'gpt-3.5-turbo',
        messages: body.messages,
        temperature: body.temperature || 1,
        n: body.n || 1,
        max_tokens: body.max_tokens || 500,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to post to botcafe');
    }

    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      if (e instanceof SyntaxError) {
        const text = await response.text();
        console.error('Error parsing JSON:', text);
        throw new Error('Received invalid JSON');
      } else {
        throw e;
      }
    }

    return data;
  } catch (error) {
    // This is where the closing bracket was missing.
    let errorMessage = 'An error occurred while creating the channel.';

    // Check if error is an instance of Error
    if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`;
    }

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage,
    });
  }
});
