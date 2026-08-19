// /server/utils/textGate.ts
import type { H3Event } from 'h3'
import { manaGate } from './manaGate'
import { requireMachineUser } from './authGuard'
import type { ManaSource } from './manaAttribution'

type TextGateInput = {
  model?: string | null
  maxTokens?: number | null
  serverId?: number | null
  provider?: string | null
  // kind-economy/t-007: the object this text generation is about/seeded by,
  // when the caller knows one -- passed straight through to manaGate.
  source?: ManaSource | null
}

type TextGateResult = {
  user: {
    id: number
  }
  // See comfyGate.ts: `user` is narrowed to `{ id }`, so admin checks must read
  // this flag rather than casting `gate.user` to a shape it does not have.
  isAdmin: boolean
  cost: number
  free: boolean
  commit: (
    refId: string,
    providerCostUsd?: number,
  ) => Promise<{ balance: number }>
}

export async function authAndTextGate(
  event: H3Event,
  input: TextGateInput = {},
): Promise<TextGateResult> {
  // t-015: shared machine auth (session JWT, user apiKey, or beta admin
  // token) via requireMachineUser, replacing the inline apiKey-only lookup.
  // Mirrors comfyGate.authAndGate.
  const { user, isAdmin } = await requireMachineUser(event)

  const gate = await manaGate(event, {
    kind: 'text',
    estCostUsd: estimateTextCostUsd({
      model: input.model,
      maxTokens: input.maxTokens,
      provider: input.provider,
    }),
    serverId: input.serverId ?? null,
    source: input.source ?? null,
  })

  return {
    user: { id: user.id },
    isAdmin,
    cost: gate.cost,
    free: gate.free,
    commit: gate.commit,
  }
}

function estimateTextCostUsd(input: {
  model?: string | null
  maxTokens?: number | null
  provider?: string | null
}): number {
  const model = input.model?.toLowerCase() || ''
  const provider = input.provider?.toLowerCase() || ''
  const maxTokens = Math.max(1, input.maxTokens ?? 1024)

  if (provider === 'anthropic' || model.includes('claude')) {
    return (maxTokens / 1_000_000) * 15
  }

  if (model.includes('gpt-4') || model.includes('o4') || model.includes('o3')) {
    return (maxTokens / 1_000_000) * 10
  }

  return (maxTokens / 1_000_000) * 2
}
