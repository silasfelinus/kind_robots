import { createError, defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { parseStoredMusicVideoDoc } from '@/utils/musicVideoDoc'
import {
  buildBriefPrompt,
  mergeBrief,
  parseBriefResponse,
} from '@/utils/musicVideoBrief'
import {
  loadOwnedMusicVideo,
  readMusicVideoId,
  serializeValidatedDoc,
  toMusicVideoDto,
} from '@/server/utils/musicVideo'

type GenerateTextResponse = { text?: string }

// music-video/t-031: let the LLM fill the settings the pitch leaves open
// (genre, mood, BPM, vocal, style bible). Settings the person chose stay.
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = readMusicVideoId(event)
    const record = await loadOwnedMusicVideo(id, auth.user.id)
    const doc = parseStoredMusicVideoDoc(record.doc)
    if (!doc.pitch.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Write a pitch first; the brief is filled in from it.',
      })
    }

    const { system, prompt } = buildBriefPrompt({
      pitch: doc.pitch,
      settings: doc.settings,
    })
    const generated = await event.$fetch<GenerateTextResponse, string>(
      '/api/generate/text',
      {
        method: 'POST',
        body: {
          system,
          prompt,
          temperature: 0.7,
          maxTokens: 600,
          stream: false,
        },
      },
    )
    const fields = parseBriefResponse(String(generated?.text || ''))
    if (!Object.keys(fields).length) {
      throw createError({
        statusCode: 502,
        message: 'The brief writer returned nothing usable. Try again.',
      })
    }

    const settings = mergeBrief(doc.settings, fields)
    const updated = await prisma.musicVideo.update({
      where: { id },
      data: { doc: serializeValidatedDoc({ ...doc, settings }) },
    })
    return {
      success: true,
      statusCode: 200,
      message: 'Filled in the open settings from the pitch.',
      data: { video: toMusicVideoDto(updated), proposed: fields },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
