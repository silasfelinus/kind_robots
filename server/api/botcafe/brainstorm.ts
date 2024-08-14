// /server/api/botcafe/brainstorm.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import { useRuntimeConfig, createError } from '#imports'

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
    let { OPENAI_API_KEY } = useRuntimeConfig()

    // Check if user's key is provided in the request
    if (body.user_openai_key) {
      OPENAI_API_KEY = body.user_openai_key
    }

    // Append new messages to the initial conversation
    const fullConversation = [...initialConversation, ...body.messages]

    const data = {
      model: body.model || 'gpt-3.5-turbo',
      messages: fullConversation,
      temperature: body.temperature,
      max_tokens: body.maxTokens,
      n: body.n,
      stream: body.stream || false,
    }

    const post = body.post || 'https://api.openai.com/v1/chat/completions'

    const response = await fetch(post, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`)
    }

    // Parse and format brainstorm responses
    const parsedResponse = await parseBrainstormResponse(response)
    return parsedResponse
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    throw createError({
      statusCode: statusCode || 500,
      statusMessage: message,
    })
  }
})

const parseBrainstormResponse = async (response: Response) => {
  // Custom logic to parse and format the brainstorm responses
  const data = await response.json()
  return data
}
