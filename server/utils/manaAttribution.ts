// /server/utils/manaAttribution.ts
//
// kind-economy/t-007: attribute each chargeable generation to the creator
// whose object seeded it.
//
// applyMana()'s refId was free text and carried no creator identity, so "the
// creator of the object that inspired the interaction" could never be
// identified at spend time. This module is the one place that inventory
// lives: OWNER_LOOKUP maps every object type that can seed a paid
// interaction (ManaAttributionSource, prisma/schema.prisma) to how its
// owning/creating user is resolved. A generation entry point that knows
// which object seeded it passes a `ManaSource` into manaGate(); manaGate
// resolves it here and writes the result onto the ManaTransaction row
// (sourceType/sourceId/creatorUserId/isSelfAttribution) -- see
// server/utils/manaGate.ts and server/utils/mana.ts.
//
// FALLBACK (documented per the task's own instruction to state it): when
// creatorUserId can't be resolved -- no source was passed at all (most
// generation entry points today: a freeform chat prompt, an from-scratch
// art gen, etc. don't have a seed object), the source id doesn't exist
// (deleted), or the object's owner is null (system/admin-seeded content) --
// this resolves to `creatorUserId: null`. Per the kind-economy design
// brief, a spend with no creator to pay does NOT fall to the platform: the
// creator third of any future RevenueSplit (t-008 builds the actual ledger)
// falls through to the mission share instead. This module only RECORDS
// that fact; it does not move any money itself.
//
// SELF-ATTRIBUTION (a creator generating from their own object, e.g.
// chatting with a Bot they made themselves): recorded explicitly via
// `isSelfAttribution`, never silently dropped or silently paid out.
// Whether a creator earns a creator-share on their own spend is a policy
// decision kind-economy/t-021 ("Self-attribution policy — can Silas earn
// creator share on his own assets") owns deciding. Until t-021 resolves,
// `isSelfAttribution` is data only -- t-008 must read it before crediting
// EARNED tokens for a row where it's true, not assume either answer.
import prisma from './prisma'
import type { ManaAttributionSource } from '~/prisma/generated/prisma/client'

export type ManaSource = {
  type: ManaAttributionSource
  id: number
}

export type ManaAttribution = {
  source: ManaSource | null
  creatorUserId: number | null
  isSelfAttribution: boolean
}

type OwnerLookup = (id: number) => Promise<number | null>

// One entry per ManaAttributionSource value. Extend this map -- and the
// enum in prisma/schema.prisma -- when a new object type needs to seed a
// chargeable generation; nothing else should hand-roll a second lookup.
// Each lookup selects only its owner column, never the full row.
const OWNER_LOOKUP: Record<ManaAttributionSource, OwnerLookup> = {
  BOT: async (id) =>
    (await prisma.bot.findUnique({ where: { id }, select: { userId: true } }))
      ?.userId ?? null,
  CHARACTER: async (id) =>
    (
      await prisma.character.findUnique({
        where: { id },
        select: { userId: true },
      })
    )?.userId ?? null,
  FACET: async (id) =>
    (
      await prisma.facet.findUnique({
        where: { id },
        select: { userId: true },
      })
    )?.userId ?? null,
  SCENARIO: async (id) =>
    (
      await prisma.scenario.findUnique({
        where: { id },
        select: { userId: true },
      })
    )?.userId ?? null,
  PITCH: async (id) =>
    (
      await prisma.pitchSheet.findUnique({
        where: { id },
        select: { userId: true },
      })
    )?.userId ?? null,
  ART: async (id) =>
    (
      await prisma.artImage.findUnique({
        where: { id },
        select: { userId: true },
      })
    )?.userId ?? null,
  PACK: async (id) =>
    (
      await prisma.pack.findUnique({
        where: { id },
        select: { ownerId: true },
      })
    )?.ownerId ?? null,
  REWARD: async (id) =>
    (
      await prisma.reward.findUnique({
        where: { id },
        select: { userId: true },
      })
    )?.userId ?? null,
  DREAM: async (id) =>
    (
      await prisma.dream.findUnique({
        where: { id },
        select: { userId: true },
      })
    )?.userId ?? null,
}

// Pure, DB-free: which types this module knows how to resolve. Exported so
// callers (and utils/scripts/verifyManaAttribution.ts) can validate a
// ManaSource without needing a database. Kept in sync with OWNER_LOOKUP by
// deriving from the same object rather than a hand-duplicated list.
export const MANA_ATTRIBUTION_SOURCE_TYPES = Object.keys(
  OWNER_LOOKUP,
) as ManaAttributionSource[]

/**
 * Resolve a ManaSource into the creator who should be attributed for this
 * spend, or null when there's nothing to resolve (no source, unknown type,
 * not found, or a null owner). Never throws: a lookup failure degrades to
 * "no attribution" (the mission-share fallback above), never a failed
 * charge -- attribution enriches the ledger, it must not gate it.
 */
export async function resolveManaAttribution(
  source: ManaSource | null | undefined,
  spendingUserId: number,
): Promise<ManaAttribution> {
  if (!source) {
    return { source: null, creatorUserId: null, isSelfAttribution: false }
  }

  const lookup = OWNER_LOOKUP[source.type]
  if (!lookup) {
    return { source, creatorUserId: null, isSelfAttribution: false }
  }

  let creatorUserId: number | null
  try {
    creatorUserId = await lookup(source.id)
  } catch (error) {
    console.warn(
      '[manaAttribution] failed to resolve creator for source',
      source,
      error,
    )
    creatorUserId = null
  }

  return {
    source,
    creatorUserId,
    isSelfAttribution:
      creatorUserId !== null && creatorUserId === spendingUserId,
  }
}
