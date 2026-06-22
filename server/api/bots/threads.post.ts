// server/api/bots/threads.post.ts
import { defineEventHandler, readBody } from 'h3'
import { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../utils/prisma'
import { validateApiKey } from '../../utils/validateKey'
import { errorHandler } from '../../utils/error'

type StarterPrompt = {
  label: string
  prompt: string
  action: string
  path?: string
  flavor?: string
  key?: string
  screen?: string
}

type ThreadInput = {
  botId?: number
  botName?: string
  topicId?: number
  topicSlug?: string
  title?: string | null
  openingText: string
  guidance?: string | null
  starterPrompts?: StarterPrompt[] | null
  sortOrder?: number
  isActive?: boolean
}

type BatchBody = {
  threads?: ThreadInput[]
  dryRun?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await validateApiKey(event)
    if (!auth.isValid) {
      event.node.res.statusCode = 401
      return {
        success: false,
        message: 'Invalid or missing API key.',
        statusCode: 401,
      }
    }

    const body = (await readBody(event)) as BatchBody
    const threads = Array.isArray(body?.threads) ? body.threads : []
    const dryRun = body?.dryRun === true

    if (!threads.length) {
      event.node.res.statusCode = 400
      return {
        success: false,
        message: 'No threads provided.',
        statusCode: 400,
      }
    }

    const bots = await prisma.bot.findMany({
      where: { BotType: 'NARRATOR' },
      select: { id: true, name: true },
    })

    const topicsAll = await prisma.narratorTopic.findMany({
      select: { id: true, slug: true },
    })

    const botByName = new Map(bots.map((bot) => [bot.name, bot.id]))
    const topicBySlug = new Map(
      topicsAll.map((topic) => [topic.slug, topic.id]),
    )

    const errors: Array<{ index: number; ref?: string; message: string }> = []
    const seenPairs = new Set<string>()
    const valid: Array<{ botId: number; topicId: number; input: ThreadInput }> =
      []

    threads.forEach((thread, index) => {
      const ref = `${thread?.botName ?? thread?.botId ?? '?'} / ${thread?.topicSlug ?? thread?.topicId ?? '?'}`

      const botId =
        typeof thread?.botId === 'number'
          ? thread.botId
          : thread?.botName
            ? botByName.get(thread.botName)
            : undefined

      const topicId =
        typeof thread?.topicId === 'number'
          ? thread.topicId
          : thread?.topicSlug
            ? topicBySlug.get(thread.topicSlug)
            : undefined

      if (!botId) {
        errors.push({
          index,
          ref,
          message: `Could not resolve bot (${thread?.botName ?? thread?.botId})`,
        })
        return
      }

      if (!topicId) {
        errors.push({
          index,
          ref,
          message: `Could not resolve topic (${thread?.topicSlug ?? thread?.topicId})`,
        })
        return
      }

      if (
        typeof thread.openingText !== 'string' ||
        !thread.openingText.trim()
      ) {
        errors.push({
          index,
          ref,
          message: 'Missing required field: openingText',
        })
        return
      }

      const pairKey = `${botId}:${topicId}`

      if (seenPairs.has(pairKey)) {
        errors.push({
          index,
          ref,
          message: 'Duplicate botId+topicId within batch',
        })
        return
      }

      seenPairs.add(pairKey)
      valid.push({ botId, topicId, input: thread })
    })

    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        message: `Validated ${valid.length} thread(s), ${errors.length} error(s).`,
        wouldUpsert: valid.map((thread) => `${thread.botId}:${thread.topicId}`),
        errors,
        statusCode: 200,
      }
    }

    const results = []

    for (const { botId, topicId, input } of valid) {
      const starterPrompts =
        input.starterPrompts === undefined
          ? undefined
          : input.starterPrompts === null
            ? Prisma.DbNull
            : (input.starterPrompts as Prisma.InputJsonValue)

      const data = {
        title: input.title ?? null,
        openingText: input.openingText,
        guidance: input.guidance ?? null,
        ...(starterPrompts !== undefined ? { starterPrompts } : {}),
        sortOrder: typeof input.sortOrder === 'number' ? input.sortOrder : 0,
        isActive: input.isActive ?? true,
      }

      const thread = await prisma.narratorThread.upsert({
        where: { botId_topicId: { botId, topicId } },
        update: data,
        create: { botId, topicId, ...data },
      })

      results.push(thread)
    }

    return {
      success: true,
      message: `Upserted ${results.length} thread(s).`,
      count: results.length,
      errors,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message,
      statusCode: handled.statusCode || 500,
    }
  }
})
