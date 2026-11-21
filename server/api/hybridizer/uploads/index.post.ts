import { randomBytes } from 'node:crypto'
import {
  createError,
  defineEventHandler,
  getHeader,
  readMultipartFormData,
} from 'h3'
import sharp from 'sharp'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { uploadArtImage } from '~/server/utils/UploadArtImage'
import {
  HYBRIDIZER_UPLOAD_ACTIVE_LIMIT,
  HYBRIDIZER_UPLOAD_DAILY_LIMIT,
  HYBRIDIZER_UPLOAD_MAX_BYTES,
  HYBRIDIZER_UPLOAD_OUTPUT_SIDE,
  sniffUploadImageType,
  validateUploadDimensions,
  validateUploadText,
} from '~/utils/hybridizer/uploadRules'
import { serializeHybridizerUpload } from '~/server/utils/hybridizerUploadDto'

const ALLOWED_FIELDS = new Set([
  'file',
  'title',
  'description',
  'kind',
  'consent',
])

function badRequest(message: string, statusCode = 400): never {
  throw createError({ statusCode, message })
}

// Player-supplied Hybridizer ingredient (t-008). Private by construction: the
// image is stored as a private, non-mature ArtImage owned by the uploader,
// re-encoded so camera metadata (GPS, device) never survives, and the
// ingredient can only be used by its owner. Nothing here can make it public.
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const contentLength = Number(getHeader(event, 'content-length') || 0)
    if (contentLength > HYBRIDIZER_UPLOAD_MAX_BYTES + 64 * 1024)
      badRequest('Images must be 5 MB or smaller.', 413)

    const form = await readMultipartFormData(event)
    if (!form?.length) badRequest('Choose an image to upload.')
    const unknown = form
      .map((field) => field.name)
      .filter((name) => !name || !ALLOWED_FIELDS.has(name))
    if (unknown.length) badRequest('Unsupported upload fields.')
    const field = (name: string) =>
      form.find((entry) => entry.name === name)?.data?.toString('utf8')

    if (field('consent') !== 'true')
      badRequest('Confirm you have the right to use this image.')
    const text = validateUploadText({
      title: field('title'),
      description: field('description') ?? '',
      kind: field('kind') ?? 'creature',
    })
    if (!text.ok) badRequest(text.message)

    const file = form.find((entry) => entry.name === 'file')
    if (!file?.data?.length) badRequest('Choose an image to upload.')
    if (file.data.length > HYBRIDIZER_UPLOAD_MAX_BYTES)
      badRequest('Images must be 5 MB or smaller.', 413)
    if (!sniffUploadImageType(file.data))
      badRequest('Upload a PNG, JPEG or WebP image.', 415)

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [recent, active] = await Promise.all([
      prisma.hybridizerUpload.count({
        where: { ownerUserId: user.id, createdAt: { gte: since } },
      }),
      prisma.hybridizerUpload.count({
        where: { ownerUserId: user.id, isActive: true },
      }),
    ])
    if (recent >= HYBRIDIZER_UPLOAD_DAILY_LIMIT)
      badRequest(
        `You can add ${HYBRIDIZER_UPLOAD_DAILY_LIMIT} ingredients a day. Try again tomorrow.`,
        429,
      )
    if (active >= HYBRIDIZER_UPLOAD_ACTIVE_LIMIT)
      badRequest(
        `You have ${HYBRIDIZER_UPLOAD_ACTIVE_LIMIT} uploaded ingredients. Remove one to add another.`,
        409,
      )

    // Decode fully (rejects truncated or disguised files), honour EXIF
    // orientation, then re-encode without any metadata.
    let encoded: Buffer
    try {
      const image = sharp(file.data, { limitInputPixels: 40_000_000 })
      const meta = await image.metadata()
      const problem = validateUploadDimensions(meta.width, meta.height)
      if (problem) badRequest(problem)
      encoded = await image
        .rotate()
        .resize(HYBRIDIZER_UPLOAD_OUTPUT_SIDE, HYBRIDIZER_UPLOAD_OUTPUT_SIDE, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer()
    } catch (error) {
      if ((error as { statusCode?: number })?.statusCode) throw error
      badRequest('That file is not a readable image.', 415)
    }

    const art = await uploadArtImage({
      uploadedFile: { data: encoded, filename: 'hybridizer-ingredient.webp' },
      userId: user.id,
      galleryName: 'hybridizer-upload',
      fileType: 'webp',
      fileName: 'ingredient',
      designer: 'Hybridizer upload',
      isPublic: false,
      isMature: false,
    })
    const upload = await prisma.hybridizerUpload.create({
      data: {
        id: randomBytes(12).toString('hex'),
        ownerUserId: user.id,
        title: text.title,
        description: text.description,
        kind: text.kind,
        artImageId: art.id,
        consentAt: new Date(),
      },
    })
    event.node.res.statusCode = 201
    return { success: true, data: serializeHybridizerUpload(upload) }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return {
      success: false,
      message: handled.message,
      statusCode: event.node.res.statusCode,
    }
  }
})
