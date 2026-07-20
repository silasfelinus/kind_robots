// /server/api/characters/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { normalizeSlugInput } from '../../../utils/slugify'
import {
  getCharacterNameKey,
  getUniqueCharacterSlug,
} from '../../utils/characterSlug'
import {
  assertCharacterMutationInput,
  assertCharacterRelationsAttachable,
  buildCharacterCreateInput,
  normalizeCharacterName,
} from './mutation'
import {
  assertCharacterCreateCompatibility,
  characterSingularCreateFields,
  stripCharacterCompatibilityFields,
} from './compatibility'
import { characterMutationSelect } from './selects'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const rawBody = await readBody<unknown>(event)

    assertCharacterMutationInput(rawBody, {
      allowedFields: characterSingularCreateFields,
      context: 'Character create payload',
    })
    assertCharacterCreateCompatibility(rawBody)

    const body = stripCharacterCompatibilityFields(rawBody)

    await assertCharacterRelationsAttachable(
      body,
      user.id,
      user.Role === 'ADMIN' || user.id === 1,
    )

    const name = normalizeCharacterName(body.name)
    const nameKey = getCharacterNameKey(name)

    if (!nameKey) {
      throw createError({
        statusCode: 400,
        message: 'Character name must contain at least one letter or number.',
      })
    }

    const duplicate = await prisma.character.findFirst({
      where: {
        userId: user.id,
        name,
      },
      select: { id: true },
    })

    if (duplicate) {
      throw createError({
        statusCode: 409,
        message: `Character with this name already exists (ID ${duplicate.id}).`,
      })
    }

    const requestedSlug = normalizeSlugInput(body.slug)
    const slug = await getUniqueCharacterSlug(prisma, requestedSlug ?? name)
    const createInput = await buildCharacterCreateInput({
      rawInput: body,
      userId: user.id,
      slug,
    })

    const data = await prisma.character.create({
      data: createInput,
      select: characterMutationSelect,
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Character created successfully.',
      data,
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to create character.',
      data: null,
      statusCode,
    }
  }
})
