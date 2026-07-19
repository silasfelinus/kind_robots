// /server/api/reactions/component/[id].get.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'
import {
  firstPartyReactionAuthor,
  type FirstPartyReactionAuthor,
} from '@/utils/reactions/firstPartyReactionAuthor'

type ComponentReactionRow = {
  id: number
  createdAt: Date
  updatedAt: Date | null
  comment: string | null
  userId: number
  componentId: number | null
  reactionType: string
  reactionCategory: string
  rating: number
  artImageId: number | null
  botId: number | null
  promptId: number | null
  resourceId: number | null
  rewardId: number | null
  chatId: number | null
  dreamId: number | null
  artCollectionId: number | null
  butterflyId: number | null
  characterId: number | null
  scenarioId: number | null
  themeId: number | null
  challengeSubmissionId: number | null
  projectId: number | null
  facetId: number | null
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
  row: ComponentReactionRow,
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

function projectComponentReaction(row: ComponentReactionRow) {
  const {
    authorBotId: _authorBotId,
    authorCharacterId: _authorCharacterId,
    userUsername,
    userName,
    userAvatarImage,
    userRole,
    userIsPublic,
    authorBotName: _authorBotName,
    authorBotAvatarImage: _authorBotAvatarImage,
    authorBotImagePath: _authorBotImagePath,
    authorBotRole: _authorBotRole,
    authorCharacterName: _authorCharacterName,
    authorCharacterImagePath: _authorCharacterImagePath,
    authorCharacterRole: _authorCharacterRole,
    ...reaction
  } = row

  return {
    ...reaction,
    User: {
      id: row.userId,
      username: userUsername,
      name: userName,
      avatarImage: userAvatarImage,
      Role: userRole,
      isPublic: Boolean(userIsPublic),
    },
    Author: projectFirstPartyAuthor(row),
  }
}

export default defineEventHandler(async (event) => {
  const componentId = Number(getRouterParam(event, 'id'))

  try {
    if (!Number.isInteger(componentId) || componentId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'A valid component ID is required.',
      })
    }

    const rows = await prisma.$queryRaw<ComponentReactionRow[]>`
      SELECT
        r.*,
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
      LEFT JOIN Character ch ON ch.id = r.authorCharacterId
      WHERE r.componentId = ${componentId}
      ORDER BY r.createdAt DESC, r.id DESC
    `
    const data = rows.map(projectComponentReaction)

    event.node.res.statusCode = 200

    return {
      success: true,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message:
        handledError.message ||
        `Failed to retrieve reactions for component with ID ${componentId}.`,
      data: [],
      statusCode: event.node.res.statusCode,
    }
  }
})
