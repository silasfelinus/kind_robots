import { defineEventHandler, setHeader } from 'h3'
import { errorHandler } from '~/server/utils/error'
import {
  parseRequests,
  requireMonstriqueStudio,
  type BibleRequestRecord,
} from '~/server/utils/monstriqueBible'
import { MONSTRIQUE_BIBLE_SEED } from '~/server/utils/monstriqueBibleSeed'
import prisma from '~/server/utils/prisma'
import { CHARACTER_IDS } from '~/utils/monstrique/characterModels'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  try {
    await requireMonstriqueStudio(event)
    const entries = await prisma.monstriqueBibleEntry.findMany()
    const byKey = new Map(entries.map((entry) => [entry.characterKey, entry]))
    const requested = new Map<string, BibleRequestRecord[]>()
    for (const id of CHARACTER_IDS)
      requested.set(id, [
        ...MONSTRIQUE_BIBLE_SEED.filter((row) => row.character === id),
        ...parseRequests(byKey.get(id)?.requests),
      ])
    const jobIds = [...requested.values()].flat().map((row) => row.jobId)
    const jobs = jobIds.length
      ? await prisma.artJob.findMany({
          where: { id: { in: jobIds } },
          select: { id: true, status: true, artImageId: true },
        })
      : []
    const imageIds = jobs
      .map((job) => job.artImageId)
      .filter((id): id is number => Number.isInteger(id))
    const images = imageIds.length
      ? await prisma.artImage.findMany({
          where: { id: { in: imageIds } },
          select: { id: true, imagePath: true },
        })
      : []
    const jobById = new Map(jobs.map((job) => [job.id, job]))
    const pathById = new Map(images.map((image) => [image.id, image.imagePath]))

    return {
      success: true,
      data: {
        characters: CHARACTER_IDS.map((id) => {
          const entry = byKey.get(id)
          return {
            key: id,
            displayName: entry?.displayName ?? null,
            notes: entry?.notes ?? '',
            loraStatus: entry?.loraStatus ?? 'dataset-needed',
            loraResourceName: entry?.loraResourceName ?? null,
            heroArtImageId: entry?.heroArtImageId ?? null,
            heroImagePath: null as string | null,
            gallery: (requested.get(id) ?? []).map((row) => {
              const job = jobById.get(row.jobId)
              const artImageId = job?.artImageId ?? null
              return {
                ...row,
                status: job?.status ?? 'UNKNOWN',
                artImageId,
                imagePath: artImageId
                  ? (pathById.get(artImageId) ?? null)
                  : null,
              }
            }),
          }
        }).map((character) => ({
          ...character,
          heroImagePath:
            character.gallery.find(
              (item) => item.artImageId === character.heroArtImageId,
            )?.imagePath ?? null,
        })),
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message }
  }
})
