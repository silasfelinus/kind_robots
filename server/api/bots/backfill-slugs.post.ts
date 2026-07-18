// /server/api/bots/backfill-slugs.post.ts
// One-shot maintenance endpoint: assign unique slugs to every bot that is
// missing one (historically bots were created without slugs, which broke the
// public /api/narrators/{type}/{slug} lookup and the narratorSlug page
// convention). Admin/server key only. Idempotent; supports { dryRun: true }.
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
import { reserveUniqueSlug } from '../../utils/characterSlug'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Only an admin or server key may backfill bot slugs.',
      })
    }

    const body = await readBody<{ dryRun?: boolean }>(event).catch(
      () => ({}) as { dryRun?: boolean },
    )
    const dryRun = Boolean(body?.dryRun)

    const bots = await prisma.bot.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { id: 'asc' },
    })

    // Seed the taken-set with slugs that already exist so we never collide.
    const taken = new Set(
      bots
        .map((bot) => bot.slug)
        .filter((slug): slug is string => Boolean(slug)),
    )

    const planned: { id: number; name: string; slug: string }[] = []
    const skipped: { id: number; name: string; reason: string }[] = []

    for (const bot of bots) {
      if (bot.slug) continue

      const slug = reserveUniqueSlug(bot.name, taken)

      if (!slug) {
        skipped.push({
          id: bot.id,
          name: bot.name,
          reason: 'name did not produce a usable slug',
        })
        continue
      }

      planned.push({ id: bot.id, name: bot.name, slug })
    }

    if (!dryRun) {
      for (const item of planned) {
        await prisma.bot.update({
          where: { id: item.id },
          data: { slug: item.slug },
        })
      }
    }

    return {
      success: true,
      message: dryRun
        ? `Dry run: ${planned.length} bot(s) would be slugged, ${skipped.length} skipped.`
        : `Backfilled ${planned.length} bot slug(s), ${skipped.length} skipped.`,
      data: {
        dryRun,
        total: bots.length,
        updated: dryRun ? 0 : planned.length,
        planned,
        skipped,
      },
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to backfill bot slugs.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
