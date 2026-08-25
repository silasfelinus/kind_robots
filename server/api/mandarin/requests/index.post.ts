import { defineEventHandler, readBody } from 'h3'
import { requireApiUser } from '../../../utils/authGuard'
import { errorHandler } from '../../../utils/error'
import { prisma } from '../../../utils/prisma'
import {
  MANDARIN_REQUEST_ART_VERSION,
  MANDARIN_REQUEST_RECIPE_VERSION,
  normalizeMandarinRequest,
  parseGeneratedMandarinCard,
  reconcileRequestedCardArt,
  requestedArtPrompt,
  requestedCardPrompt,
  requestedCardPublicDataEnriched,
  requestedCardSystemPrompt,
} from '../../../utils/mandarinRequestedCards'

type RequestBody = {
  request?: unknown
}

type GenerateTextResponse = {
  provider?: string
  model?: string
  text?: string
}

type ArtEnqueueResponse = {
  success?: boolean
  message?: string
  data?: {
    jobId?: number
    status?: string
    deduplicated?: boolean
  }
}

function generationNote(provider: string, model: string): string {
  return [
    'Generated learning-card fields are AI output, not dictionary-sourced facts.',
    `Provider: ${provider || 'unknown'}.`,
    `Model: ${model || 'unknown'}.`,
    `Recipe: ${MANDARIN_REQUEST_RECIPE_VERSION}.`,
    'Character decomposition/history comes from the separate pinned character-data layer when available.',
  ].join(' ')
}

async function attachMandarinJobContext(input: {
  jobId: number
  userId: number
  cardId: number
  artPromptVersion: string
}): Promise<void> {
  const job = await prisma.artJob.findUnique({
    where: { id: input.jobId },
    select: { userId: true, payload: true },
  })
  if (!job || job.userId !== input.userId) return

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(job.payload) as Record<string, unknown>
  } catch {
    return
  }

  const dedupeKey = `mandarin:${input.cardId}:${input.artPromptVersion}`
  await prisma.artJob.update({
    where: { id: input.jobId },
    data: {
      payload: JSON.stringify({
        ...payload,
        mandarinContext: {
          product: 'mandarin',
          cardId: input.cardId,
          artPromptVersion: input.artPromptVersion,
          dedupeKey,
        },
      }),
    },
  })
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = ((await readBody(event)) ?? {}) as RequestBody
    const { requestText, normalizedRequest } = normalizeMandarinRequest(body.request)

    const existing = await prisma.mandarinRequestedCard.findUnique({
      where: {
        userId_normalizedRequest: {
          userId: auth.user.id,
          normalizedRequest,
        },
      },
    })
    if (existing?.isActive) {
      const reconciled = await reconcileRequestedCardArt(existing)
      return {
        success: true,
        statusCode: 200,
        message: 'Existing requested Mandarin card reused.',
        data: await requestedCardPublicDataEnriched(reconciled),
      }
    }

    const generated = await event.$fetch<GenerateTextResponse, string>(
      '/api/generate/text',
      {
        method: 'POST',
        body: {
          system: requestedCardSystemPrompt(),
          prompt: requestedCardPrompt(requestText),
          temperature: 0.2,
          maxTokens: 600,
          stream: false,
        },
      },
    )

    const fields = parseGeneratedMandarinCard(String(generated.text || ''))
    const provider = String(generated.provider || 'unknown').slice(0, 64)
    const model = String(generated.model || 'unknown').slice(0, 255)
    const provenance = generationNote(provider, model)
    const artPrompt = requestedArtPrompt(fields)

    const created = await prisma.mandarinRequestedCard.upsert({
      where: {
        userId_normalizedRequest: {
          userId: auth.user.id,
          normalizedRequest,
        },
      },
      create: {
        userId: auth.user.id,
        requestText,
        normalizedRequest,
        simplified: fields.simplified,
        traditional: fields.traditional,
        pinyin: fields.pinyin,
        meaning: fields.meaning,
        meanings: JSON.stringify(fields.meanings),
        usageNote: fields.usageNote,
        provider,
        model,
        recipeVersion: MANDARIN_REQUEST_RECIPE_VERSION,
        generationProvenance: provenance,
        artPrompt,
        artPromptVersion: MANDARIN_REQUEST_ART_VERSION,
      },
      update: {
        isActive: true,
      },
    })

    // The card is durable before art is attempted. A renderer outage should
    // never erase a useful generated learning card.
    if (!created.artJobId) {
      try {
        const art = await event.$fetch<ArtEnqueueResponse, string>(
          '/api/art/enqueue',
          {
            method: 'POST',
            body: {
              engine: 'krea2',
              promptString: created.artPrompt,
              projectSlug: 'mandarin-tutor',
              width: 768,
              height: 768,
              isPublic: false,
              isMature: false,
              designer: `mandarin-request:${created.id}`,
            },
          },
        )

        const jobId = Number(art.data?.jobId)
        if (art.success && Number.isInteger(jobId) && jobId > 0) {
          await attachMandarinJobContext({
            jobId,
            userId: auth.user.id,
            cardId: created.id,
            artPromptVersion: created.artPromptVersion,
          })
          const withJob = await prisma.mandarinRequestedCard.update({
            where: { id: created.id },
            data: { artJobId: jobId },
          })
          event.node.res.statusCode = 201
          return {
            success: true,
            statusCode: 201,
            message: 'Requested Mandarin card created and illustration queued.',
            data: await requestedCardPublicDataEnriched(withJob),
          }
        }
      } catch (artError) {
        console.warn('[mandarin] requested-card art enqueue failed; keeping card', {
          cardId: created.id,
          message: artError instanceof Error ? artError.message : String(artError),
        })
      }
    }

    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      message: 'Requested Mandarin card created. Illustration can be retried later.',
      data: await requestedCardPublicDataEnriched(created),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to create requested Mandarin card.',
    }
  }
})
