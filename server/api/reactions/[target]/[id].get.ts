// /server/api/reactions/[target]/[id].get.ts
//
// Read the reactions on one object, for any reaction target type.
//
// There were four hand-written read routes -- art, chat, component, dream --
// for thirteen target types, and the store asks for
// `/api/reactions/${targetType}/${id}` using the camelCase type names, so
// `artImage` never even matched the `art` directory. Everything else
// (reward, character, bot, scenario, resource, facet, ...) 404'd, the store
// swallowed the error, and the list silently stayed empty. Reviews could be
// written and never read back.
//
// Nitro prefers a static segment over a dynamic one, so the four existing
// routes still win for their own paths and this handles the rest.
//
// Visibility: reactions are only as public as the thing they are attached to,
// so the target is checked first and a private object 403s rather than leaking
// its reaction list. Component and Chat keep their own routes and are not
// reachable here.
import { createError, defineEventHandler } from 'h3'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'
import { getOptionalApiUser } from '../../../utils/authGuard'
import { KARMA_REF_TARGET_COLUMNS, isKarmaRefType } from '~/utils/karmaRefTypes'
import {
  canViewReactionsOn,
  isOwnedReactionTarget,
} from '../../../utils/reactionVisibility'

export default defineEventHandler(async (event) => {
  try {
    const target = String(event.context.params?.target || '')
    const targetId = Number(event.context.params?.id)

    if (!isKarmaRefType(target)) {
      throw createError({
        statusCode: 400,
        message: `${target || 'that'} is not a reaction target type.`,
      })
    }

    if (!Number.isInteger(targetId) || targetId <= 0) {
      throw createError({
        statusCode: 400,
        message: `A valid ${target} id is required.`,
      })
    }

    if (!isOwnedReactionTarget(target)) {
      throw createError({
        statusCode: 400,
        message: `${target} reactions are read from their own route.`,
      })
    }

    const auth = await getOptionalApiUser(event)
    const viewer = {
      userId: auth?.user.id ?? null,
      isAdmin: auth?.isAdmin ?? false,
    }

    // Comments inherit their target's audience -- a public object's reactions
    // are readable by anyone, signed in or not. Shared with [id].get.ts so the
    // two cannot answer differently about the same reaction.
    if (!(await canViewReactionsOn(target, targetId, viewer))) {
      throw createError({
        statusCode: 403,
        message: `You do not have permission to read reactions on this ${target}.`,
      })
    }

    const reactions = await prisma.reaction.findMany({
      where: { [KARMA_REF_TARGET_COLUMNS[target]]: targetId },
      include: {
        User: { select: { id: true, username: true, avatarImage: true } },
        AuthorBot: { select: { id: true, name: true, avatarImage: true, BotType: true } },
        AuthorCharacter: {
          select: { id: true, name: true, imagePath: true, role: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Fetched ${reactions.length} reaction(s) for ${target} #${targetId}.`,
      data: reactions,
      count: reactions.length,
      statusCode: 200,
    }
  } catch (error) {
    const { success, message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success,
      message: message || 'Failed to fetch reactions.',
      data: [],
      count: 0,
      statusCode: statusCode || 500,
    }
  }
})
