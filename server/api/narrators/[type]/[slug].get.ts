// /server/api/narrators/[type]/[slug].get.ts
import { defineEventHandler, createError, getRouterParam } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'

const defaultNarratorBotId = 433

const artImageSelect = {
  id: true,
  fileName: true,
  fileType: true,
  path: true,
  imagePath: true,
  artPrompt: true,
  promptString: true,
}

const expressionMediaSelect = {
  id: true,
  expression: true,
  kind: true,
  label: true,
  emoticon: true,
  expressionKey: true,
  imagePath: true,
  message: true,
  additionalPhrases: true,
  isActive: true,
  designer: true,
  artPrompt: true,
  ArtImage: {
    select: artImageSelect,
  },
}

function readImagePath(source?: {
  imagePath?: string | null
  avatarImage?: string | null
  ArtImage?: {
    imagePath?: string | null
    path?: string | null
    fileName?: string | null
  } | null
} | null) {
  return (
    source?.imagePath ||
    source?.avatarImage ||
    source?.ArtImage?.imagePath ||
    source?.ArtImage?.path ||
    source?.ArtImage?.fileName ||
    null
  )
}

export default defineEventHandler(async (event) => {
  try {
    const type = String(getRouterParam(event, 'type') || '').toLowerCase()
    const slug = String(getRouterParam(event, 'slug') || '').trim()

    if (!slug) {
      throw createError({
        statusCode: 400,
        message: 'Narrator slug is required.',
      })
    }

    if (type !== 'bot' && type !== 'character') {
      throw createError({
        statusCode: 400,
        message: 'Narrator type must be bot or character.',
      })
    }

    if (type === 'bot') {
      const bot = await prisma.bot.findFirst({
        where: {
          slug,
          isActive: true,
          isPublic: true,
        },
        select: {
          id: true,
          BotType: true,
          name: true,
          slug: true,
          subtitle: true,
          description: true,
          tagline: true,
          personality: true,
          avatarImage: true,
          imagePath: true,
          artImageId: true,
          narrativeVoice: true,
          forgeIntro: true,
          botIntro: true,
          userIntro: true,
          prompt: true,
          serverId: true,
          serverName: true,
          chatBorderImage: true,
          ArtImage: {
            select: artImageSelect,
          },
          ExpressionMedia: {
            where: { isActive: true },
            select: expressionMediaSelect,
            orderBy: { expression: 'asc' },
          },
          NarratorThreads: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
              Topic: true,
            },
          },
        },
      })

      if (!bot) {
        throw createError({
          statusCode: 404,
          message: `Narrator bot "${slug}" was not found.`,
        })
      }

      const imagePath = readImagePath(bot)

      return {
        success: true,
        message: 'Narrator bot loaded.',
        data: {
          ...bot,
          avatarImage: bot.avatarImage || imagePath,
          imagePath,
        },
      }
    }

    const character = await prisma.character.findFirst({
      where: {
        slug,
        isActive: true,
        isPublic: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        title: true,
        role: true,
        species: true,
        class: true,
        personality: true,
        backstory: true,
        drive: true,
        quirks: true,
        presentation: true,
        imagePath: true,
        artImageId: true,
        ArtImage: {
          select: artImageSelect,
        },
        ExpressionMedia: {
          where: { isActive: true },
          select: expressionMediaSelect,
          orderBy: { expression: 'asc' },
        },
      },
    })

    if (!character) {
      throw createError({
        statusCode: 404,
        message: `Narrator character "${slug}" was not found.`,
      })
    }

    const imagePath = readImagePath(character)
    const descriptor = [
      character.title,
      character.role,
      character.species,
      character.class,
    ]
      .filter(Boolean)
      .join(' • ')

    return {
      success: true,
      message: 'Narrator character loaded.',
      data: {
        id: defaultNarratorBotId,
        sourceCharacterId: character.id,
        BotType: 'NARRATOR',
        name: character.name,
        slug: character.slug,
        subtitle: character.title || descriptor || null,
        description: character.backstory || descriptor || null,
        tagline: character.role || null,
        personality: character.personality || character.quirks || null,
        avatarImage: imagePath,
        imagePath,
        artImageId: character.artImageId,
        narrativeVoice: character.presentation || descriptor || null,
        forgeIntro: character.drive || character.quirks || null,
        botIntro:
          character.backstory ||
          descriptor ||
          `${character.name} is guiding this page.`,
        userIntro: `Ask ${character.name} about this page.`,
        prompt: [
          `You are ${character.name}, acting as the page narrator for Kind Robots.`,
          character.personality ? `Personality: ${character.personality}` : '',
          character.backstory ? `Backstory: ${character.backstory}` : '',
          character.drive ? `Drive: ${character.drive}` : '',
          'Stay helpful, vivid, concise, and aware of the current page.',
        ]
          .filter(Boolean)
          .join('\n'),
        serverId: null,
        serverName: null,
        chatBorderImage: null,
        ExpressionMedia: character.ExpressionMedia,
        NarratorThreads: [],
      },
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to load narrator.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})