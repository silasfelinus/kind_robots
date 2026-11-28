// /server/utils/tarotStudio.ts
//
// Shared Tarot Studio server helpers: the deck payload shape, ArtJob request
// building and reconciliation of TarotArt rows against the durable ArtJob
// queue. A TarotArt row is created before its ArtJob and carries the request
// key `tarot-art:<id>`, so sync can recover a job even if the browser never
// reported the job id back.
import prisma from '~/server/utils/prisma'
import { artRequestKeyFingerprint } from '~/server/utils/artRequestKey'
import {
  TAROT_DECK_SEEDS,
  currentSeedPrompt,
  parseLoraLines,
  priorSeedPrompts,
  seedTarotCards,
  seedTarotDesigns,
  tarotArtRequestKey,
} from '~/utils/tarotStudio'

export const TAROT_DECK_INCLUDE = {
  Cards: { orderBy: { ordinal: 'asc' as const } },
  Designs: { orderBy: { id: 'asc' as const } },
  Art: { orderBy: { id: 'desc' as const } },
}

export const TAROT_ART_OPEN_STATUSES = ['PENDING', 'QUEUED'] as const
export const TAROT_ART_LIVE_STATUSES = [
  'PENDING',
  'QUEUED',
  'RENDERED',
] as const

export function tarotArtImageUrl(artId: number) {
  return `/api/tarot/art/${artId}/image`
}

export type TarotArtRequestSource = {
  id: number
  prompt: string
  engine: string
  checkpoint: string | null
  loras: string
  width: number
  height: number
}

/** The POST /api/art/enqueue body for one TarotArt row. */
export function tarotEnqueueRequest(art: TarotArtRequestSource) {
  const loras = parseLoraLines(art.loras)
  return {
    engine: art.engine,
    promptString: art.prompt,
    checkpoint: art.checkpoint || null,
    loras: loras.length ? loras : null,
    width: art.width,
    height: art.height,
    isPublic: false,
    isMature: false,
    projectSlug: 'tarot-studio',
    requestKey: tarotArtRequestKey(art.id),
  }
}

type TarotCardPromptClient = Pick<typeof prisma, 'tarotCard'>

/**
 * Move cards still holding an earlier seed recipe onto the current one. A card
 * whose prompt was edited in the studio never matches a prior seed, and each
 * update re-checks the old prompt so a concurrent edit wins.
 */
export async function upgradeUntouchedCardPrompts(
  client: TarotCardPromptClient,
  deckId: number,
  deckSlug: string,
) {
  const cards = await client.tarotCard.findMany({
    where: { deckId },
    select: { id: true, key: true, prompt: true },
  })
  let upgraded = 0
  for (const card of cards) {
    const current = currentSeedPrompt(deckSlug, card.key)
    if (!current || card.prompt === current) continue
    if (!priorSeedPrompts(deckSlug, card.key).includes(card.prompt.trim()))
      continue
    const result = await client.tarotCard.updateMany({
      where: { id: card.id, prompt: card.prompt },
      data: { prompt: current },
    })
    upgraded += result.count
  }
  return upgraded
}

/** Seed the starter decks, cards and designs, upgrading only untouched prompts. */
export async function bootstrapTarotStudio() {
  return prisma.$transaction(
    async (tx) => {
      const results: string[] = []
      for (const seed of TAROT_DECK_SEEDS) {
        const deck = await tx.tarotDeck.upsert({
          where: { slug: seed.slug },
          update: {},
          create: {
            slug: seed.slug,
            title: seed.title,
            description: seed.description,
            styleBible: seed.styleBible,
            defaultEngine: seed.defaultEngine,
            defaultCheckpoint: seed.defaultCheckpoint,
            defaultLoras: seed.defaultLoras,
            backPrompt: seed.backPrompt,
            isPublic: seed.isPublic,
          },
        })
        await tx.tarotCard.createMany({
          data: seedTarotCards(seed.slug).map((card) => ({
            deckId: deck.id,
            ...card,
          })),
          skipDuplicates: true,
        })
        const upgraded = await upgradeUntouchedCardPrompts(
          tx,
          deck.id,
          seed.slug,
        )
        results.push(
          upgraded ? `${seed.slug} (${upgraded} prompts upgraded)` : seed.slug,
        )
      }
      const decks = await tx.tarotDeck.findMany({
        select: { id: true, slug: true, _count: { select: { Designs: true } } },
      })
      for (const deck of decks) {
        if (deck._count.Designs > 0) continue
        await tx.tarotDesign.createMany({
          data: seedTarotDesigns(deck.slug).map((design) => ({
            deckId: deck.id,
            ...design,
          })),
          skipDuplicates: true,
        })
      }
      return results
    },
    { timeout: 30000 },
  )
}

