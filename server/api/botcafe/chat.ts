// server/api/botcafe/chat.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  // Retrieve API key from headers, adjusted for new deprecation update
  const apiKey = event.node.req.headers['authorization']?.split(' ')[1];

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
      'Authorization': `Bearer ${apiKey}`,  // Use the API key from the header
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error from OpenAI: ${response.statusText}. Details: ${JSON.stringify(errorData)}`);
  }

  const responseData = await response.json();
  return responseData;
});
