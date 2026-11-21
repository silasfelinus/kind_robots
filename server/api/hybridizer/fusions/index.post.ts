import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  canonicalFusionPair,
  clientIngredientKey,
  fusionDisplayTitle,
  HYBRIDIZER_MAX_DEPTH,
} from '~/server/utils/hybridizerFusion'
import { resolveHybridizerIngredient } from '~/server/utils/hybridizerIngredients'

type InputInfo = { title: string; depth: number; isPublic: boolean }

function invalid(message: string): never {
  throw createError({ statusCode: 400, message })
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = await readBody<{ leftKey?: unknown; rightKey?: unknown }>(
      event,
    )
    if (typeof body?.leftKey !== 'string' || typeof body?.rightKey !== 'string')
      invalid('Select two Hybridizer ingredients.')

    let pair: ReturnType<typeof canonicalFusionPair>
    try {
      pair = canonicalFusionPair(body.leftKey, body.rightKey)
    } catch (error) {
      invalid(
        error instanceof Error ? error.message : 'Invalid Hybridizer inputs.',
      )
    }

    // Visibility is inherited: a fusion is public only when both inputs are,
    // so anything made from a private upload stays private to its owner.
    async function resolveInput(key: string): Promise<InputInfo> {
      const info = await resolveHybridizerIngredient(key, auth.user.id)
      return { title: info.title, depth: info.depth, isPublic: info.isPublic }
    }

    const [first, second] = await Promise.all([
      resolveInput(pair.leftKey),
      resolveInput(pair.rightKey),
    ])
    const depth = Math.max(first.depth, second.depth) + 1
    if (depth > HYBRIDIZER_MAX_DEPTH) invalid('Maximum fusion depth reached.')

    const existing = await prisma.hybridizerFusion.findUnique({
      where: { id: pair.id },
    })
    if (existing) {
      if (!existing.isPublic && existing.creatorUserId !== auth.user.id)
        throw createError({ statusCode: 404, message: 'Hybrid not available.' })
      return {
        success: true,
        data: {
          key: 'fusion:' + existing.id,
          title: existing.title,
          taxonomy: 'HYBRID',
          sources: [
            clientIngredientKey(existing.leftKey),
            clientIngredientKey(existing.rightKey),
          ],
          depth: existing.depth,
          status: existing.status,
          isPublic: existing.isPublic,
          artJobId: existing.artJobId,
          artImageId: existing.artImageId,
          createdAt: existing.createdAt,
        },
        cached: true,
      }
    }

    let created
    try {
      created = await prisma.hybridizerFusion.create({
        data: {
          ...pair,
          title: fusionDisplayTitle(first.title, second.title),
          depth,
          creatorUserId: auth.user.id,
          isPublic: first.isPublic && second.isPublic,
          status: 'STUDY',
        },
      })
    } catch (error) {
      if ((error as { code?: string })?.code !== 'P2002') throw error
      created = await prisma.hybridizerFusion.findUnique({
        where: { id: pair.id },
      })
      if (!created) throw error
      if (!created.isPublic && created.creatorUserId !== auth.user.id)
        throw createError({ statusCode: 404, message: 'Hybrid not available.' })
    }

    return {
      success: true,
      data: {
        key: 'fusion:' + created.id,
        title: created.title,
        taxonomy: 'HYBRID',
        sources: [
          clientIngredientKey(created.leftKey),
          clientIngredientKey(created.rightKey),
        ],
        depth: created.depth,
        status: created.status,
        isPublic: created.isPublic,
        artJobId: created.artJobId,
        artImageId: created.artImageId,
        createdAt: created.createdAt,
      },
      cached: false,
    }
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