type SyncSummary = { checked: number; rendered: number; failed: number }

/**
 * Reconcile open TarotArt rows with their ArtJobs. A job found only by its
 * request key is linked here; DONE jobs record the ArtImage; FAILED and
 * CANCELLED jobs mark the art failed. Newly rendered set art becomes the
 * card's default face, or the deck back, when nothing is selected yet.
 */
export async function syncTarotDeckArt(deckId: number): Promise<SyncSummary> {
  const open = await prisma.tarotArt.findMany({
    where: { deckId, status: { in: [...TAROT_ART_OPEN_STATUSES] } },
    select: {
      id: true,
      cardId: true,
      side: true,
      purpose: true,
      artJobId: true,
      designId: true,
    },
  })
  const summary: SyncSummary = { checked: open.length, rendered: 0, failed: 0 }
  if (!open.length) return summary

  const byId = open.filter((art) => art.artJobId)
  const byKey = open.filter((art) => !art.artJobId)
  const jobs = await prisma.artJob.findMany({
    where: {
      OR: [
        { id: { in: byId.map((art) => art.artJobId as number) } },
        {
          attemptFingerprint: {
            in: byKey.map((art) =>
              artRequestKeyFingerprint(tarotArtRequestKey(art.id)),
            ),
          },
        },
      ],
    },
    select: {
      id: true,
      status: true,
      artImageId: true,
      error: true,
      attemptFingerprint: true,
    },
    orderBy: { id: 'desc' },
  })

  const deck = await prisma.tarotDeck.findUnique({
    where: { id: deckId },
    select: { backArtId: true, approvedDesignId: true },
  })
  let backArtId = deck?.backArtId ?? null

  for (const art of open) {
    const fingerprint = artRequestKeyFingerprint(tarotArtRequestKey(art.id))
    const job =
      jobs.find((entry) => art.artJobId && entry.id === art.artJobId) ??
      jobs.find((entry) => entry.attemptFingerprint === fingerprint)
    if (!job) continue
    if (job.status === 'DONE' && job.artImageId) {
      await prisma.tarotArt.update({
        where: { id: art.id },
        data: {
          status: 'RENDERED',
          artJobId: job.id,
          artImageId: job.artImageId,
          error: null,
        },
      })
      summary.rendered++
      if (art.purpose === 'SAMPLE') continue
      if (art.side === 'BACK') {
        if (!backArtId) {
          backArtId = art.id
          await prisma.tarotDeck.update({
            where: { id: deckId },
            data: { backArtId: art.id },
          })
        }
        continue
      }
      if (art.cardId) {
        await prisma.tarotCard.updateMany({
          where: { id: art.cardId, selectedArtId: null },
          data: {
            selectedArtId: art.id,
            artJobId: job.id,
            artImageId: job.artImageId,
            imageUrl: tarotArtImageUrl(art.id),
            status: 'RENDERED',
          },
        })
      }
    } else if (job.status === 'FAILED' || job.status === 'CANCELLED') {
      await prisma.tarotArt.update({
        where: { id: art.id },
        data: {
          status: 'FAILED',
          artJobId: job.id,
          error:
            job.error?.slice(0, 2000) || `Render ${job.status.toLowerCase()}.`,
        },
      })
      summary.failed++
    } else if (art.artJobId !== job.id) {
      await prisma.tarotArt.update({
        where: { id: art.id },
        data: { status: 'QUEUED', artJobId: job.id },
      })
    }
  }
  return summary
}
