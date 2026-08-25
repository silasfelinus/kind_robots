import {
  createError,
  defineEventHandler,
  getHeader,
  readMultipartFormData,
} from 'h3'
import { requireApiUser } from '../../utils/authGuard'
import { errorHandler } from '../../utils/error'
import { manaGate } from '../../utils/manaGate'
import { safeFetch } from '../../utils/safeFetch'
import {
  assertProviderApiKey,
  getRuntimeOpenAiKey,
  readJsonWithSizeCap,
} from '../../utils/textProviderService'

const MAX_AUDIO_BYTES = 6 * 1024 * 1024
const MAX_REQUEST_BYTES = MAX_AUDIO_BYTES + 512 * 1024
const MAX_TRANSCRIPT_BYTES = 64 * 1024
const TRANSCRIPTION_MODEL = 'gpt-4o-mini-transcribe'

const ALLOWED_AUDIO_TYPES = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/m4a',
  'audio/x-m4a',
])

type TranscriptionPayload = {
  text?: unknown
}

function assertRequestSize(event: Parameters<typeof getHeader>[0]): void {
  const contentLength = Number(getHeader(event, 'content-length') || 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    throw createError({
      statusCode: 413,
      message: 'Pronunciation recording is too large. Keep practice clips short.',
    })
  }
}

function cleanMimeType(value: string | undefined): string {
  return String(value || '')
    .split(';')[0]
    ?.trim()
    .toLowerCase() || ''
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType === 'audio/webm') return 'webm'
  if (mimeType === 'audio/ogg') return 'ogg'
  if (mimeType === 'audio/mp4' || mimeType === 'audio/m4a' || mimeType === 'audio/x-m4a') return 'm4a'
  if (mimeType === 'audio/mpeg' || mimeType === 'audio/mp3') return 'mp3'
  return 'wav'
}

export default defineEventHandler(async (event) => {
  try {
    await requireApiUser(event)
    assertRequestSize(event)

    const form = await readMultipartFormData(event)
    const audio = form?.find((field) => field.name === 'audio' || field.name === 'file')

    if (!audio?.data?.length) {
      throw createError({
        statusCode: 400,
        message: 'No pronunciation recording was received.',
      })
    }

    if (audio.data.length > MAX_AUDIO_BYTES) {
      throw createError({
        statusCode: 413,
        message: 'Pronunciation recording is too large. Keep practice clips short.',
      })
    }

    const mimeType = cleanMimeType(audio.type)
    if (!ALLOWED_AUDIO_TYPES.has(mimeType)) {
      throw createError({
        statusCode: 415,
        message: `Unsupported pronunciation audio type: ${mimeType || 'unknown'}.`,
      })
    }

    const config = useRuntimeConfig()
    const apiKey = getRuntimeOpenAiKey(config)
    assertProviderApiKey({
      apiKey,
      providerLabel: 'OpenAI',
      expectedPrefix: 'sk-',
    })

    // A short practice utterance is normally only a few seconds. This estimate
    // intentionally rounds above the current mini-transcription per-minute rate;
    // manaGate itself enforces the app's minimum non-free charge.
    const gate = await manaGate(event, {
      kind: 'text',
      estCostUsd: 0.002,
    })

    const upstreamForm = new FormData()
    const audioBytes = Uint8Array.from(audio.data)
    const extension = extensionForMimeType(mimeType)
    upstreamForm.append(
      'file',
      new Blob([audioBytes], { type: mimeType }),
      audio.filename || `mandarin-practice.${extension}`,
    )
    upstreamForm.append('model', TRANSCRIPTION_MODEL)
    upstreamForm.append('language', 'zh')
    upstreamForm.append('response_format', 'json')

    // Deliberately do not send the target Hanzi or pinyin as a transcription
    // prompt. The learner needs to see what the recognizer actually heard, not
    // a target-biased guess that quietly autocorrects the attempt.
    const upstream = await safeFetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: upstreamForm,
      },
      { connectTimeoutMs: 30_000 },
    )

    const payload = (await readJsonWithSizeCap(
      upstream,
      MAX_TRANSCRIPT_BYTES,
    )) as TranscriptionPayload

    if (!upstream.ok) {
      throw createError({
        statusCode: upstream.status,
        message: `Mandarin transcription failed with status ${upstream.status}.`,
      })
    }

    const transcript = typeof payload.text === 'string' ? payload.text.trim() : ''
    if (!transcript) {
      throw createError({
        statusCode: 422,
        message: 'The recording was received, but no Mandarin speech was recognized.',
      })
    }

    await gate.commit(`mandarin-pronunciation:${Date.now()}`)

    return {
      success: true,
      statusCode: 200,
      message: 'Pronunciation recording transcribed.',
      data: {
        transcript,
        model: TRANSCRIPTION_MODEL,
      },
    }
  } catch (error) {
    return errorHandler(error)
  }
})
