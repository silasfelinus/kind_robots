// /server/api/admin/wonderlab/reactions/[id].get.ts
import { createError, defineEventHandler, getRouterParam, H3Error } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import prisma from '@/server/utils/prisma'
import {
  firstPartyReactionAuthor,
  type FirstPartyReactionAuthor,
} from '@/utils/reactions/firstPartyReactionAuthor'

type GuardedReactionRow = {
  id: number
  comment: string | null
  userId: number
  componentId: number | null
  reactionType: string
  rating: number
  authorBotId: number | null
  authorCharacterId: number | null
  userUsername: string | null
  userName: string | null
  userAvatarImage: string | null
  userRole: string | null
  userIsPublic: boolean | number
  authorBotName: string | null
  authorBotAvatarImage: string | null
  authorBotImagePath: string | null
  authorBotRole: string | null
  authorCharacterName: string | null
  authorCharacterImagePath: string | null
  authorCharacterRole: string | null
}

function projectFirstPartyAuthor(
  row: GuardedReactionRow,
): FirstPartyReactionAuthor | null {
  try {
    return firstPartyReactionAuthor({
      authorBotId: row.authorBotId,
      authorCharacterId: row.authorCharacterId,
      AuthorBot: row.authorBotId
        ? {
            id: row.authorBotId,
            name: row.authorBotName,
            avatarImage: row.authorBotAvatarImage,
            imagePath: row.authorBotImagePath,
            BotType: row.authorBotRole,
          }
        : null,
      AuthorCharacter: row.authorCharacterId
        ? {
            id: row.authorCharacterId,
            name: row.authorCharacterName,
            imagePath: row.authorCharacterImagePath,
            characterType: row.authorCharacterRole,
          }
        : null,
    })
  } catch {
    return null
  }
}

function projectGuardedReaction(row: GuardedReactionRow) {
  return {
    id: row.id,
    comment: row.comment,
    userId: row.userId,
    componentId: row.componentId,
    reactionType: row.reactionType,
    rating: row.rating,
    User: {
      id: row.userId,
      username: row.userUsername,
      name: row.userName,
      avatarImage: row.userAvatarImage,
      Role: row.userRole,
      isPublic: Boolean(row.userIsPublic),
    },
    Author: projectFirstPartyAuthor(row),
  }
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const reactionId = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(reactionId) || reactionId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Reaction ID.' })
    }

    const rows = await prisma.$queryRaw<GuardedReactionRow[]>`
      SELECT
        r.id,
        r.comment,
        r.userId,
        r.componentId,
        r.reactionType,
        r.rating,
        r.authorBotId,
        r.authorCharacterId,
        u.username AS userUsername,
        u.name AS userName,
        u.avatarImage AS userAvatarImage,
        u.Role AS userRole,
        u.isPublic AS userIsPublic,
        b.name AS authorBotName,
        b.avatarImage AS authorBotAvatarImage,
        b.imagePath AS authorBotImagePath,
        b.BotType AS authorBotRole,
        ch.name AS authorCharacterName,
        ch.imagePath AS authorCharacterImagePath,
        ch.role AS authorCharacterRole
      FROM Reaction r
      INNER JOIN User u ON u.id = r.userId
      LEFT JOIN Bot b ON b.id = r.authorBotId
      LEFT JOIN \`Character\` ch ON ch.id = r.authorCharacterId
      WHERE r.id = ${reactionId}
      LIMIT 1
    `

    const row = rows[0]
    if (!row) {
      throw createError({ statusCode: 404, message: 'Reaction not found.' })
    }

    return { success: true, data: projectGuardedReaction(row) }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
