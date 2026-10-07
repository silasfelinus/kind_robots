import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { isMusicVideoStatus } from '@/utils/musicVideoDoc'
import {
  cleanMusicVideoTitle,
  loadOwnedMusicVideo,
  readMusicVideoId,
  serializeValidatedDoc,
  toMusicVideoDto,
} from '@/server/utils/musicVideo'

type UpdateMusicVideoBody = {
  title?: unknown
  status?: unknown
  doc?: unknown
  isPublic?: unknown
}

type MusicVideoUpdate = {
  title?: string
  status?: string
  doc?: string
  isPublic?: boolean
}

// Owners edit their own videos (Silas, 2026-10-07). The final cut is not
// editable here: only the export step attaches one, so a row can never point
// its public final at an ArtImage its owner did not make.
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const id = readMusicVideoId(event)
    await loadOwnedMusicVideo(id, auth.user.id)
    const body = (await readBody<UpdateMusicVideoBody>(event)) ?? {}
    const data: MusicVideoUpdate = {}

    if (body.title !== undefined) {
      const title = cleanMusicVideoTitle(body.title)
      if (!title)
        throw createError({
          statusCode: 400,
          message: 'Title cannot be empty.',
        })
      data.title = title
    }
    if (body.status !== undefined) {
      if (!isMusicVideoStatus(body.status)) {
        throw createError({
          statusCode: 400,
          message: 'Unknown music video status.',
        })
      }
      data.status = body.status
    }
    if (body.doc !== undefined) data.doc = serializeValidatedDoc(body.doc)
    if (body.isPublic !== undefined) {
      if (typeof body.isPublic !== 'boolean') {
        throw createError({
          statusCode: 400,
          message: 'isPublic must be true or false.',
        })
      }
      data.isPublic = body.isPublic
    }
    if (!Object.keys(data).length) {
      throw createError({ statusCode: 400, message: 'Nothing to update.' })
    }

    const record = await prisma.musicVideo.update({ where: { id }, data })
    return {
      success: true,
      statusCode: 200,
      message: 'Music video saved.',
      data: toMusicVideoDto(record),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
