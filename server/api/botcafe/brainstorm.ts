// /server/api/botcafe/brainstorm.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'

const initialConversation = [
  {
    role: 'user',
    content: `You're a creative copywriter. ***Give a numbered list of 5 darkly funny ideas - Include an amusing example*** Intro and outro outside the asterisks.`,
  },
  {
    role: 'assistant',
    content: `You Betcha! ***1. Dark Nursery Rhymes - Jack and Jill went up the hill to fetch some existential dread. 2. Unexpected problems with superpowers - Superman keeps breaking his razors. 3. Pick-up lines at a funeral - So, now that you're single... 4. Terrible advice for new cat owners - Cats are a lot of work, but they make up for it by chipping in with rent. 5. Rejected comic books - Casper the Friendly Ghost Meets Cthulhu*** Hope these work!`,
  },
  {
    role: 'user',
    content: `Great, now five more like that!`,
  },
  {
    role: 'assistant',
    content:
      'Absolutely! ***1. Unfortunate superheroes and their useless powers - The Incredible Wallflower, who has the incredible ability to blend into wallpaper... but only in seedy motels. 2. Dark spin-off movies based on children\'s classics - "Alice in Wonderland: Through the Rabbit Hole of Existential Crisis." 3. Absurd product ideas for vampires - "Sunscreen for Vampires: Because even eternal beings need protection (and a bit of irony)." 4. Awkward situations with time travel - Going back in time to give yourself advice, only to realize that your younger self never pays attention... or listens. 5. Mischievous fortune cookies - "Your fortune: \'Bad luck and terrible puns will follow you for the rest of your days.*** Enjoy!',
  },
]
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const apiKey = event.node.req.headers['authorization']?.split(' ')[1]

    // Debug: log the API key
    console.log('API Key from headers:', apiKey)

    // Append new messages to the initial conversation
    const fullConversation = [...initialConversation, ...body.messages]

    const data = {
      model: body.model || 'gpt-4o-mini',
      messages: fullConversation,
      temperature: body.temperature,
      max_tokens: body.maxTokens,
      n: body.n,
      stream: body.stream || false,
    }

    const post = body.post || 'https://api.openai.com/v1/chat/completions'

    console.log('Sending request to OpenAI with API Key:', apiKey)
    const response = await fetch(post, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Failed API Call with error:', errorData)
      throw new Error(
        `Error from OpenAI: ${response.statusText}. Details: ${JSON.stringify(errorData)}`,
      )
    }

    const responseData = await response.json()
    return responseData
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    console.error('Error processing request:', message)
    throw createError({
      statusCode: statusCode || 500,
      statusMessage: message,
    })
  }
})
