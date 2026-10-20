import prisma from '~/server/utils/prisma'
import { attachCompletedArtImageToCollections } from './generatedArtCollections'

export async function saveImage(
  base64Image: string,
  userId: number,
  options: { attachToCollections?: boolean } = {},
): Promise<{ id: number; fileName: string }> {
  // No local catch. This used to `throw errorHandler(error)`, which handed
  // every caller a plain object their own errorHandler could only report as
  // "An unknown error occurred." -- how ArtJob 40972's database failure
  // reached the relay (2026-10-20). Callers handle the original error.
  const timestamp = Date.now()

  // Set the fileName dynamically based on environment
  const fileName = `ArtImageUpload-${timestamp}`

  // Always save to the database
  const savedImage = await prisma.artImage.create({
    data: {
      imageData: base64Image, // store base64 image
      fileName: fileName ?? 'Kind Image', // Ensure fileName is never null
      userId,
    },
  })

  // saveImage is the common persistence seam for finished generated pixels:
  // direct A1111/SDXL/OpenAI renders, browser-side Kontext saves, and relay
  // ArtJob uploads. Give every generated ArtImage a canonical DB collection
  // immediately. Durable ArtJob completion then idempotently adds any
  // explicit or entity-context collections in its completion transaction.
  if (options.attachToCollections !== false) {
    await attachCompletedArtImageToCollections(prisma, {
      artImageId: savedImage.id,
      userId,
    })
  }

  // No raw file copy. This used to write `ArtImageUpload-<ts>` next to
  // every render whenever APP_ENV was not "production" -- which in practice
  // meant production too -- leaving a full-size, extensionless duplicate on
  // the share that nothing read: the bytes live in imageData until
  // offloadArtImageBytes writes the canonical artimage-<id> file.

  // Return the saved image ID and fileName from the database (just the file name, not a path)
  return {
    id: savedImage.id,
    fileName: savedImage.fileName ?? 'Kind Image',
  } // Fallback value
}
