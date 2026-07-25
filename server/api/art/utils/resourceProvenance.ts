// /server/api/art/utils/resourceProvenance.ts
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
  ) => PromiseLike<Array<{ id: number; resourceType: ResourceType }>>
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

async function resolveByName(
  resource: ResourceDelegate,
  name: string,
  types: ResourceType[],
): Promise<number | null> {
  const row = await resource.findFirst({
    where: {
      resourceType: { in: types },
      isActive: true,
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
    const resource = client.resource as ResourceDelegate
    const record = parseArtJobPayload(payload) as Record<string, unknown>
    const block =
      record.resources && typeof record.resources === 'object'
        ? (record.resources as Record<string, unknown>)
        : {}

    let checkpointResourceId = posInt(block.checkpointResourceId)
    let loraResourceIds = posIntArray(block.loraResourceIds)
    const claimed = [
      ...(checkpointResourceId ? [checkpointResourceId] : []),
      ...loraResourceIds,
    ]

    if (claimed.length) {
      const found = await resource.findMany({
        where: {
          id: { in: claimed },
          isActive: true,
          resourceType: {
            in: [ResourceType.CHECKPOINT, ...LORA_TYPES],
          },
        },
        select: { id: true, resourceType: true },
      })
      const checkpointIds = new Set(
        found
          .filter((row) => row.resourceType === ResourceType.CHECKPOINT)
          .map((row) => row.id),
      )
      const loraIds = new Set(
        found
          .filter((row) => LORA_TYPES.includes(row.resourceType))
          .map((row) => row.id),
      )

      if (
        checkpointResourceId &&
        !checkpointIds.has(checkpointResourceId)
      ) {
        checkpointResourceId = null
      }
      loraResourceIds = loraResourceIds.filter((id) => loraIds.has(id))
    }

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
        .filter((value): value is string => value !== null)
      const resolved = await Promise.all(
        names.map((name) => resolveByName(resource, name, LORA_TYPES)),
      )
      loraResourceIds = [
        ...new Set(resolved.filter((id): id is number => id !== null)),
      ]
    }

    return { checkpointResourceId, loraResourceIds }
  } catch {
    return { checkpointResourceId: null, loraResourceIds: [] }
  }
}

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
