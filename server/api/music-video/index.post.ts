import { defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { normalizeMusicVideoDoc } from '@/utils/musicVideoDoc'
import {
  cleanMusicVideoTitle,
  serializeValidatedDoc,
  toMusicVideoDto,
} from '@/server/utils/musicVideo'

type CreateMusicVideoBody = {
  title?: unknown
  pitch?: unknown
  settings?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const body = (await readBody<CreateMusicVideoBody>(event)) ?? {}
    const doc = serializeValidatedDoc(
      normalizeMusicVideoDoc({ pitch: body.pitch, settings: body.settings })
        .doc,
    )
    const record = await prisma.musicVideo.create({
      data: {
        userId: auth.user.id,
        title: cleanMusicVideoTitle(body.title, 'Untitled music video'),
        doc,
      },
    })
    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      message: 'Music video created.',
      data: toMusicVideoDto(record),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
