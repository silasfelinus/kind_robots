// /server/utils/comfyGate.ts
import type { H3Event } from 'h3'
import { manaGate } from './manaGate'
import { estimateArtCostUsd } from './manaCost'
import { requireScopedApiUser } from './authGuard'

type ComfyEngine =
  | 'comfy'
  | 'krea2'
  | 'flux'
  | 'kontext'
  | 'charsheet'
  | 'hunyuan'
  | 'ltx'
  | 'wan'

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
  // Durable external-agent identity, when the authenticated credential is
  // AgentProfile-bound. Free allowance accounting remains human-owned but
  // records this scalar for provenance/audit.
  agentProfileId: number | null
  // Carried through from requireScopedApiUser. Routes that need an admin bypass
  // (entity-art ownership, LoRA visibility, mature Facet selection) must read
  // THIS, never `gate.user`: the user object here is deliberately narrowed to
  // `{ id }`, so casting it to something carrying `isAdmin` yields a
  // permanently-false value that the typechecker cannot catch.
  isAdmin: boolean
  cost: number
  free: boolean
  canPay: boolean
  fundedBy: 'MANA' | 'TOKENS' | null
  balance: number
  commit: (
    refId: string,
    providerCostUsd?: number,
  ) => Promise<{ balance: number }>
}

function statusCodeOf(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null
  const candidate = error as { statusCode?: unknown; status?: unknown }
  const code = Number(candidate.statusCode ?? candidate.status)
  return Number.isInteger(code) ? code : null
}

/**
 * Shared auth + mana gate for every Comfy generation route (sdxl, Krea2,
 * flux, kontext, kombine, characterSheet, hunyuan3d). Validates the current
 * auth token through authGuard, resolves the user, and runs manaGate.
 *
 * Krea2 has one deliberate exception to the historical "402 immediately"
 * behavior: an otherwise-unfunded request may continue far enough for the
 * queue route to atomically reserve a subsidized daily Krea2 slot. If that
 * later reservation does not succeed, `canPay=false` lets the route reject the
 * job before queue creation and `commit()` still rethrows the original 402.
 * This never grants a free pass to another engine.
 */
export async function authAndGate(
  event: H3Event,
  input: ComfyGateInput,
): Promise<ComfyGateResult> {
  const auth = await requireScopedApiUser(event, 'generation:art')
  const costUsd = estimateArtCostUsd({
    engine: input.engine ?? 'comfy',
    steps: input.steps,
    width: input.width,
    height: input.height,
    frames: input.frames,
  })

  try {
    const gate = await manaGate(event, {
      kind: 'art',
      estCostUsd: costUsd,
      serverId: input.serverId ?? null,
    })

    return {
      user: { id: auth.user.id },
      agentProfileId: auth.agentProfileId ?? null,
      isAdmin: auth.isAdmin,
      cost: gate.cost,
      free: gate.free,
      canPay: gate.free || gate.fundedBy !== null,
      fundedBy: gate.fundedBy,
      balance: gate.user.mana ?? 0,
      commit: gate.commit,
    }
  } catch (error) {
    if (input.engine !== 'krea2' || statusCodeOf(error) !== 402) throw error

    const estimatedManaCost = Math.max(1, Math.ceil(costUsd * 1000))
    return {
      user: { id: auth.user.id },
      agentProfileId: auth.agentProfileId ?? null,
      isAdmin: auth.isAdmin,
      cost: estimatedManaCost,
      free: false,
      canPay: false,
      fundedBy: null,
      balance: auth.user.mana ?? 0,
      commit: async () => {
        throw error
      },
    }
  }
}
