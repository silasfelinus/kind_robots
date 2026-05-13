// server/api/art/images/meta.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'

export default defineEventHandler(async () => {
  try {
    const data = await prisma.artImage.findMany({
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        galleryId: true,
        userId: true,
        fileName: true,
        fileType: true,
        imagePath: true,
        rarity: true,
        path: true,
        promptString: true,
        negativePrompt: true,
        checkpoint: true,
        checkpointResourceId: true,
        sampler: true,
        seed: true,
        steps: true,
        cfg: true,
        cfgHalf: true,
        designer: true,
        genres: true,
        isPublic: true,
        isMature: true,
        serverId: true,
        serverName: true,
        serverUrl: true,
        artId: true,
        botId: true,
        componentId: true,
        milestoneId: true,
        pitchId: true,
        promptId: true,
        resourceId: true,
        rewardId: true,
        chatId: true,
        characterId: true,
        butterflyId: true,
        tagId: true,
        // imageData and thumbnailData deliberately excluded
      },
    })

    // Surface whether thumbnailData exists without sending the blob
    const thumbFlags = await prisma.$queryRaw<
      { id: number; hasThumb: number }[]
    >`
      SELECT id, (thumbnailData IS NOT NULL AND thumbnailData != '') AS hasThumb
      FROM ArtImage
    `
    const thumbMap = new Map(thumbFlags.map((r) => [r.id, Boolean(r.hasThumb)]))

    const result = data.map((img) => ({
      ...img,
      thumbnailData: thumbMap.get(img.id) ? '(set)' : null,
    }))

    return { success: true, data: result }
  } catch (error) {
    return errorHandler(error)
  }
})
