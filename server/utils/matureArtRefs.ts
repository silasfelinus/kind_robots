// /server/utils/matureArtRefs.ts
//
// withholdMature() removes mature records EMBEDDED in a payload. An entity
// (Reward, Dream, Character, Bot, Scenario...) also carries its art as plain
// fields -- `artImageId` and a copied `imagePath` -- and those point at a mature
// image even when the entity itself is not mature. withholdMatureEntities()
// does both for a viewer who must not see mature content: it drops embedded
// mature records, then nulls `artImageId`/`imagePath` on any entity, at any
// depth, whose linked image is mature. One batched lookup per payload.
import prisma from './prisma'
import { withholdMature } from './matureBarrier'

function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  )
}

function artImageIdOf(value: Record<string, unknown>): number | null {
  const id = value.artImageId
  return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : null
}

function collectArtImageIds(value: unknown, into: Set<number>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectArtImageIds(item, into)
    return
  }
  if (!isObject(value)) return
  const id = artImageIdOf(value)
  if (id !== null) into.add(id)
  for (const child of Object.values(value)) collectArtImageIds(child, into)
}

function nullMatureRefs(value: unknown, mature: Set<number>): unknown {
  if (Array.isArray(value)) return value.map((v) => nullMatureRefs(v, mature))
  if (!isObject(value)) return value

  const id = artImageIdOf(value)
  const out: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value)) {
    out[key] = nullMatureRefs(child, mature)
  }
  if (id !== null && mature.has(id)) {
    out.artImageId = null
    if ('imagePath' in out) out.imagePath = null
    if ('avatarImage' in out) out.avatarImage = null
  }
  return out
}

export async function withholdMatureEntities<T>(
  value: T,
  hide: boolean,
): Promise<T> {
  if (!hide) return value

  const scrubbed = withholdMature(value, true)
  const ids = new Set<number>()
  collectArtImageIds(scrubbed, ids)
  if (!ids.size) return scrubbed

  const rows = await prisma.artImage.findMany({
    where: { id: { in: [...ids] }, isMature: true },
    select: { id: true },
  })
  if (!rows.length) return scrubbed

  return nullMatureRefs(scrubbed, new Set(rows.map((row) => row.id))) as T
}
