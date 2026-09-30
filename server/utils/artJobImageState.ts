// /server/utils/artJobImageState.ts
//
// A job's payload records the maturity and privacy its output was SAVED with.
// The ArtImage is the thing that is actually mature or private, and it can be
// edited or deleted afterwards. The queue card judges visibility from the
// payload, so an image re-marked mature or private kept rendering as "General
// · Public": its prompt stayed readable with mature content off, and its
// public file URL, which the file route now refuses, rendered as a blank.
// A deleted image (a hard delete) left the same blank behind.
//
// Listing responses therefore report the image's CURRENT flags, and drop the
// link to an image that no longer exists so the card says so instead.
import prisma from './prisma'
import type { ArtJobPayloadRecord } from './artJobPayload'

type ListedArtJob = {
  artImageId: number | null
  payload: ArtJobPayloadRecord
}

function asRecord(value: unknown): ArtJobPayloadRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as ArtJobPayloadRecord
}

export async function applyCurrentArtImageState<T extends ListedArtJob>(
  jobs: T[],
): Promise<T[]> {
  const ids = [
    ...new Set(
      jobs
        .map((job) => job.artImageId)
        .filter((id): id is number => typeof id === 'number' && id > 0),
    ),
  ]
  if (!ids.length) return jobs

  const images = await prisma.artImage.findMany({
    where: { id: { in: ids } },
    select: { id: true, isMature: true, isPublic: true },
  })
  const imageById = new Map(images.map((image) => [image.id, image]))

  return jobs.map((job) => {
    if (typeof job.artImageId !== 'number') return job
    const image = imageById.get(job.artImageId)
    if (!image) {
      return {
        ...job,
        artImageId: null,
        payload: { ...job.payload, outputImageDeleted: true },
      }
    }
    return {
      ...job,
      payload: {
        ...job.payload,
        save: {
          ...asRecord(job.payload.save),
          isMature: image.isMature,
          isPublic: image.isPublic,
        },
      },
    }
  })
}
