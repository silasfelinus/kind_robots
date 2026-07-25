// /server/api/art/utils/resourceProvenance.ts
//
// Resolves which Resource rows a generated ArtImage used, so provenance can be
// recorded on the image (ArtImage.checkpointResourceId + ArtImage.LoraResources)
// and we can later query "all art that used Resource X".
//
// It reads the `resources` block that enqueue stamps onto the ArtJob payload
// (explicit resource IDs from the picker, plus the checkpoint/LoRA name strings
// for name-backfill of generations made before the picker existed). Every ID is
// verified to exist before it is returned, so callers can connect the results
// without risking a foreign-key error.
//
// This is intentionally BEST-EFFORT: any failure resolves to "no links" rather
// than throwing, because provenance must never break a successful render.
import {
  ResourceType,
  type Prisma,
} from '~/prisma/generated/prisma/client'
import { parseArtJobPayload } from '../../../utils/artJobPayload'

type ResourceDelegate = {
  findFirst: (
    args: Prisma.ResourceFindFirstArgs,
  ) => PromiseLike<{ id: number } | null>
  findMany: (
    args: Prisma.ResourceFindManyArgs,
  ) => PromiseLike<Array<{ id: number }>>
}

type ResourceClient = { resource: unknown }

export type ArtImageResourceLinks = {
  checkpointResourceId: number | null
  loraResourceIds: number[]
}

const LORA_TYPES: ResourceType[] = [ResourceType.LORA, ResourceType.LYCORIS]

function posInt(value: unknown): number | null {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : null
}

function posIntArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return [
    ...new Set(
      value.map(posInt).filter((n): n is number => n !== null),
    ),
  ]
}

function cleanName(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

// Resolve a free-text checkpoint/LoRA name to a Resource id. A model is stored
// under several names (file stem, pretty label, on-disk path), so we match any.
async function resolveByName(
  resource: ResourceDelegate,
  name: string,
  types: ResourceType[],
): Promise<number | null> {
  const row = await resource.findFirst({
    where: {
      resourceType: { in: types },
      OR: [{ localPath: name }, { name }, { customLabel: name }],
    },
    select: { id: true },
    orderBy: { id: 'asc' },
  })
  return row?.id ?? null
}

export async function resolveArtImageResourceLinks(
  payload: unknown,
  client: ResourceClient,
): Promise<ArtImageResourceLinks> {
  try {
    // Prisma 7's root client and transaction client expose different generic
    // delegate wrappers even though the two methods used here share the same
    // runtime contract. Narrow only at the call site instead of requiring a
    // full PrismaClient delegate type.
    const resource = client.resource as ResourceDelegate
    const record = parseArtJobPayload(payload) as Record<string, unknown>
    const block =
      record.resources && typeof record.resources === 'object'
        ? (record.resources as Record<string, unknown>)
        : {}

    let checkpointResourceId = posInt(block.checkpointResourceId)
    let loraResourceIds = posIntArray(block.loraResourceIds)

    // Verify the claimed IDs actually exist (drop any that don't).
    const claimed = [
      ...(checkpointResourceId ? [checkpointResourceId] : []),
      ...loraResourceIds,
    ]
    if (claimed.length) {
      const found = new Set(
        (
          await resource.findMany({
            where: { id: { in: claimed } },
            select: { id: true },
          })
        ).map((r) => r.id),
      )
      if (checkpointResourceId && !found.has(checkpointResourceId)) {
        checkpointResourceId = null
      }
      loraResourceIds = loraResourceIds.filter((id) => found.has(id))
    }

    // Name-backfill when the picker didn't supply IDs (older/string path).
    if (!checkpointResourceId) {
      const name = cleanName(block.checkpointName)
      if (name) {
        checkpointResourceId = await resolveByName(resource, name, [
          ResourceType.CHECKPOINT,
        ])
      }
    }
    if (!loraResourceIds.length && Array.isArray(block.loraNames)) {
      const names = block.loraNames
        .map(cleanName)
        .filter((s): s is string => s !== null)
      const resolved = await Promise.all(
        names.map((n) => resolveByName(resource, n, LORA_TYPES)),
      )
      loraResourceIds = [
        ...new Set(resolved.filter((n): n is number => n !== null)),
      ]
    }

    return { checkpointResourceId, loraResourceIds }
  } catch {
    return { checkpointResourceId: null, loraResourceIds: [] }
  }
}

// Build the Prisma update fragment that connects the resolved links onto an
// ArtImage. Safe to spread into an unchecked update: `checkpointResourceId` is a
// scalar FK and `LoraResources` is an M2M relation op (available on both checked
// and unchecked update inputs).
export function artImageResourceConnectData(links: ArtImageResourceLinks): {
  checkpointResourceId?: number
  LoraResources?: { connect: { id: number }[] }
} {
  return {
    ...(links.checkpointResourceId
      ? { checkpointResourceId: links.checkpointResourceId }
      : {}),
    ...(links.loraResourceIds.length
      ? {
          LoraResources: {
            connect: links.loraResourceIds.map((id) => ({ id })),
          },
        }
      : {}),
  }
}
