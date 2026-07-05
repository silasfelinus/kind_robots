// /server/utils/comfyGate.ts
import type { H3Event } from 'h3'
import { manaGate } from './manaGate'
import { estimateArtCostUsd } from './manaCost'
import { requireMachineUser } from './authGuard'

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
 * kontext, kombine, characterSheet, hunyuan3d). Validates the current auth
 * token through authGuard, resolves the user, and runs manaGate. Throws 401/402
 * exactly like manaGate; the route's errorHandler catches them. Returns the user
 * and a `commit` to call once generation succeeds.
 *
 * Accepts a session JWT, a long-lived user apiKey, or the beta admin token
 * (requireMachineUser) — machine-auth parity with /api/art/generate so
 * automation (conductor, relay agent) can drive Comfy routes.
 */
export async function authAndGate(
  event: H3Event,
  input: ComfyGateInput,
): Promise<ComfyGateResult> {
  const { user } = await requireMachineUser(event)

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
