// /server/utils/generationMana.ts
import type { H3Event } from 'h3'
import type { Server } from '~/prisma/generated/prisma/client'
import { manaGate } from './manaGate'
import { estimateArtCostUsd, estimateTextCostUsd } from './manaCost'

export type ArtManaOptions = {
  server: Server
  engine: string
  steps?: number | null
  width?: number | null
  height?: number | null
}

export type TextManaOptions = {
  server: Server | null
  model: string
  maxTokens?: number | null
}

export async function withArtMana(event: H3Event, opts: ArtManaOptions) {
  return await manaGate(event, {
    kind: 'art',
    serverId: opts.server.id,
    estCostUsd: estimateArtCostUsd({
      engine: opts.engine,
      steps: opts.steps,
      width: opts.width,
      height: opts.height,
    }),
  })
}

export async function withTextMana(event: H3Event, opts: TextManaOptions) {
  return await manaGate(event, {
    kind: 'text',
    serverId: opts.server?.id ?? null,
    estCostUsd: estimateTextCostUsd({
      model: opts.model,
      maxTokens: opts.maxTokens,
    }),
  })
}
