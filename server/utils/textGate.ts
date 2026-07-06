// /server/utils/textGate.ts
import type { H3Event } from 'h3'
import { manaGate } from './manaGate'
import { requireMachineUser } from './authGuard'

type TextGateInput = {
  model?: string | null
  maxTokens?: number | null
  serverId?: number | null
  provider?: string | null
}

type TextGateResult = {
  user: {
    id: number
  }
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
  const { user } = await requireMachineUser(event)

  const gate = await manaGate(event, {
    kind: 'text',
    estCostUsd: estimateTextCostUsd({
      model: input.model,
      maxTokens: input.maxTokens,
      provider: input.provider,
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
