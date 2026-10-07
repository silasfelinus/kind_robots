import { defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireApiUser } from '@/server/utils/authGuard'
import { getArtImageAccessContext } from '@/server/utils/artImageAccess'
import { errorHandler } from '@/server/utils/error'
import {
  loadViewableMusicVideo,
  readMusicVideoId,
  serializeValidatedDoc,
  toMusicVideoDto,
} from '@/server/utils/musicVideo'
import { parseStoredMusicVideoDoc } from '@/utils/musicVideoDoc'
import {
  isMusicVideoOwner,
  remixMusicVideoDoc,
  remixMusicVideoTitle,
} from '@/utils/musicVideoAccess'

// Silas, 2026-10-07: any signed-in viewer can remix a video they can see. The
// remix is a new draft owned by the remixer with every setting kept; the
// original is untouched, so an owner remixing their own video gets a copy.
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const viewer = await getArtImageAccessContext(event)
    const { record } = await loadViewableMusicVideo(readMusicVideoId(event), {
      ...viewer,
      userId: auth.user.id,
    })
    const keepArt =
      isMusicVideoOwner(record, { userId: auth.user.id }) || auth.isAdmin
    const remix = await prisma.musicVideo.create({
      data: {
        userId: auth.user.id,
        title: remixMusicVideoTitle(record.title),
        isPublic: record.isPublic,
        doc: serializeValidatedDoc(
          remixMusicVideoDoc(parseStoredMusicVideoDoc(record.doc), keepArt),
        ),
      },
    })
    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      message: keepArt
        ? 'Remixed into a new draft with the same song and art.'
        : 'Remixed into a new draft with the same settings, lyrics and scenes.',
      data: toMusicVideoDto(remix),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
