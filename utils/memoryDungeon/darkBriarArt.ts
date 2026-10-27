import { DARK_BRIAR_SCENES, DARK_BRIAR_SEALS } from './darkBriar'
import {
  DARK_STYLE,
  TRAVELER,
  VISIBLE_ACTIONS,
  closeUpPrompt,
  consequencePrompt,
} from './artPromptParts'

export type DarkBriarArtKind =
  | 'encounter'
  | 'consequence'
  | 'seal'
  | 'backdrop'
  | 'transition'
  | 'matching-gallery'
export interface DarkBriarArtRequest {
  id: string
  title: string
  kind: DarkBriarArtKind
  prompt: string
  targetPath: string
  engine: 'comfy'
  priority: 'hero' | 'scene' | 'variant'
  jobId: null
  deliveredUrl: null
  delivery: 'not-submitted'
}

// Every brief is a complete literal prompt: the authored scene and seal
// prompts are used as written, and consequences and gallery faces are built
// from them with the shared pieces in ./artPromptParts.
function shot(
  id: string,
  title: string,
  kind: DarkBriarArtKind,
  prompt: string,
  targetPath: string,
  priority: DarkBriarArtRequest['priority'] = 'scene',
): DarkBriarArtRequest {
  return {
    id,
    title,
    kind,
    prompt,
    targetPath,
    priority,
    engine: 'comfy',
    jobId: null,
    deliveredUrl: null,
    delivery: 'not-submitted',
  }
}

const root = '/images/memory-dungeon/dark-briar'
const sites = Object.values(DARK_BRIAR_SCENES)
const sigils = Object.values(DARK_BRIAR_SEALS)

export const DARK_BRIAR_ART_REQUESTS: readonly DarkBriarArtRequest[] = [
  shot(
    'dark-briar-map',
    'The Forest Turns Inside Out',
    'backdrop',
    `Straight-down aerial view of a forest valley at night: winding trails between bare silver oaks, a creek along the southern edge, a river with a plank bridge through the eastern third, a cold camp with a tent in the west, a village of dark cottages, crumbling stone ruins, a gate of woven thorns at the eastern edge and a manor grown from roots in the northeast corner. The trails glow faint blue. ${DARK_STYLE}`,
    `${root}/backdrops/map.webp`,
    'hero',
  ),
  shot(
    'dark-briar-crossing',
    'Beyond the Chime',
    'transition',
    `On a forest road, ${TRAVELER} walks through an open gate of woven thorns. On the near side of the gate the forest is green in late daylight; on the far side the same road and trees are silver and violet under a huge pale moon. Wide shot from behind the traveller. ${DARK_STYLE}`,
    `${root}/transitions/chime.webp`,
    'hero',
  ),
  shot(
    'dark-briar-warden',
    'The House Remembers Wrong',
    'backdrop',
    `The front steps of a dark manor grown from roots at night, each of its many tall windows showing a pale villager looking out. Far back in the open doorway stands the Rootbound Warden, a towering guardian of knotted oak roots and brass keys with a carved wooden mask for a face, its reflection repeated in a puddle on the steps. Low-angle wide shot. ${DARK_STYLE}`,
    `${root}/backdrops/warden.webp`,
    'hero',
  ),
  ...sigils.map((seal) =>
    shot(
      `dark-briar-scene-${seal.key.replace(',', '-')}`,
      seal.title,
      'seal',
      seal.artPrompt,
      `${root}/scenes/${seal.key.replace(',', '-')}.webp`,
    ),
  ),
  ...sites.map((scene) =>
    shot(
      `dark-briar-scene-${scene.key.replace(',', '-')}`,
      scene.title,
      'encounter',
      scene.artPrompt,
      `${root}/scenes/${scene.key.replace(',', '-')}.webp`,
    ),
  ),
  ...sites.flatMap((scene) =>
    scene.choices.map((choice) =>
      shot(
        `dark-briar-outcome-${scene.key.replace(',', '-')}-${choice.id}`,
        `${scene.title}: ${choice.label}`,
        'consequence',
        consequencePrompt(
          scene.artPrompt,
          VISIBLE_ACTIONS[`dark-${scene.key.replace(',', '-')}-${choice.id}`] ??
            choice.label,
          DARK_STYLE,
        ),
        `${root}/outcomes/${scene.key.replace(',', '-')}-${choice.id}.webp`,
        'variant',
      ),
    ),
  ),
]

