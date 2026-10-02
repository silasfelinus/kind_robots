import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { parseStoredMusicVideoDoc } from '@/utils/musicVideoDoc'
import {
  buildLyricsPrompt,
  mergeLyricSections,
  parseLyricsResponse,
  planLyricSections,
  pruneDanglingLyricRefs,
  type LyricSectionPlan,
} from '@/utils/musicVideoLyrics'
import {
  loadOwnedMusicVideo,
  readMusicVideoId,
  serializeValidatedDoc,
  toMusicVideoDto,
} from '@/server/utils/musicVideo'

type LyricsRequestBody = {
  sectionId?: unknown
}

type GenerateTextResponse = {
  text?: string
  provider?: string
  model?: string
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = readMusicVideoId(event)
    const record = await loadOwnedMusicVideo(id, auth.user.id)
    const body = (await readBody<LyricsRequestBody>(event)) ?? {}
    const doc = parseStoredMusicVideoDoc(record.doc)
    const existing = doc.lyrics.sections
    const onlySectionId =
      typeof body.sectionId === 'string' && body.sectionId.trim()
        ? body.sectionId.trim()
        : undefined

    let plan: LyricSectionPlan[]
    let keep = existing.filter((section) => section.locked)
    if (onlySectionId) {
      const target = existing.find((section) => section.id === onlySectionId)
      if (!target) {
        throw createError({
          statusCode: 404,
          message: 'Lyric section not found.',
        })
      }
      if (target.locked) {
        throw createError({
          statusCode: 409,
          message: 'That section is locked. Unlock it before regenerating.',
        })
      }
      plan = [
        {
          id: target.id,
          kind: target.kind,
          lines: Math.max(target.lines.length, 2),
        },
      ]
      keep = existing.filter((section) => section.id !== onlySectionId)
    } else {
      plan = planLyricSections(doc.settings)
      if (!plan.length) {
        throw createError({
          statusCode: 400,
          message:
            'This video is set to instrumental, so it has no lyrics to write.',
        })
      }
    }

    const { system, prompt } = buildLyricsPrompt({
      pitch: doc.pitch,
      settings: doc.settings,
      plan,
      keep,
    })
    const generated = await event.$fetch<GenerateTextResponse, string>(
      '/api/generate/text',
      {
        method: 'POST',
        body: {
          system,
          prompt,
          temperature: 0.8,
          maxTokens: 1200,
          stream: false,
        },
      },
    )

    const parsed = parseLyricsResponse(String(generated?.text || ''))
    if (!parsed.length) {
      throw createError({
        statusCode: 502,
        message: 'The lyric writer returned nothing usable. Try again.',
      })
    }

    const sections = mergeLyricSections(existing, parsed, onlySectionId)
    const nextDoc = {
      ...doc,
      lyrics: { sections },
      scenes: pruneDanglingLyricRefs(doc.scenes, sections),
    }
    const updated = await prisma.musicVideo.update({
      where: { id },
      data: { doc: serializeValidatedDoc(nextDoc) },
    })

    return {
      success: true,
      statusCode: 200,
      message: onlySectionId ? 'Lyric section rewritten.' : 'Lyrics written.',
      data: {
        video: toMusicVideoDto(updated),
        provider: generated?.provider ?? null,
        model: generated?.model ?? null,
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
