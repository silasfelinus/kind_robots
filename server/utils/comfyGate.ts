// /server/utils/comfyGate.ts
import type { H3Event } from 'h3'
import { manaGate } from './manaGate'
import { estimateArtCostUsd } from './manaCost'
import { requireScopedApiUser } from './authGuard'

type ComfyEngine =
  'comfy' | 'flux' | 'kontext' | 'charsheet' | 'hunyuan' | 'ltx' | 'wan'

interface ComfyGateInput {
  steps?: number | null
  width?: number | null
  height?: number | null
  // Video engines (ltx/wan) bill by frame count; still engines leave this null.
  frames?: number | null
  serverId?: number | null
  engine?: ComfyEngine
}

interface ComfyGateResult {
  user: { id: number }
  // Carried through from requireScopedApiUser. Routes that need an admin bypass
  // (entity-art ownership, LoRA visibility, mature Facet selection) must read
  // THIS, never `gate.user`: the user object here is deliberately narrowed to
  // `{ id }`, so casting it to something carrying `isAdmin` yields a
  // permanently-false value that the typechecker cannot catch.
  isAdmin: boolean
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
 * Human auth (session JWT, user apiKey, beta admin token) retains the normal
 * authenticated-user behavior. Scoped agent credentials must explicitly carry
 * generation:art; a forum-only key can never spend its operator's generation
 * balance merely because it is a valid machine credential.
 */
export async function authAndGate(
  event: H3Event,
  input: ComfyGateInput,
): Promise<ComfyGateResult> {
  const { user, isAdmin } = await requireScopedApiUser(event, 'generation:art')

  const gate = await manaGate(event, {
    kind: 'art',
    estCostUsd: estimateArtCostUsd({
      engine: input.engine ?? 'comfy',
      steps: input.steps,
      width: input.width,
      height: input.height,
      frames: input.frames,
    }),
    serverId: input.serverId ?? null,
  })

  return {
    user: { id: user.id },
    isAdmin,
    cost: gate.cost,
    free: gate.free,
    commit: gate.commit,
  }
}
