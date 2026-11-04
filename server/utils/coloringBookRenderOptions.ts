import { createError } from 'h3'
import type {
  ColoringBookModelOption,
  ColoringBookRenderEngine,
  ColoringBookRenderOptions,
  ColoringBookRenderSettingsRequest,
} from '~/types/coloringBookStudio'
import { artLoraCompatibilityRank } from '~/utils/loraSelection'
import prisma from '@/server/utils/prisma'

// Engines Conductor's coloring consumer can render a color master on
// (scripts/coloring_render_settings.py ENGINES). `sdxl-checkpoint` renders any
// catalog SDXL/Illustrious checkpoint; the other three are fixed-model graphs.
export const COLORING_RENDER_ENGINES: ColoringBookRenderOptions['engines'] = [
  {
    value: 'krea2',
    label: 'Krea 2 (current default)',
    hint: 'Painterly, fast. Takes Krea LoRAs.',
  },
  {
    value: 'sdxl-checkpoint',
    label: 'SDXL / Illustrious checkpoint',
    hint: 'Pick any catalog checkpoint. Takes SDXL, Pony and Illustrious LoRAs.',
  },
  {
    value: 'flux2-klein',
    label: 'Flux.2 Klein',
    hint: 'Strong prompt following. Takes Flux.2 LoRAs.',
  },
  { value: 'flux', label: 'Flux.1 dev', hint: 'Takes Flux.1 LoRAs.' },
]

const ENGINE_VALUES = new Set(COLORING_RENDER_ENGINES.map((e) => e.value))

type ResourceRow = {
  id: number
  name: string
  customLabel: string | null
  localPath: string | null
  generation: string | null
  supportedServer: string
  resourceType: string
}

/** ComfyUI loader name: checkpoints load relative to models/checkpoints. */
export function comfyModelPath(
  row: Pick<ResourceRow, 'localPath' | 'resourceType'>,
): string {
  let path = String(row.localPath || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^models\//i, '')
  if (row.resourceType === 'CHECKPOINT')
    path = path.replace(/^checkpoints\//i, '')
  return path
}

function isSdxlCheckpoint(row: ResourceRow): boolean {
  const generation = String(row.generation || '').toUpperCase()
  if (generation.includes('1.5') || row.supportedServer === 'SD15') return false
  return (
    row.supportedServer === 'SDXL' ||
    /SDXL|ILLUSTRIOUS|PONY|NOOB/.test(generation) ||
    /^illustrious\//i.test(comfyModelPath(row))
  )
}

function loraEngines(row: ResourceRow): ColoringBookRenderEngine[] {
  const engines: ColoringBookRenderEngine[] = []
  if (artLoraCompatibilityRank(row, 'krea2') > 0) engines.push('krea2')
  if (artLoraCompatibilityRank(row, 'flux2') > 0) engines.push('flux2-klein')
  if (artLoraCompatibilityRank(row, 'flux') > 0) engines.push('flux')
  if (artLoraCompatibilityRank(row, 'comfy', 'illustrious') > 0) {
    engines.push('sdxl-checkpoint')
  }
  return engines
}

function option(
  row: ResourceRow,
  engines: ColoringBookRenderEngine[],
): ColoringBookModelOption {
  return {
    id: row.id,
    label: row.customLabel?.trim() || row.name,
    path: comfyModelPath(row),
    generation: row.generation,
    supportedServer: row.supportedServer,
    engines,
  }
}

const SELECT = {
  id: true,
  name: true,
  customLabel: true,
  localPath: true,
  generation: true,
  supportedServer: true,
  resourceType: true,
} as const

export async function loadColoringRenderOptions(): Promise<ColoringBookRenderOptions> {
  const rows = (await prisma.resource.findMany({
    where: {
      isActive: true,
      localPath: { not: null },
      resourceType: { in: ['CHECKPOINT', 'LORA', 'LYCORIS'] },
    },
    select: SELECT,
    orderBy: { name: 'asc' },
  })) as ResourceRow[]

  const checkpoints = rows
    .filter((row) => row.resourceType === 'CHECKPOINT' && isSdxlCheckpoint(row))
    .map((row) => option(row, ['sdxl-checkpoint']))
    // Illustrious-line checkpoints first: the family Silas wants to try.
    .sort(
      (a, b) =>
        Number(/illustrious/i.test(b.path + b.generation)) -
          Number(/illustrious/i.test(a.path + a.generation)) ||
        a.label.localeCompare(b.label),
    )
  const loras = rows
    .filter((row) => row.resourceType !== 'CHECKPOINT')
    .map((row) => option(row, loraEngines(row)))
    .filter((row) => row.engines.length && row.path)

  return { engines: COLORING_RENDER_ENGINES, checkpoints, loras }
}

/** Resolve studio picks (Resource ids) into the model paths Conductor submits. */
export async function resolveColoringRenderSettings(
  request: ColoringBookRenderSettingsRequest,
): Promise<{
  engine: string
  checkpoint: string | null
  lora: string | null
  lora_strength: number | null
}> {
  const engine = String(request.engine || '') as ColoringBookRenderEngine
  if (!ENGINE_VALUES.has(engine)) {
    throw createError({ statusCode: 400, message: 'Unknown render engine.' })
  }
  const ids = [request.checkpointId, request.loraId].filter(
    (id): id is number => Number.isInteger(id) && Number(id) > 0,
  )
  const rows = ids.length
    ? ((await prisma.resource.findMany({
        where: { id: { in: ids }, isActive: true },
        select: SELECT,
      })) as ResourceRow[])
    : []
  const byId = new Map(rows.map((row) => [row.id, row]))

  let checkpoint: string | null = null
  if (engine === 'sdxl-checkpoint') {
    const row = request.checkpointId ? byId.get(request.checkpointId) : null
    if (!row || row.resourceType !== 'CHECKPOINT' || !isSdxlCheckpoint(row)) {
      throw createError({
        statusCode: 400,
        message:
          'Pick an active SDXL or Illustrious checkpoint from the catalog.',
      })
    }
    checkpoint = comfyModelPath(row)
  }

  let lora: string | null = null
  let loraStrength: number | null = null
  if (request.loraId) {
    const row = byId.get(request.loraId)
    if (!row || row.resourceType === 'CHECKPOINT') {
      throw createError({
        statusCode: 400,
        message: 'That LoRA is not in the catalog.',
      })
    }
    if (!loraEngines(row).includes(engine)) {
      throw createError({
        statusCode: 400,
        message: `${row.customLabel || row.name} does not load on this engine.`,
      })
    }
    lora = comfyModelPath(row)
    const strength = Number(request.loraStrength ?? 1)
    if (!Number.isFinite(strength) || strength < 0 || strength > 2) {
      throw createError({
        statusCode: 400,
        message: 'LoRA strength must be between 0 and 2.',
      })
    }
    loraStrength = Math.round(strength * 100) / 100
  }

  return { engine, checkpoint, lora, lora_strength: loraStrength }
}
