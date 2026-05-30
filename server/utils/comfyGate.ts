// /server/utils/comfyGate.ts
import type { H3Event } from 'h3'
import { createError } from 'h3'
import prisma from './prisma'
import { manaGate } from './manaGate'
import { estimateArtCostUsd } from './manaCost'

type ComfyEngine =
  | 'comfy'
  | 'flux'
  | 'kontext'
  | 'charsheet'
  | 'hunyuan'
  | 'ltx'

interface ComfyGateInput {
  steps?: number | null
  width?: number | null
  height?: number | null
  serverId?: number | null
  engine?: ComfyEngine
}

interface ComfyGateResult {
  user: { id: number }
  cost: number
  free: boolean
  commit: (
    refId: string,
    providerCostUsd?: number,
  ) => Promise<{ balance: number }>
}

/**
 * Shared auth + mana gate for every Comfy generation route (sdxl, flux,
 * kontext, kombine, characterSheet, hunyuan3d). Validates the Bearer token,
 * resolves the user, and runs manaGate. Throws 401/402 exactly like manaGate;
 * the route's errorHandler catches them. Returns the user and a `commit` to
 * call once generation succeeds.
 */
export async function authAndGate(
  event: H3Event,
  input: ComfyGateInput,
): Promise<ComfyGateResult> {
  const authorizationHeader = event.node.req.headers.authorization

  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message:
        'Authorization token is required in the format "Bearer <token>".',
    })
  }

  const token = authorizationHeader.split(' ')[1] ?? ''

  const user = await prisma.user.findFirst({
    where: { apiKey: token },
    select: { id: true },
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired authorization token.',
    })
  }

  const gate = await manaGate(event, {
    kind: 'art',
    estCostUsd: estimateArtCostUsd({
      engine: input.engine ?? 'comfy',
      steps: input.steps,
      width: input.width,
      height: input.height,
    }),
    serverId: input.serverId ?? null,
  })

  return {
    user: { id: user.id },
    cost: gate.cost,
    free: gate.free,
    commit: gate.commit,
  }
}
