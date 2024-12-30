// /server/api/botcafe/weirdlandia.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    // Validate API Key
    const { isValid } = await validateApiKey(event)
    if (!isValid) {
      event.node.res.statusCode = 401
      return { success: false, message: 'Invalid or expired token.' }
    }

    const body = await readBody(event)
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        message:
          'Server API key is missing. Please provide a valid OpenAI API key.',
      })
    }

    // Destructure body parameters
    const {
      username,
      genre,
      synopsis = 'START',
      userStatus,
      text,
      rounds = 'infinite', // Default to infinite if not provided
      roundsCompleted = 0, // Tracks how many rounds are finished
      flavor, // Optional narrative flavor
    } = body

    // Validate critical parameters
    if (!username || !genre) {
      throw createError({
        statusCode: 400,
        message: 'Username and genre are required.',
      })
    }

    // Calculate progress fraction (if finite)
    const progress =
      rounds === 'infinite'
        ? 'An endless journey awaits.'
        : `${roundsCompleted}/${rounds} (${Math.round(
            (roundsCompleted / rounds) * 100,
          )}%)`

    // Determine stage of narrative
    const narrativeStage =
      rounds === 'infinite'
        ? 'The adventure continues...'
        : roundsCompleted === 0
          ? 'Introduction: Setting the stage.'
          : roundsCompleted < rounds / 2
            ? 'Rising Action: Building drama and stakes.'
            : roundsCompleted < rounds
              ? 'Climax: An unexpected twist!'
              : 'Resolution: Wrapping up the journey.'

    // Randomized fallback flavors
    const randomFlavors = [
      'A puzzling challenge appears.',
      'A musical interlude unfolds.',
      'An absurd break in reality.',
      'A perilous trial emerges.',
      'A moment of quiet introspection.',
      'A whimsical detour.',
    ]
    const selectedFlavor =
      flavor || randomFlavors[Math.floor(Math.random() * randomFlavors.length)]

    const basePrompt =
      synopsis === 'START'
        ? `Start a story for ${username}, a ${genre} adventure. Include:
          - SYNOPSIS: A summary of events so far.
          - TEXT: The first scene, setting the stage.
          - CHOICES: Four options, separated by "|".
          - STATUS: User's state (e.g., ${userStatus || 'Curious'}).
          - PROGRESS: ${progress}.
          - NARRATIVE STAGE: ${narrativeStage}.
          - FLAVOR: ${selectedFlavor}.`
        : `Continue this story:
          - SYNOPSIS: ${synopsis}
          - ACTION: ${text}
          - STATUS: ${userStatus || 'Curious'}.
          - PROGRESS: ${progress}.
          - NARRATIVE STAGE: ${narrativeStage}.
          - FLAVOR: ${selectedFlavor}.
          Include:
          - SYNOPSIS: Updated summary.
          - TEXT: The next scene, reflecting the current stage and flavor.
          - CHOICES: Four options, separated by "|".
          - STATUS: Updated state.`

    // OpenAI API request payload
    const chatRequest = {
      model: body.model || 'gpt-4',
      messages: [{ role: 'user', content: basePrompt }],
      temperature: body.temperature || 0.7,
      max_tokens: body.maxTokens || 300,
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(chatRequest),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw createError({
        statusCode: response.status,
        message: `Error from OpenAI: ${response.statusText}. Details: ${JSON.stringify(errorData)}`,
      })
    }

    const responseData = await response.json()
    const rawResponse = responseData.choices[0]?.message?.content || ''

    // Parse response into structured data
    const parseSection = (label: string, text: string) =>
      (text.match(new RegExp(`${label}: (.*?)\\|\\|`, 's')) || [])[1]?.trim() ||
      ''
    const data = {
      synopsis: parseSection('SYNOPSIS', rawResponse),
      text: parseSection('TEXT', rawResponse),
      choices: parseSection('CHOICES', rawResponse)
        .split('|')
        .map((c) => c.trim()),
      status: parseSection('STATUS', rawResponse),
    }

    return { success: true, data }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to process the story.',
      data: null,
    }
  }
})
