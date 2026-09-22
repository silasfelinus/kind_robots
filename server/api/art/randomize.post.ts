// /server/api/art/randomize.post.ts
//
// Turns one templated prompt into a batch plan.
//
// It deliberately does NOT enqueue. A batch of ten is ten durable ArtJobs and
// ten charges of mana, and AGENTS.md's own rule is that queued is not rendered
// -- so the roll is separated from the commitment, and the caller can show
// Silas exactly which ten characters and ten styles came up before spending
// anything on them. /api/art/enqueue stays the single place a job is born.
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import {
  buildArtRandomPools,
  knownArtPlaceholders,
  ART_RANDOM_POOL_SOURCES,
  type ArtRandomPoolSource,
} from '~/server/utils/artRandomPools'
import {
  extractPlaceholderKeys,
  generateStructuredPromptVariants,
} from '~/server/utils/promptVariants'
import { MAX_RANDOM_BATCH } from '~/utils/artRandomBatch'
import type {
  ArtGeneratorEngine,
  CheckpointFamily,
} from '~/utils/artGeneratorPresets'

const ENGINES: ArtGeneratorEngine[] = [
  'krea2',
  'flux2',
  'flux',
  'comfy',
  'sdxl-img2img',
]

const CHECKPOINT_FAMILIES: CheckpointFamily[] = [
  'sdxl',
  'sdxl-distilled',
  'pony',
  'sd15',
  'archive',
  'unknown',
]

type RandomizeBody = {
  basePrompt?: unknown
  batch?: unknown
  engine?: unknown
  checkpointFamily?: unknown
  sources?: unknown
  loraStrength?: unknown
  seed?: unknown
  showMature?: unknown
}

function parseSources(value: unknown): ArtRandomPoolSource[] | undefined {
  if (!Array.isArray(value)) return undefined
  const parsed = value
    .map((entry) => String(entry).trim().toLowerCase())
    .filter((entry): entry is ArtRandomPoolSource =>
      ART_RANDOM_POOL_SOURCES.includes(entry as ArtRandomPoolSource),
    )
  return parsed.length ? [...new Set(parsed)] : undefined
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await getOptionalApiUser(event)
    if (!auth?.user) {
      throw createError({
        statusCode: 401,
        message: 'Authentication required.',
      })
    }

    const body = await readBody<RandomizeBody>(event)
    const basePrompt = String(body?.basePrompt ?? '').trim()

    if (!basePrompt) {
      throw createError({ statusCode: 400, message: 'basePrompt is required.' })
    }

    const batch = Number(body?.batch ?? 1)
    if (!Number.isInteger(batch) || batch < 1 || batch > MAX_RANDOM_BATCH) {
      throw createError({
        statusCode: 400,
        message: `batch must be an integer between 1 and ${MAX_RANDOM_BATCH}.`,
      })
    }

    /*
     * An engine outside the Comfy lanes (OpenAI, a1111) is not an error -- it
     * is a lane that cannot load LoRAs at all. Rolling a character LoRA for it
     * would put a trigger word in the prompt and attach weights nothing will
     * ever load, which reads as a broken randomizer rather than as an
     * unsupported engine. Null means "no LoRA pools"; the Facet, Character and
     * Scenario pools still answer.
     */
    const requestedEngine = String(body?.engine ?? 'krea2')
    const engine = ENGINES.includes(requestedEngine as ArtGeneratorEngine)
      ? (requestedEngine as ArtGeneratorEngine)
      : null

    const requestedFamily = String(body?.checkpointFamily ?? 'unknown')
    const checkpointFamily = CHECKPOINT_FAMILIES.includes(
      requestedFamily as CheckpointFamily,
    )
      ? (requestedFamily as CheckpointFamily)
      : 'unknown'

    const loraStrength = Number(body?.loraStrength ?? 1)

    const keys = extractPlaceholderKeys(basePrompt, { allowSingleBrace: true })

    const pools = await buildArtRandomPools(keys, {
      engine,
      checkpointFamily,
      sources: parseSources(body?.sources),
      loraStrength:
        Number.isFinite(loraStrength) && loraStrength > 0 ? loraStrength : 1,
      user: auth.user,
      isAdmin: auth.isAdmin ?? false,
      showMature:
        typeof body?.showMature === 'boolean' ? body.showMature : undefined,
    })

    const seed =
      Number.isInteger(Number(body?.seed)) && Number(body?.seed) > 0
        ? Number(body.seed)
        : Math.floor(Math.random() * 2 ** 31)

    const variants = generateStructuredPromptVariants(
      basePrompt,
      batch,
      pools.getPool,
      { allowSingleBrace: true, lenient: true, seed },
    )

    return {
      success: true,
      message: keys.length
        ? `Rolled ${variants.length} variant(s) across ${keys.length} placeholder(s).`
        : `No placeholders found; returned ${variants.length} copy/copies of the prompt.`,
      data: {
        seed,
        engine: engine ?? requestedEngine,
        supportsLora: engine !== null,
        checkpointFamily,
        placeholders: keys,
        pools: pools.reports,
        known: knownArtPlaceholders(),
        variants: variants.map((variant) => ({
          variantKey: variant.variantKey,
          promptString: variant.promptUsed,
          loraResourceIds: variant.loraPicks.map((pick) => pick.resourceId),
          loras: variant.loraPicks,
          selections: variant.picks,
          unresolvedKeys: variant.unresolvedKeys,
        })),
      },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return {
      success: false,
      message: handled.message,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
