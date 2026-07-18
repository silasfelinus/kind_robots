// /server/api/art/upload.post.ts
import {
  createError,
  defineEventHandler,
  getHeader,
  readMultipartFormData,
} from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import {
  uploadArtImage,
  type UploadArtImageInput,
} from '../../utils/UploadArtImage'

type MultipartForm = Awaited<ReturnType<typeof readMultipartFormData>>

const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 1024 * 1024

const IMAGE_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/webp': 'webp',
} as const

const ALLOWED_FIELDS = new Set([
  'file',
  'image',
  'galleryName',
  'fileName',
  'designer',
  'promptString',
  'artPrompt',
  'path',
  'negativePrompt',
  'sampler',
  'genres',
  'seed',
  'steps',
  'cfg',
  'cfgHalf',
  'isPublic',
  'isMature',
])

function getField(form: MultipartForm, name: string): string | undefined {
  return form?.find((field) => field.name === name)?.data?.toString()
}

function getTextField(
  form: MultipartForm,
  name: string,
  maxLength: number,
): string | null {
  const value = getField(form, name)?.trim()

  if (!value) return null

  if (value.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `${name} must be ${maxLength} characters or fewer.`,
    })
  }

  return value
}

function getNumberField(form: MultipartForm, name: string): number | null {
  const value = getField(form, name)

  if (value === undefined || value.trim() === '') return null

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    throw createError({
      statusCode: 400,
      message: `${name} must be a finite number.`,
    })
  }

  return parsed
}

function getBooleanField(
  form: MultipartForm,
  name: string,
  fallback = false,
): boolean {
  const value = getField(form, name)

  if (value === undefined) return fallback

  const normalized = value.trim().toLowerCase()

  if (['true', '1', 'yes', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'off'].includes(normalized)) return false

  throw createError({
    statusCode: 400,
    message: `${name} must be a boolean.`,
  })
}

function getImageFile(form: MultipartForm) {
  return form?.find((field) => {
    return field.name === 'file' || field.name === 'image'
  })
}

function assertRequestSize(event: Parameters<typeof getHeader>[0]): void {
  const contentLength = Number(getHeader(event, 'content-length') || 0)

  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    throw createError({
      statusCode: 413,
      message: 'Image upload is too large. Maximum image size is 15 MB.',
    })
  }
}

function assertAllowedFields(form: MultipartForm): void {
  const unknownFields = [
    ...new Set(
      (form || [])
        .map((field) => field.name)
        .filter(
          (name): name is string =>
            typeof name === 'string' && name.length > 0 && !ALLOWED_FIELDS.has(name),
        ),
    ),
  ]

  if (unknownFields.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported upload fields: ${unknownFields.join(', ')}. Ownership and relationships are managed by authenticated resource APIs.`,
    })
  }
}

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    assertRequestSize(event)

    const form = await readMultipartFormData(event)

    if (!form?.length) {
      throw createError({
        statusCode: 400,
        message: 'No multipart form data received.',
      })
    }

    assertAllowedFields(form)

    const imageFile = getImageFile(form)

    if (!imageFile?.data?.length) {
      throw createError({
        statusCode: 400,
        message: 'No image file received.',
      })
    }

    if (imageFile.data.length > MAX_IMAGE_BYTES) {
      throw createError({
        statusCode: 413,
        message: 'Image upload is too large. Maximum image size is 15 MB.',
      })
    }

    const mimeType = String(imageFile.type || '').toLowerCase()
    const fileType = IMAGE_TYPES[mimeType as keyof typeof IMAGE_TYPES]

    if (!fileType) {
      throw createError({
        statusCode: 415,
        message: 'Only PNG, JPEG, and WebP images are supported.',
      })
    }

    const fileName =
      getTextField(form, 'fileName', 255) || imageFile.filename || 'Kind Image'

    const input: UploadArtImageInput = {
      uploadedFile: {
        data: imageFile.data,
        filename: imageFile.filename || fileName,
      },
      userId: user.id,
      galleryName: getTextField(form, 'galleryName', 80) || 'userUpload',
      fileType,
      fileName,
      path: getTextField(form, 'path', 512),
      promptString: getTextField(form, 'promptString', 10_000),
      artPrompt: getTextField(form, 'artPrompt', 10_000),
      negativePrompt: getTextField(form, 'negativePrompt', 10_000),
      sampler: getTextField(form, 'sampler', 255),
      seed: getNumberField(form, 'seed'),
      steps: getNumberField(form, 'steps'),
      cfg: getNumberField(form, 'cfg'),
      cfgHalf: getBooleanField(form, 'cfgHalf', false),
      designer:
        getTextField(form, 'designer', 255) || user.username || `User ${user.id}`,
      genres: getTextField(form, 'genres', 2_000),
      isPublic: getBooleanField(form, 'isPublic', false),
      isMature: getBooleanField(form, 'isMature', false),
    }

    const data = await uploadArtImage(input)

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'ArtImage uploaded.',
      data,
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)

    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Error uploading the art image.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
