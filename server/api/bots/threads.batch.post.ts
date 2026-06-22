// server/api/narrator/threads/batch.post.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { validateApiKey } from '../../../utils/validateKey'
import { errorHandler } from '../../../utils/error'

type StarterPrompt = {
  label: string
  prompt: string
  action: string
  path?: string
  flavor?: string
  key?: string
  screen?: string
}

// Threads are keyed on @@unique([botId, topicId]). To keep this .http-friendly,
// we accept human-readable references (botName / botId, topicSlug / topicId)
// and resolve them server-side.
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
      return { success: false, message: 'Invalid or missing API key.', statusCode: 401 }
    }

    const body = (await readBody(event)) as BatchBody
    const threads = Array.isArray(body?.threads) ? body.threads : []
    const dryRun = body?.dryRun === true

    if (!threads.length) {
      event.node.res.statusCode = 400
      return { success: false, message: 'No threads provided.', statusCode: 400 }
    }

    // --- preload lookup maps for name/slug resolution ---
    const bots = await prisma.bot.findMany({
      where: { BotType: 'NARRATOR' },
      select: { id: true, name: true },
    })
    const topicsAll = await prisma.narratorTopic.findMany({
      select: { id: true, slug: true },
    })
    const botByName = new Map(bots.map((b) => [b.name, b.id]))
    const topicBySlug = new Map(topicsAll.map((t) => [t.slug, t.id]))

    const errors: Array<{ index: number; ref?: string; message: string }> = []
    const seenPairs = new Set<string>()
    const valid: Array<{ botId: number; topicId: number; input: ThreadInput }> = []

    threads.forEach((t, index) => {
      const ref = `${t?.botName ?? t?.botId ?? '?'} / ${t?.topicSlug ?? t?.topicId ?? '?'}`

      const botId =
        typeof t?.botId === 'number'
          ? t.botId
          : t?.botName
            ? botByName.get(t.botName)
            : undefined
      const topicId =
        typeof t?.topicId === 'number'
          ? t.topicId
          : t?.topicSlug
            ? topicBySlug.get(t.topicSlug)
            : undefined

      if (!botId) {
        errors.push({ index, ref, message: `Could not resolve bot (${t?.botName ?? t?.botId})` })
        return
      }
      if (!topicId) {
        errors.push({ index, ref, message: `Could not resolve topic (${t?.topicSlug ?? t?.topicId})` })
        return
      }
      if (typeof t.openingText !== 'string' || !t.openingText.trim()) {
        errors.push({ index, ref, message: 'Missing required field: openingText' })
        return
      }

      const pairKey = `${botId}:${topicId}`
      if (seenPairs.has(pairKey)) {
        errors.push({ index, ref, message: 'Duplicate botId+topicId within batch' })
        return
      }
      seenPairs.add(pairKey)
      valid.push({ botId, topicId, input: t })
    })

    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        message: `Validated ${valid.length} thread(s), ${errors.length} error(s).`,
        wouldUpsert: valid.map((v) => `${v.botId}:${v.topicId}`),
        errors,
        statusCode: 200,
      }
    }

    const results = []
    for (const { botId, topicId, input } of valid) {
      const data = {
        title: input.title ?? null,
        openingText: input.openingText,
        guidance: input.guidance ?? null,
        starterPrompts:
          input.starterPrompts === undefined ? undefined : (input.starterPrompts ?? null),
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
    return { success: false, message: handled.message, statusCode: handled.statusCode || 500 }
  }
})
