// /server/api/art/upload.post.ts
import { defineEventHandler, readMultipartFormData } from 'h3'
import { errorHandler } from '../../utils/error'
import {
  uploadArtImage,
  type UploadArtImageInput,
} from '../../utils/UploadArtImage'

type MultipartForm = Awaited<ReturnType<typeof readMultipartFormData>>

function getField(form: MultipartForm, name: string): string | undefined {
  return form?.find((field) => field.name === name)?.data?.toString()
}

function getNumberField(form: MultipartForm, name: string): number | null {
  const value = getField(form, name)

  if (!value) return null

  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function getNullableNumberField(
  form: MultipartForm,
  name: string,
): number | null {
  const value = getField(form, name)

  if (!value) return null

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

function getBooleanField(
  form: MultipartForm,
  name: string,
  fallback = false,
): boolean {
  const value = getField(form, name)

  if (value === undefined) return fallback

  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
}

function getNumberListField(form: MultipartForm, name: string): number[] {
  const directValues =
    form
      ?.filter((field) => field.name === name)
      .map((field) => field.data?.toString())
      .filter(Boolean) || []

  const bracketValues =
    form
      ?.filter((field) => field.name === `${name}[]`)
      .map((field) => field.data?.toString())
      .filter(Boolean) || []

  return [...directValues, ...bracketValues]
    .flatMap((value) => String(value).split(','))
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0)
}

function getImageFile(form: MultipartForm) {
  return form?.find((file) => {
    return file.name === 'file' || file.name === 'image'
  })
}

export default defineEventHandler(async (event) => {
  try {
    const form = await readMultipartFormData(event)

    if (!form?.length) {
      event.node.res.statusCode = 400
      return {
        success: false,
        message: 'No form data received.',
      }
    }

    const imageFile = getImageFile(form)

    if (!imageFile?.data?.length) {
      event.node.res.statusCode = 400
      return {
        success: false,
        message: 'No image file received.',
      }
    }

    const userId = getNumberField(form, 'userId') || 10
    const galleryId = getNumberField(form, 'galleryId') || 21
    const galleryName = getField(form, 'galleryName') || 'userUpload'
    const fileType = getField(form, 'fileType') || imageFile.type || 'png'
    const fileName = getField(form, 'fileName') || imageFile.filename || null

    const input: UploadArtImageInput = {
      uploadedFile: {
        data: imageFile.data,
        filename: imageFile.filename || fileName || 'Kind Image',
      },
      galleryName,
      userId,
      galleryId,
      fileType,
      fileName,
      artCollectionId:
        getNumberField(form, 'artCollectionId') ||
        getNumberField(form, 'collectionId'),
      artCollectionIds: [
        ...getNumberListField(form, 'artCollectionIds'),
        ...getNumberListField(form, 'collectionIds'),
      ],
      imagePath: getField(form, 'imagePath') || null,
      rarity: getNullableNumberField(form, 'rarity'),
      path: getField(form, 'path') || null,
      promptString: getField(form, 'promptString') || null,
      artPrompt: getField(form, 'artPrompt') || null,
      negativePrompt: getField(form, 'negativePrompt') || null,
      sampler: getField(form, 'sampler') || null,
      seed: getNullableNumberField(form, 'seed'),
      steps: getNullableNumberField(form, 'steps'),
      cfg: getNullableNumberField(form, 'cfg'),
      cfgHalf: getBooleanField(form, 'cfgHalf', false),
      designer: getField(form, 'designer') || null,
      genres: getField(form, 'genres') || null,
      isPublic: getBooleanField(form, 'isPublic', false),
      isMature: getBooleanField(form, 'isMature', false),
      botId: getNumberField(form, 'botId'),
      characterId: getNumberField(form, 'characterId'),
      pitchId: getNumberField(form, 'pitchId'),
      promptId: getNumberField(form, 'promptId'),
      resourceId: getNumberField(form, 'resourceId'),
      rewardId: getNumberField(form, 'rewardId'),
      dreamId: getNumberField(form, 'dreamId'),
      scenarioId: getNumberField(form, 'scenarioId'),
      tagIds: getNumberListField(form, 'tagIds'),
    }

    const data = await uploadArtImage(input)

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'ArtImage uploaded.',
      data,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)

    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Error uploading the art image.',
      error: handledError.message || 'An unknown error occurred.',
    }
  }
})
