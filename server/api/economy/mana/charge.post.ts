// /server/api/economy/mana/charge.post.ts
//
// kind-robots/t-043 (pitch: pitches/2026-07-21-sketchy-cross-app-mana-charge-endpoint.md).
// Lets a trusted external app (Sketchy today) debit a Kind Robots user's real
// mana balance for work it performed on its own infrastructure. Reuses the
// existing machine-user auth (requireMachineUser) and manaGate/applyMana
// verbatim -- the only new surface is manaGate's targetUserId override,
// which is only honored for a server-key caller (see
// server/utils/manaGate.ts resolveManaGateTarget).
import { createError, defineEventHandler, readBody } from 'h3'
import { requireMachineUser } from '../../../utils/authGuard'
import { manaGate, type ManaGateChargeableKind } from '../../../utils/manaGate'
import { errorHandler } from '../../../utils/error'

const CHARGEABLE_KINDS: ManaGateChargeableKind[] = [
  'text',
  'art',
  'video',
  'model',
]

type ManaChargeRequest = {
  krUserId?: unknown
  kind?: unknown
  estCostUsd?: unknown
  refId?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    // requireMachineUser resolves the CALLER's own identity (session JWT,
    // user apiKey, or beta-admin-token). This route only accepts the
    // server-key (beta-admin-token / future scoped machine-credential) path
    // -- a regular user's own JWT/apiKey must never be able to charge
    // someone else's mana, even though requireMachineUser would authenticate
    // it fine for in-process routes.
    const auth = await requireMachineUser(event)

    if (!auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message:
          'This endpoint requires a trusted machine-caller credential, not a user session.',
      })
    }

    const body = (await readBody(event)) as ManaChargeRequest | null

    const krUserId = Number(body?.krUserId)
    const kind = body?.kind as ManaGateChargeableKind
    const estCostUsd = Number(body?.estCostUsd)
    const refId = typeof body?.refId === 'string' ? body.refId.trim() : ''

    if (!Number.isInteger(krUserId) || krUserId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'krUserId must be a positive integer.',
      })
    }

    if (!CHARGEABLE_KINDS.includes(kind)) {
      throw createError({
        statusCode: 400,
        message: `kind must be one of: ${CHARGEABLE_KINDS.join(', ')}.`,
      })
    }

    if (!Number.isFinite(estCostUsd) || estCostUsd <= 0) {
      throw createError({
        statusCode: 400,
        message: 'estCostUsd must be a positive number.',
      })
    }

    if (!refId) {
      throw createError({
        statusCode: 400,
        message: 'refId is required.',
      })
    }

    const gate = await manaGate(event, {
      kind,
      estCostUsd,
      targetUserId: krUserId,
    })

    const { balance } = await gate.commit(refId, estCostUsd)

    return {
      success: true,
      message: 'Mana charged.',
      statusCode: 200,
      data: {
        balance,
        charged: gate.cost,
        free: gate.free,
      },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to charge mana.',
      statusCode: event.node.res.statusCode,
    }
  }
})
