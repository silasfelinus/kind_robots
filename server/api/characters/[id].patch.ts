// /server/api/characters/[id].patch.ts
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { normalizeSlugInput } from '../../../utils/slugify'
import { getUniqueCharacterSlug } from '../../utils/characterSlug'
import {
  assertCharacterMutationInput,
  buildCharacterUpdateInput,
  characterPatchFields,
  normalizeCharacterName,
} from './mutation'
import { characterMutationSelect } from './selects'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Character ID. It must be a positive integer.',
      })
    }

    const { isValid, user, kind } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existingCharacter = await prisma.character.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        name: true,
        slug: true,
      },
    })

    if (!existingCharacter) {
      throw createError({
        statusCode: 404,
        message: `Character with ID ${id} does not exist.`,
      })
    }

    const isServerKey = kind === 'server'
    const isAdmin = user.Role === 'ADMIN' || user.id === 1
    const isOwner = existingCharacter.userId === user.id

    if (!isAdmin && !isServerKey && !isOwner) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this Character.',
      })
    }

    const body = await readBody<unknown>(event)

    assertCharacterMutationInput(body, {
      allowedFields: characterPatchFields,
      context: 'Character patch payload',
      requireNonEmpty: true,
    })

    const data = await buildCharacterUpdateInput(body)

    if (body.name !== undefined) {
      const name = normalizeCharacterName(body.name)
      const duplicate = await prisma.character.findFirst({
        where: {
          userId: existingCharacter.userId,
          name,
          NOT: { id },
        },
        select: { id: true },
      })

      if (duplicate) {
        throw createError({
          statusCode: 409,
          message: `Character with this name already exists (ID ${duplicate.id}).`,
        })
      }

      data.name = name
    }

    const requestedSlug = normalizeSlugInput(body.slug)

    if (body.slug !== undefined) {
      data.slug = requestedSlug
        ? await getUniqueCharacterSlug(prisma, requestedSlug, { excludeId: id })
        : null
    } else if (!existingCharacter.slug && body.name !== undefined) {
      data.slug = await getUniqueCharacterSlug(prisma, data.name as string, {
        excludeId: id,
      })
    }

    if (Object.keys(data).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No valid Character update fields provided.',
      })
    }

    const updatedCharacter = await prisma.character.update({
      where: { id },
      data,
      select: characterMutationSelect,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Character updated successfully.',
      data: updatedCharacter,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to update Character.',
      data: null,
      statusCode,
    }
  }
})
