// /server/api/botcafe/weirdlandia.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { resolveServer } from '../../utils/serverResolver'
import { createTextCompletion } from '../../utils/textServer'
import { manaGate } from '../../utils/manaGate'
import { estimateTextCostUsd } from '../../utils/manaCost'

type WeirdlandiaBody = {
  username?: string
  genre?: string
  synopsis?: string
  userStatus?: string
  text?: string
  rounds?: number | 'infinite'
  roundsCompleted?: number
  flavor?: string
  serverId?: number | null
  serverName?: string | null
  model?: string
  temperature?: number
  maxTokens?: number
  chatId?: number | string | null
}

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      event.node.res.statusCode = 401
      return { success: false, message: 'Invalid or expired token.' }
    }

    const body = await readBody<WeirdlandiaBody>(event)

    const {
      username,
      genre,
      synopsis = 'START',
      userStatus,
      text,
      rounds = 'infinite',
      roundsCompleted = 0,
      flavor,
      serverId,
      serverName,
    } = body

    if (!username || !genre) {
      throw createError({
        statusCode: 400,
        message: 'Username and genre are required.',
      })
    }

    const model = body.model || process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini'
    const maxTokens = body.maxTokens || 300

    const server = await resolveServer({
      userId: user.id,
      serverId: typeof serverId === 'number' ? serverId : null,
      serverName: typeof serverName === 'string' ? serverName : null,
      capability: 'text',
    })

    const gate = await manaGate(event, {
      kind: 'text',
      estCostUsd: estimateTextCostUsd({
        model,
        maxTokens,
      }),
      serverId: server.id,
    })

    const progress =
      rounds === 'infinite'
        ? 'An endless journey awaits.'
        : `${roundsCompleted}/${rounds} (${Math.round(
            (roundsCompleted / rounds) * 100,
          )}%)`

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
SYNOPSIS: A summary of events so far.||
TEXT: The first scene, setting the stage.||
CHOICES: Four options, separated by "|".||
STATUS: User's state (${userStatus || 'Curious'}).||
PROGRESS: ${progress}.||
NARRATIVE STAGE: ${narrativeStage}.||
FLAVOR: ${selectedFlavor}.||`
        : `Continue this story:
SYNOPSIS: ${synopsis}||
ACTION: ${text || ''}||
STATUS: ${userStatus || 'Curious'}.||
PROGRESS: ${progress}.||
NARRATIVE STAGE: ${narrativeStage}.||
FLAVOR: ${selectedFlavor}.||
Include:
SYNOPSIS: Updated summary.||
TEXT: The next scene.||
CHOICES: Four options separated by "|".||
STATUS: Updated state.||`

    const response = await createTextCompletion({
      server,
      apiKey: process.env.OPENAI_API_KEY,
      model,
      messages: [{ role: 'user', content: basePrompt }],
      temperature: body.temperature || 0.7,
      max_tokens: maxTokens,
      stream: false,
    })

    const responseData = (await response.json()) as OpenAIChatResponse
    const rawResponse = responseData.choices?.[0]?.message?.content || ''

    const parseSection = (label: string, value: string): string =>
      (value.match(new RegExp(`${label}: (.*?)\\|\\|`, 's')) ||
        [])[1]?.trim() || ''

    const { balance } = await gate.commit(
      body.chatId ? `chat:${body.chatId}` : `weirdlandia:${Date.now()}`,
    )

    return {
      success: true,
      data: {
        synopsis: parseSection('SYNOPSIS', rawResponse),
        text: parseSection('TEXT', rawResponse),
        choices: parseSection('CHOICES', rawResponse)
          .split('|')
          .map((choice: string) => choice.trim())
          .filter(Boolean),
        status: parseSection('STATUS', rawResponse),
        serverId: server.id,
        serverName: server.title,
      },
      mana: {
        balance,
        charged: gate.cost,
        free: gate.free,
      },
    }
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
