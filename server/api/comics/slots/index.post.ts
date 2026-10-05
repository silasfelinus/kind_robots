import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { requireComicSeries, toComicSlotDto } from '@/server/utils/comicStudio'
import { COMIC_ASPECTS } from '~/utils/comicLanes'
import { COMIC_SLOT_KINDS, oneOf } from '~/utils/comicStudio'
import { slugify } from '~/utils/slugify'

type CreateBody = {
  seriesId?: unknown
  entityId?: unknown
  issueId?: unknown
  kind?: unknown
  title?: unknown
  aspect?: unknown
  promptProse?: unknown
  copyFromSlotId?: unknown
}

function optionalId(value: unknown): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = (await readBody<CreateBody>(event)) ?? {}
    const seriesId = optionalId(body.seriesId)
    if (!seriesId)
      throw createError({ statusCode: 400, message: 'seriesId is required.' })
    await requireComicSeries(seriesId)
    const entityId = optionalId(body.entityId)
    const issueId = optionalId(body.issueId)
    if (entityId) {
      const entity = await prisma.comicEntity.findFirst({
        where: { id: entityId, seriesId },
      })
      if (!entity)
        throw createError({
          statusCode: 400,
          message: 'Unknown entity for this series.',
        })
    }
    if (issueId) {
      const issue = await prisma.comicIssue.findFirst({
        where: { id: issueId, seriesId },
      })
      if (!issue)
        throw createError({
          statusCode: 400,
          message: 'Unknown issue for this series.',
        })
    }
    const copyId = optionalId(body.copyFromSlotId)
    const source = copyId
      ? await prisma.comicSlot.findFirst({ where: { id: copyId, seriesId } })
      : null
    const kind = oneOf(
      COMIC_SLOT_KINDS,
      body.kind,
      issueId ? 'panel' : 'subject',
    )
    const title =
      (typeof body.title === 'string' && body.title.trim().slice(0, 255)) ||
      (source
        ? `${source.title} (copy)`
        : kind === 'panel'
          ? 'New panel'
          : 'New subject')
    const base = slugify(title).slice(0, 140) || kind
    let key = base
    for (
      let n = 2;
      await prisma.comicSlot.findUnique({
        where: { seriesId_key: { seriesId, key } },
      });
      n += 1
    ) {
      key = `${base}-${n}`
    }
    const count = await prisma.comicSlot.count({
      where: { seriesId, entityId },
    })
    const aspect = COMIC_ASPECTS.includes(String(body.aspect))
      ? String(body.aspect)
      : (source?.aspect ?? (kind === 'panel' ? '16:9' : '1:1'))
    const slot = await prisma.comicSlot.create({
      data: {
        seriesId,
        entityId,
        issueId,
        key,
        kind,
        title,
        aspect,
        promptProse:
          (typeof body.promptProse === 'string' && body.promptProse.trim()) ||
          source?.promptProse ||
          null,
        promptTags: source?.promptTags ?? null,
        negativePrompt: source?.negativePrompt ?? null,
        useSeriesStyle: source?.useSeriesStyle ?? true,
        laneKeys: source?.laneKeys ?? null,
        sortOrder: count,
      },
    })
    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      message: `Added ${title}.`,
      data: toComicSlotDto(slot),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
