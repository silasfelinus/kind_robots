import { defineEventHandler } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { readDbMaxPacketBytes } from '@/server/utils/musicVideo'
import {
  clampUploadToPacket,
  musicVideoMaxUploadBytes,
} from '@/utils/musicVideoFinal'

// The final-cut upload cap the attach route will enforce, so the browser
// exporter sizes its encode to it instead of to the configured default
// (Silas, 2026-10-07: "The video is larger than 11 MB").
export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const finalMaxBytes = clampUploadToPacket(
      musicVideoMaxUploadBytes(process.env.MUSIC_VIDEO_MAX_UPLOAD_MB),
      await readDbMaxPacketBytes(),
    )
    return {
      success: true,
      statusCode: 200,
      message: 'Music video upload limits.',
      data: { finalMaxBytes },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
