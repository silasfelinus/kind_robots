import type { EndingId } from './endings'

/**
 * The eight original DONE ArtImage renders from Conductor's
 * art/ENDINGS-ROUND-1.yaml. An ending cannot be assigned a different image
 * by a caller of the delivery endpoint without a reviewed source change.
 */
export const ENDING_ART_IMAGE_IDS: Record<EndingId, number> = {
  'bell-restored': 270430,
  'open-roads': 270431,
  'iron-peace': 270432,
  'crows-bargain': 270433,
  'witchwater-throne': 270434,
  'tunnels-and-councils': 270435,
  'long-night': 270436,
  'hundred-candles': 270437,
}

export type EmperorArtDeliveryTarget = {
  asset: string
  artImageId: number
}

const CATEGORY = [
  'audiences',
  'barracks',
  'cast',
  'chance',
  'chance-events',
  'consequences',
  'endings',
  'forge',
  'followers',
  'items',
  'npcs',
  'quests',
  'rooms',
  'secret-story-scenes',
  'talks',
] as const

const ASSET_PATTERN = /^[a-zA-Z0-9-]+(?:\/[a-zA-Z0-9-]+)*$/
export const MAX_EMPEROR_ART_DELIVERY_BATCH = 24

/** A pure allowlist parser shared by the API and the game-art contract tests. */
export function parseEmperorArtDeliveryTargets(
  input: unknown,
): EmperorArtDeliveryTarget[] {
  if (
    !Array.isArray(input) ||
    input.length < 1 ||
    input.length > MAX_EMPEROR_ART_DELIVERY_BATCH
  ) {
    throw new Error(
      `Expected 1-${MAX_EMPEROR_ART_DELIVERY_BATCH} Emperor art targets.`,
    )
  }

  const seen = new Set<string>()
  return input.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item))
      throw new Error('Art target must be an object.')
    const object = item as Record<string, unknown>
    const asset = object.asset
    const artImageId = object.artImageId
    if (
      typeof asset !== 'string' ||
      !ASSET_PATTERN.test(asset) ||
      asset.length > 160
    ) {
      throw new Error('Unsafe Emperor art asset path.')
    }
    const category = asset.split('/')[0]!
    if (!CATEGORY.some((allowed) => allowed === category))
      throw new Error(`Unknown Emperor art category: ${category}.`)
    if (
      typeof artImageId !== 'number' ||
      !Number.isSafeInteger(artImageId) ||
      artImageId <= 0
    )
      throw new Error('ArtImage ID must be a positive integer.')
    if (seen.has(asset))
      throw new Error(`Duplicate Emperor art target: ${asset}.`)
    seen.add(asset)

    if (category === 'endings') {
      const ending = asset.slice('endings/'.length) as EndingId
      if (ENDING_ART_IMAGE_IDS[ending] !== artImageId) {
        throw new Error(`Ending plate source mismatch: ${asset}.`)
      }
    }
    return { asset, artImageId: Number(artImageId) }
  })
}

/**
 * Self-hosted durable media destination, separate from the historically
 * committed /emperor-of-dust/ static assets. Only approved, delivered files
 * should be referenced through this path.
 */
export const emperorMediaAssetPath = (asset: string): string =>
  asset.startsWith('followers/') || asset.startsWith('npcs/')
    ? `cast/${asset}`
    : asset

export const emperorMediaArtUrl = (asset: string): string =>
  `/images/emperor-of-dust/${emperorMediaAssetPath(asset)}.webp`

export const endingMediaArtUrl = (ending: EndingId): string =>
  emperorMediaArtUrl(`endings/${ending}`)
