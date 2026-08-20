import { createError, defineEventHandler, readBody } from 'h3'
import type { VideoEngine } from '../../../utils/videoPresets'

type VideoGenerateRequest = Record<string, unknown> & {
  engine?: string | null
}

type VideoGenerateResponse = {
  success: boolean
  message: string
  statusCode: number
  data?: Record<string, unknown>
}

function normalizeEngine(value: unknown): VideoEngine {
  const engine = String(value || '').trim().toLowerCase()
  if (engine === 'ltx' || engine === 'wan') return engine
  throw createError({
    statusCode: 400,
    message: 'Video generation requires engine "ltx" or "wan".',
  })
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as VideoGenerateRequest | null
  const engine = normalizeEngine(body?.engine)

  return event.$fetch<VideoGenerateResponse, string>('/api/art/enqueue', {
    method: 'POST',
    body: {
      ...(body ?? {}),
      engine,
    },
  })
})
