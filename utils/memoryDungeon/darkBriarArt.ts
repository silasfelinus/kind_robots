import { DARK_BRIAR_SCENES } from './darkBriar'

export type DarkBriarArtKind = 'encounter' | 'consequence' | 'backdrop' | 'transition' | 'matching-gallery'
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

const style = 'Original dark Grimm storybook western-animation painting, coherent Briar topography, sculptural environmental storytelling, expressive adult characters, dramatic reverse-moonlight, detailed but legible silhouette, no text, no lettering, no watermark, no montage.'

function shot(
  id: string,
  title: string,
  kind: DarkBriarArtKind,
  subject: string,
  targetPath: string,
  priority: DarkBriarArtRequest['priority'] = 'scene',
): DarkBriarArtRequest {
  return {
    id, title, kind, prompt: `${subject} ${style}`, targetPath, priority,
    engine: 'comfy', jobId: null, deliveredUrl: null, delivery: 'not-submitted',
  }
}

const root = '/images/memory-dungeon/dark-briar'
const sites = Object.values(DARK_BRIAR_SCENES)

export const DARK_BRIAR_ART_REQUESTS: readonly DarkBriarArtRequest[] = [
  shot('dark-briar-map', 'The Forest Turns Inside Out', 'backdrop',
    'Square game-map underlay of exactly the same road and landmark arrangement as original Briar Marches, but every road means something different; map must be readable under 8 by 8 coordinate overlay, no labels.',
    `${root}/backdrops/map.webp`, 'hero'),
  shot('dark-briar-crossing', 'Beyond the Chime', 'transition',
    'Cinematic seamless shot: traveler approaches the familiar Thorn Gate, its shadow opens before the thorns, then the same forest is revealed in reversed moonlight. Distinct single still for a future transition animation.',
    `${root}/transitions/chime.webp`, 'hero'),
  shot('dark-briar-warden', 'The House Remembers Wrong', 'backdrop',
    'Hero artwork of haunted Manor entrance and distant mirrored Rootbound Warden, witnesses reflected in many impossible windows; environment for an ethical standoff rather than a generic boss battle.',
    `${root}/backdrops/warden.webp`, 'hero'),
  ...sites.map((scene) => shot(
    `dark-briar-scene-${scene.key.replace(',', '-')}`,
    scene.title,
    'encounter',
    scene.artPrompt,
    `${root}/scenes/${scene.key.replace(',', '-')}.webp`,
  )),
  ...sites.flatMap((scene) => scene.choices.map((choice) => shot(
    `dark-briar-outcome-${scene.key.replace(',', '-')}-${choice.id}`,
    `${scene.title}: ${choice.label}`,
    'consequence',
    `A single clear in-world story consequence: ${choice.outcome}. Preserve place identity and demonstrate the consequence visually, not a generic emotional close-up.`,
    `${root}/outcomes/${scene.key.replace(',', '-')}-${choice.id}.webp`,
    'variant',
  ))),
]

/** Thirty original faces tied to scenes and branch consequences, plus two cross-world visual clues. */
export const DARK_BRIAR_COLLECTIBLE_ART: readonly DarkBriarArtRequest[] = [
  ...sites.map((scene, index) => shot(
    `dark-briar-face-${String(index + 1).padStart(2, '0')}`,
    `Mirrored memory: ${scene.title}`,
    'matching-gallery',
    `Single centered legible picture-card composition, visually distinct at phone scale: ${scene.artPrompt}`,
    `${root}/gallery/${String(index + 1).padStart(2, '0')}.webp`,
    'variant',
  )),
  ...sites.slice(0, 14).map((scene, index) => shot(
    `dark-briar-face-${String(index + 17).padStart(2, '0')}`,
    `Remembered consequence: ${scene.choices[0].label}`,
    'matching-gallery',
    `Single iconic card-size image of the specific altered outcome: ${scene.choices[0].outcome}. Visually different from the scene establishing shot. No lettering.`,
    `${root}/gallery/${String(index + 17).padStart(2, '0')}.webp`,
    'variant',
  )),
  shot('dark-briar-face-31', 'The Shared Hearth Remembered', 'matching-gallery',
    'A dark-briar root holds a precious warm hearth that belongs to the future Hearth/Hunger world, visual rhyme with another realm, centered collectible without text.',
    `${root}/gallery/31.webp`, 'variant'),
  shot('dark-briar-face-32', 'The Tide under the Roots', 'matching-gallery',
    'An upside-down mermaid crown reflected in dark-briar pools, future cross-realm clue to Scylla and Char’s underwater home, centered collectible without text.',
    `${root}/gallery/32.webp`, 'variant'),
]

export function validateDarkBriarArtRequests(): string[] {
  const errors: string[] = []
  if (DARK_BRIAR_COLLECTIBLE_ART.length !== 32) errors.push('Dark gallery must have 30+2 independent images')
  if (DARK_BRIAR_ART_REQUESTS.length !== 51) errors.push('Dark pilot requires 3 hero + 16 encounter + 32 consequence briefs')
  const all = [...DARK_BRIAR_ART_REQUESTS, ...DARK_BRIAR_COLLECTIBLE_ART]
  if (new Set(all.map((asset) => asset.id)).size !== all.length) errors.push('Duplicate Dark Briar art IDs')
  if (new Set(all.map((asset) => asset.targetPath)).size !== all.length) errors.push('Art targets overlap')
  if (all.some((asset) => !asset.prompt.trim() || !asset.targetPath || asset.jobId !== null || asset.delivery !== 'not-submitted')) {
    errors.push('Missing art brief or a request wrongly claimed delivered')
  }
  return errors
}
