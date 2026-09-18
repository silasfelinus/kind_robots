// Pure builder for the Butterfly Gallery generation contract (butterfly-
// gallery/t-019): turns a pile entry's current prompt/resource plus one or
// more ButterflyGenerationAction intents (butterfly-gallery/t-018) into a
// POST /api/art/enqueue request. Deliberately side-effect-free -- it only
// computes what to ask for, it never submits anything or touches the entry.
// See butterflyGalleryGenerationClient.ts for the submission half and
// persistBinGenerationActions() in butterflyGalleryActions.ts for how the
// two compose.
import type {
  ButterflyGenerationAction,
  ButterflyGenerationRequest,
  ButterflyPileEntry,
} from '@/types/butterflyGallery'

const BUTTERFLY_GENERATION_ENGINE = 'krea2' as const
const BUTTERFLY_GENERATION_PRIORITY = 100
const BUTTERFLY_GENERATION_DESIGNER = 'Kind Robots / Butterfly Gallery'
const BUTTERFLY_GENERATION_PROJECT_SLUG = 'butterfly-gallery' as const

/** Applies actions in array order, so a later action can build on or
 * override an earlier one within the same bin (e.g. switch-checkpoint then
 * append-prompt). add-variant/request-replacement are intent markers only --
 * they tell a caller whether to treat the resulting job as an additional
 * variant or a replacement candidate; neither changes what gets generated,
 * and nothing here ever reads or writes the entry's current image path. */
export function buildButterflyGenerationRequest(
  entry: ButterflyPileEntry,
  actions: ButterflyGenerationAction[],
): ButterflyGenerationRequest {
  let promptString = entry.prompt ?? ''
  const negativePrompt = entry.negativePrompt ?? ''
  let checkpoint = entry.resource.checkpoint
  let loras: Array<{ name: string; strength?: number }> =
    entry.resource.loras.map((name) => ({ name }))
  let generation: Record<string, string | number | boolean> = {}

  for (const action of actions) {
    switch (action.kind) {
      case 'add-lora':
        loras = [...loras, { name: action.resource, strength: action.weight }]
        break
      case 'replace-lora':
        loras = loras.map((lora) =>
          lora.name === action.from
            ? { name: action.to, strength: action.weight ?? lora.strength }
            : lora,
        )
        break
      case 'switch-checkpoint':
        checkpoint = action.resource
        break
      case 'append-prompt':
        promptString = [promptString, action.text]
          .filter((part) => part.trim().length > 0)
          .join(', ')
        break
      case 'replace-prompt':
        promptString = action.text
        break
      case 'set-generation':
        generation = { ...generation, ...action.values }
        break
      case 'add-variant':
      case 'request-replacement':
        break
      default:
        break
    }
  }

  return {
    engine: BUTTERFLY_GENERATION_ENGINE,
    promptString,
    negativePrompt,
    checkpoint,
    loras,
    projectSlug: BUTTERFLY_GENERATION_PROJECT_SLUG,
    priority: BUTTERFLY_GENERATION_PRIORITY,
    isPublic: entry.isPublic,
    isMature: entry.isMature,
    designer: BUTTERFLY_GENERATION_DESIGNER,
    generation,
  }
}