/** Thirty original faces tied to scenes and branch consequences, plus two cross-world visual clues. */
export const DARK_BRIAR_COLLECTIBLE_ART: readonly DarkBriarArtRequest[] = [
  ...sites
    .slice(0, 16)
    .map((scene, index) =>
      shot(
        `dark-briar-face-${String(index + 1).padStart(2, '0')}`,
        `Mirrored memory: ${scene.title}`,
        'matching-gallery',
        closeUpPrompt(scene.artPrompt, DARK_STYLE),
        `${root}/gallery/${String(index + 1).padStart(2, '0')}.webp`,
        'variant',
      ),
    ),
  ...sites
    .slice(0, 14)
    .map((scene, index) =>
      shot(
        `dark-briar-face-${String(index + 17).padStart(2, '0')}`,
        `Remembered consequence: ${scene.choices[0].label}`,
        'matching-gallery',
        consequencePrompt(
          scene.artPrompt,
          VISIBLE_ACTIONS[
            `dark-${scene.key.replace(',', '-')}-${scene.choices[0].id}`
          ] ?? scene.choices[0].label,
          DARK_STYLE,
          'close',
        ),
        `${root}/gallery/${String(index + 17).padStart(2, '0')}.webp`,
        'variant',
      ),
    ),
  shot(
    'dark-briar-face-31',
    'The Shared Hearth Remembered',
    'matching-gallery',
    `A small stone hearth with an orange fire glowing inside, held in a cradle of black thorny roots rimmed with silver frost, one round loaf of bread on the hearth stone. Violet moonlight all around, warm firelight within. Close-up, centered. ${DARK_STYLE}`,
    `${root}/gallery/31.webp`,
    'variant',
  ),
  shot(
    'dark-briar-face-32',
    'The Tide under the Roots',
    'matching-gallery',
    `A silver mermaid crown set with pearls lies upside down at the bottom of a still black pool among dark briar roots, its reflection floating on the surface above it. Violet moonlight on the water. Close-up, centered. ${DARK_STYLE}`,
    `${root}/gallery/32.webp`,
    'variant',
  ),
]

/** Select the authored scene, seal or earned consequence plate by its stable
 * destination. An unknown/forged choice never selects an unrelated outcome.
 * This resolves paths only; failed media loads retain the illustrated fallback. */
export function darkBriarIllustrationPath(
  key: string,
  choiceId?: string,
): string {
  const stem = key.replace(',', '-')
  const scene = DARK_BRIAR_SCENES[key]
  if (scene) {
    if (choiceId && scene.choices.some((choice) => choice.id === choiceId))
      return `${root}/outcomes/${stem}-${choiceId}.webp`
    return `${root}/scenes/${stem}.webp`
  }
  if (DARK_BRIAR_SEALS[key]) return `${root}/scenes/${stem}.webp`
  return `${root}/backdrops/map.webp`
}

export function validateDarkBriarArtRequests(): string[] {
  const errors: string[] = []
  if (DARK_BRIAR_COLLECTIBLE_ART.length !== 32)
    errors.push('Dark gallery must have 30+2 independent images')
  if (DARK_BRIAR_ART_REQUESTS.length !== 187)
    errors.push(
      'Dark map requires 3 hero + 60 encounters + 120 consequences + 4 seal illustrations',
    )
  const all = [...DARK_BRIAR_ART_REQUESTS, ...DARK_BRIAR_COLLECTIBLE_ART]
  if (new Set(all.map((asset) => asset.id)).size !== all.length)
    errors.push('Duplicate Dark Briar art IDs')
  if (new Set(all.map((asset) => asset.targetPath)).size !== all.length)
    errors.push('Art targets overlap')
  if (
    all.some(
      (asset) =>
        !asset.prompt.trim() ||
        !asset.targetPath ||
        asset.jobId !== null ||
        asset.delivery !== 'not-submitted',
    )
  ) {
    errors.push('Missing art brief or a request wrongly claimed delivered')
  }
  return errors
}
