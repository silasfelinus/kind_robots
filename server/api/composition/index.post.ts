// /server/api/compositions/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { Prisma, Composition } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const modelName = 'composition'
  const singularLabel = 'Composition'
  const pluralLabel = 'Compositions'

  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<Partial<Composition> | Partial<Composition>[]>(
      event,
    )
    const userId = user.id

    const normalize = (
      entry: Partial<Composition>,
    ): Prisma.CompositionCreateInput => {
      const {
        title,
        description,
        label,
        mode,
        characterId,
        dreamId,
        scenarioId,
        pitchId,
        rewardId,
        characterBlurb,
        dreamBlurb,
        scenarioBlurb,
        pitchBlurb,
        rewardBlurb,
        narrativeText,
        artPrompt,
        isPublic,
        isMature,
        designer,
      } = entry

      if (!title || typeof title !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'The "title" field is required.',
        })
      }

      const data: Prisma.CompositionCreateInput = {
        title,
        description: description || null,
        label: label || null,
        mode: mode || 'both',
        isPublic: isPublic ?? true,
        isMature: isMature ?? false,
        designer: designer || '',
        characterBlurb: characterBlurb || null,
        dreamBlurb: dreamBlurb || null,
        scenarioBlurb: scenarioBlurb || null,
        pitchBlurb: pitchBlurb || null,
        rewardBlurb: rewardBlurb || null,
        narrativeText: narrativeText || null,
        artPrompt: artPrompt || null,
        User: { connect: { id: userId } },
      }

      if (characterId) data.Character = { connect: { id: characterId } }
      if (dreamId) data.Dream = { connect: { id: dreamId } }
      if (scenarioId) data.Scenario = { connect: { id: scenarioId } }
      if (pitchId) data.Pitch = { connect: { id: pitchId } }
      if (rewardId) data.Reward = { connect: { id: rewardId } }

      return data
    }

    // Batch creation
    if (Array.isArray(body)) {
      const created: Composition[] = []
      const skipped: string[] = []

      for (const entry of body) {
        try {
          const result = await prisma[modelName].create({
            data: normalize(entry),
          })
          created.push(result)
        } catch (err: any) {
          if (err.code === 'P2002') skipped.push(entry.title || '(untitled)')
          else throw err
        }
      }

      event.node.res.statusCode = 201
      return {
        success: true,
        message: `${created.length} ${pluralLabel} created, ${skipped.length} skipped.`,
        data: created,
        skipped,
        count: created.length,
        statusCode: 201,
      }
    }

    const data = await prisma[modelName].create({ data: normalize(body) })
    event.node.res.statusCode = 201
    return {
      success: true,
      message: `${singularLabel} created successfully.`,
      data,
      statusCode: 201,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || `Failed to create ${singularLabel}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
