// POST /api/tarot/art
//
// Creates TarotArt rows for one design and returns the exact ArtJob enqueue
// body for each. The store enqueues them through POST /api/art/enqueue (the
// one durable art queue) and reports job ids back; /api/tarot/art/sync can
// also recover them by request key. Nothing here claims art has rendered.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import {
  TAROT_ART_LIVE_STATUSES,
  tarotEnqueueRequest,
} from '~/server/utils/tarotStudio'
import {
  TAROT_ART_HEIGHT,
  TAROT_ART_WIDTH,
  TAROT_SAMPLE_CARD_KEYS,
  cardScenePrompt,
  composeFacePrompt,
} from '~/utils/tarotStudio'

type Scope = 'samples' | 'set' | 'cards' | 'back'
const SCOPES: Scope[] = ['samples', 'set', 'cards', 'back']
const MAX_CARD_IDS = 80

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = (await readBody<Record<string, unknown>>(event)) ?? {}
    const scope = body.scope as Scope
    if (!SCOPES.includes(scope)) {
      throw createError({ statusCode: 400, message: 'Unknown art scope.' })
    }
    const deckSlug = typeof body.deckSlug === 'string' ? body.deckSlug : ''
    const deck = await prisma.tarotDeck.findUnique({
      where: { slug: deckSlug },
      include: { Cards: { orderBy: { ordinal: 'asc' } } },
    })
    if (!deck)
      throw createError({ statusCode: 404, message: 'Deck not found.' })

    const requestedDesign = Number(body.designId)
    const designId =
      Number.isSafeInteger(requestedDesign) && requestedDesign > 0
        ? requestedDesign
        : deck.approvedDesignId
    if (!designId) {
      throw createError({
        statusCode: 409,
        message: 'Approve a design first, or choose which design to render.',
      })
    }
    const design = await prisma.tarotDesign.findFirst({
      where: { id: designId, deckId: deck.id },
    })
    if (!design) {
      throw createError({ statusCode: 404, message: 'Design not found.' })
    }
    if (scope === 'set' && design.status !== 'APPROVED') {
      throw createError({
        statusCode: 409,
        message: 'Only the approved design can generate the full set.',
      })
    }

    const force = body.force === true
    const purpose =
      scope === 'samples' ? 'SAMPLE' : scope === 'cards' ? 'REVISION' : 'SET'

    let cards = deck.Cards
    if (scope === 'samples') {
      cards = deck.Cards.filter((card) =>
        (TAROT_SAMPLE_CARD_KEYS as readonly string[]).includes(card.key),
      )
    } else if (scope === 'cards') {
      const ids = Array.isArray(body.cardIds)
        ? body.cardIds.map(Number).filter((id) => Number.isSafeInteger(id))
        : []
      if (!ids.length || ids.length > MAX_CARD_IDS) {
        throw createError({
          statusCode: 400,
          message: `Choose between 1 and ${MAX_CARD_IDS} cards.`,
        })
      }
      cards = deck.Cards.filter((card) => ids.includes(card.id))
    } else if (scope === 'back') {
      cards = []
    }

    const existing =
      force || scope === 'cards'
        ? []
        : await prisma.tarotArt.findMany({
            where: {
              deckId: deck.id,
              designId: design.id,
              status: { in: [...TAROT_ART_LIVE_STATUSES] },
            },
            select: { cardId: true, side: true },
          })
    const hasFace = new Set(
      existing.filter((art) => art.side === 'FACE').map((art) => art.cardId),
    )
    const hasBack = existing.some((art) => art.side === 'BACK')

    const base = {
      deckId: deck.id,
      designId: design.id,
      purpose,
      engine: design.engine || deck.defaultEngine || 'krea2',
      width: TAROT_ART_WIDTH,
      height: TAROT_ART_HEIGHT,
      status: 'PENDING',
    }
    const rows: Array<
      typeof base & {
        cardId: number | null
        side: string
        prompt: string
        checkpoint: string | null
        loras: string
      }
    > = []
    const includeBack =
      scope === 'back' || ((scope === 'samples' || scope === 'set') && !hasBack)
    if (includeBack) {
      rows.push({
        ...base,
        cardId: null,
        side: 'BACK',
        prompt: design.backPrompt,
        checkpoint: design.checkpoint,
        loras: design.loras,
      })
    }
    for (const card of cards) {
      if (scope !== 'cards' && hasFace.has(card.id)) continue
      rows.push({
        ...base,
        cardId: card.id,
        side: 'FACE',
        prompt: composeFacePrompt(
          cardScenePrompt(deck.slug, card),
          design.stylePrompt,
        ),
        checkpoint: card.checkpoint || design.checkpoint,
        loras: [design.loras, card.loras].filter((v) => v.trim()).join('\n'),
      })
    }

    const created = []
    for (const row of rows) {
      created.push(await prisma.tarotArt.create({ data: row }))
    }
    if (purpose !== 'SAMPLE') {
      const cardIds = created
        .map((art) => art.cardId)
        .filter((id): id is number => id !== null)
      if (cardIds.length) {
        await prisma.tarotCard.updateMany({
          where: {
            id: { in: cardIds },
            selectedArtId: null,
            status: { in: ['DRAFT', 'REJECTED'] },
          },
          data: { status: 'QUEUED' },
        })
      }
    }

    return {
      success: true,
      statusCode: 200,
      message: created.length
        ? `${created.length} render request${created.length === 1 ? '' : 's'} prepared for ${design.title}.`
        : 'Every requested image already exists or is in the queue.',
      data: created.map((art) => ({
        art,
        request: tarotEnqueueRequest(art),
      })),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
