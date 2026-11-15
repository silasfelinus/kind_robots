import { defineEventHandler } from 'h3'
import { getArtImageAccessContext } from '@/server/utils/artImageAccess'
import { isMusicVideoOwner } from '@/utils/musicVideoAccess'
import { errorHandler } from '@/server/utils/error'
import {
  loadViewableMusicVideo,
  readMusicVideoId,
  toMusicVideoDto,
} from '@/server/utils/musicVideo'

export default defineEventHandler(async (event) => {
  try {
    const viewer = await getArtImageAccessContext(event)
    const { record } = await loadViewableMusicVideo(
      readMusicVideoId(event),
      viewer,
    )
    const result = toMusicVideoDto(record)
    // Private editorial notes must never leak through a public final's DTO.
    if (!isMusicVideoOwner(record, viewer)) delete result.doc.review
    return {
      success: true,
      statusCode: 200,
      message: 'Music video loaded.',
      data: result,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
