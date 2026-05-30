// /server/utils/comfyGate.ts
import type { H3Event } from 'h3'
import { createError } from 'h3'
import prisma from './prisma'
import { manaGate } from './manaGate'
import { estimateArtCostUsd } from './manaCost'

type ComfyEngine = 'comfy' | 'flux' | 'kontext'

interface ComfyGateInput {
  // Steps/size from the request body, used for the cost estimate.
  steps?: number | null
  width?: number | null
  height?: number | null
  serverId?: number | null
  // Which estimator profile to use. Defaults to 'comfy'.
  engine?: ComfyEngine
}

interface ComfyGateResult {
  user: { id: number }
  cost: number
  free: boolean
  // Call after a successful generation to charge + write the ledger row.
  commit: (
    refId: string,
    providerCostUsd?: number,
  ) => Promise<{ balance: number }>
}

/**
 * Shared auth + mana gate for every Comfy generation route (sdxl, flux,
 * kontext, kombine). Validates the Bearer token, resolves the user, and runs
 * manaGate so the route never has to repeat the boilerplate. Throws 401/402
 * exactly like manaGate does; the route's errorHandler catches them.
 *
 * Returns the user and a `commit` to call once generation succeeds.
 */
export async function authAndGate(
  event: H3Event,
  input: ComfyGateInput,
): Promise<ComfyGateResult> {
  // manaGate already validates the token via validateApiKey, but these routes
  // also need user.id for resolveServer, so surface it here.
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
