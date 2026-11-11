import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { errorHandler } from '~/server/utils/error'
import {
  bibleCharacterKey,
  requireMonstriqueStudio,
} from '~/server/utils/monstriqueBible'
import prisma from '~/server/utils/prisma'
import { LORA_STATUSES } from '~/utils/monstrique/bibleLanes'

type BiblePatch = {
  displayName?: unknown
  notes?: unknown
  loraStatus?: unknown
  loraResourceName?: unknown
  heroArtImageId?: unknown
}

function optionalText(value: unknown, max: number, field: string) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string' || value.length > max)
    throw createError({ statusCode: 400, statusMessage: `Invalid ${field}.` })
  return value.trim()
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMonstriqueStudio(event)
    const characterKey = bibleCharacterKey(getRouterParam(event, 'key'))
    const body = ((await readBody(event)) ?? {}) as BiblePatch
    const data: Record<string, unknown> = {}
    const displayName = optionalText(body.displayName, 160, 'name')
    if (displayName !== undefined) data.displayName = displayName
    const notes = optionalText(body.notes, 20000, 'notes')
    if (notes !== undefined) data.notes = notes
    const loraResourceName = optionalText(
      body.loraResourceName,
      255,
      'LoRA resource name',
    )
    if (loraResourceName !== undefined) data.loraResourceName = loraResourceName
    if (body.loraStatus !== undefined) {
      if (!(LORA_STATUSES as readonly unknown[]).includes(body.loraStatus))
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid LoRA status.',
        })
      data.loraStatus = body.loraStatus
    }
    if (body.heroArtImageId !== undefined) {
      if (
        body.heroArtImageId !== null &&
        !Number.isInteger(body.heroArtImageId)
      )
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid hero image.',
        })
      data.heroArtImageId = body.heroArtImageId
    }
    const entry = await prisma.monstriqueBibleEntry.upsert({
      where: { characterKey },
      create: { characterKey, ...data, updatedBy: auth.user.id },
      update: { ...data, updatedBy: auth.user.id },
    })
    return { success: true, data: { entry } }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message }
  }
})
