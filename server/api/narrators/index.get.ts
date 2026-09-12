// /server/api/narrators/index.get.ts
//
// The narrator cards the Storybook hand deals (storybook/t-042).
//
// Silas, 2026-09-12: "since the narrators actually exist as bot Narrators, they
// provide the general voice, but how they deliver it can still be adjusted."
// So the Narrator slot on the board is a REAL Bot, dealt like any other card --
// not one of five abstract voice presets. The delivery dial
// (LifeRun.narratorStyle, the five NARRATOR_STYLE_DIRECTIVES) rides on the
// placed card and modulates that Bot; it does not replace it.
//
// A sibling of /api/narrators/[type]/[slug].get.ts, which loads one narrator in
// full for a page. This is the LIST, so it returns only what a card face needs:
// who they are, what they look like, and one line of how they sound. The prompt
// text is deliberately NOT here -- a narrator's system prompt is the server's,
// and a hand does not need it to draw a card.

import { defineEventHandler, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'

const MAX_NARRATORS = 60

export default defineEventHandler(async (event) => {
  let response

  try {
    const query = getQuery(event)
    const search = String(query.search || '')
      .trim()
      .slice(0, 64)

    const bots = await prisma.bot.findMany({
      where: {
        BotType: 'NARRATOR',
        isActive: true,
        isPublic: true,
        ...(search ? { name: { contains: search } } : {}),
      },
      orderBy: [{ name: 'asc' }],
      take: MAX_NARRATORS,
      select: {
        id: true,
        name: true,
        slug: true,
        subtitle: true,
        tagline: true,
        personality: true,
        narrativeVoice: true,
        avatarImage: true,
        imagePath: true,
        artImageId: true,
        ArtImage: {
          select: { id: true, imagePath: true, path: true, fileName: true },
        },
      },
    })

    response = {
      success: true,
      message: `${bots.length} narrator${bots.length === 1 ? '' : 's'} available.`,
      data: bots.map((bot) => ({
        id: bot.id,
        name: bot.name,
        slug: bot.slug,
        subtitle: bot.subtitle,
        tagline: bot.tagline,
        // One line of how they sound, for the back of the card.
        voice: bot.narrativeVoice || bot.personality || bot.subtitle || null,
        artImageId: bot.artImageId,
        imagePath:
          bot.imagePath ||
          bot.avatarImage ||
          bot.ArtImage?.imagePath ||
          bot.ArtImage?.path ||
          bot.ArtImage?.fileName ||
          null,
      })),
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to list the narrators.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
