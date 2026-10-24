import { BRIAR_EARTH_PHOTOS } from './chronicle'
import { WORLD_ONE_GALLERY, validateRealmGallery } from './realmGallery'
import { HOUSE_ROOMS } from './house'
import { BRIAR_TILES } from '../memoryDungeonWorld'
import { BRIAR_STORY_ATLAS } from '../memoryDungeonStoryAtlas'

export type MemoryArtKind =
  | 'overworld'
  | 'overworld-outcome'
  | 'dungeon'
  | 'dungeon-outcome'
  | 'portrait'
  | 'monster'
  | 'backdrop'
  | 'transition'
  | 'card-back'
  | 'photograph'
  | 'cinematic'
  | 'match-gallery'

export type MemoryArtFormat = 'landscape' | 'portrait' | 'square' | 'card'

export interface MemoryArtShot {
  id: string
  kind: MemoryArtKind
  format: MemoryArtFormat
  title: string
  prompt: string
  targetPath: string
  engine: 'comfy'
  priority: 'hero' | 'scene' | 'variant'
  jobId: null
  deliveredUrl: null
  delivery: 'not-submitted'
}

const look =
  'Original hand-painted western animation, mature Grimm fairy tale, expressive acting, intricate tactile environments, controlled cinematic lighting. No words, lettering, watermark, montage, or UI.'

function shot(
  id: string,
  kind: MemoryArtKind,
  format: MemoryArtFormat,
  title: string,
  subject: string,
  targetPath: string,
  priority: MemoryArtShot['priority'] = 'scene',
): MemoryArtShot {
  return {
    id,
    kind,
    format,
    title,
    prompt: `${look} ${subject}`,
    targetPath,
    engine: 'comfy',
    priority,
    jobId: null,
    deliveredUrl: null,
    delivery: 'not-submitted',
  }
}

const artRoot = '/images/memory-dungeon'
const sceneRoot = `${artRoot}/briar`
const houseRoot = `${artRoot}/house/rooms`

const openingShots: MemoryArtShot[] = [
  shot(
    'intro-earth',
    'cinematic',
    'landscape',
    'The Last Ordinary Evening',
    'A contemporary data-research office at twilight, coffee ring beside tidy datasets, an impossible reflection growing between fluorescent lights and window glass; single cohesive frame.',
    `${artRoot}/cinematics/earth-office.webp`,
    'hero',
  ),
  shot(
    'intro-exchange',
    'cinematic',
    'landscape',
    'The Changeling Trade',
    'Two androgynous adults, the Earth researcher and enigmatic fey Morrow, reflected in a pane separating fluorescent office from living moonlit forest; an unsettling body exchange, not a romance.',
    `${artRoot}/cinematics/changeling-trade.webp`,
    'hero',
  ),
  shot(
    'intro-arrival',
    'cinematic',
    'landscape',
    'Briar Arrival',
    'First-person arrival in the Briar Marches, roots curling across old stones, warm campfire ahead, distant forbidding manor, dense illustrated panorama with generous space for game overlays.',
    `${artRoot}/cinematics/briar-arrival.webp`,
    'hero',
  ),
  shot(
    'map-dawn',
    'backdrop',
    'landscape',
    'Briar Marches',
    'One continuous overhead fantasy adventure board landscape, wooded trails, creek, thorn gate, compact village, dangerous ruins and a rooted mansion at the northeast, landmarks placed for an 8x8 interactive map, no labels.',
    `${artRoot}/backdrops/briar-overworld.webp`,
    'hero',
  ),
  shot(
    'house-interior',
    'backdrop',
    'landscape',
    'House That Remembers',
    'Impossible memory-haunted manor hall with bent staircases, brass mirrors and carved roots, believable playable depth and doorways, ominous but intimate.',
    `${artRoot}/backdrops/house-interior.webp`,
    'hero',
  ),
  shot(
    'secret-vault',
    'backdrop',
    'landscape',
    'Secret Memory Vault',
    'Hidden candlelit archive behind twisting root walls, two interlocked leaf sigils in a carved stone doorway, fair environmental puzzle clues, subtle treasure.',
    `${artRoot}/backdrops/secret-vault.webp`,
    'hero',
  ),
  shot(
    'combat-stage',
    'backdrop',
    'landscape',
    'Memory Duel',
    'Forest clearing transformed into a magic memory duel arena, danger approaching from the far side, quiet low-contrast center reserved for a readable playing board.',
    `${artRoot}/backdrops/combat.webp`,
    'hero',
  ),
  shot(
    'briar-unveil',
    'transition',
    'landscape',
    'First Realm Unveiled',
    'From darkness to a revealed storybook forest, the mapped camp paths brightening in paired islands through fog, cinematic wide establishing art.',
    `${artRoot}/transitions/briar-unveil.webp`,
    'hero',
  ),
  shot(
    'next-world-unveil',
    'transition',
    'landscape',
    'Beyond the Thorn Gate',
    'A bramble gate opens onto the warm lights of a bread-and-hearth village, first suggestion of the next realm without displaying a finished second map.',
    `${artRoot}/transitions/second-realm.webp`,
    'hero',
  ),
  shot(
    'card-back-briar',
    'card-back',
    'card',
    'Briar Crest',
    'A seamless centered playing-card back, thorn and leaf filigree, dark evergreen and antique gold, symmetric top to bottom, graphic detail legible at mobile size.',
    `${artRoot}/card-backs/briar-default.webp`,
    'hero',
  ),
  shot(
    'card-back-arcane',
    'card-back',
    'card',
    'Moonlit Cipher',
    'A seamless centered playing-card back, moonlight silver over ink-dark brambles, cryptic twin seals, symmetric top to bottom, graphic detail legible at mobile size.',
    `${artRoot}/card-backs/briar-arcane.webp`,
    'hero',
  ),
  ...[
    [
      'scylla',
      'Princess Scylla',
      'Adult sturdy mermaid princess with poised bearing, meticulously proper travel coat, polished crown, neatly styled hair, same face and physique as twin Char.',
    ],
    [
      'char',
      'Princess Charybdis',
      'Adult sturdy mermaid princess, darker skin from different magical waters, authentic layered goth velvet and lace, silver jewelry and distinctive makeup, identical facial structure and build to Scylla.',
    ],
    [
      'oren',
      'Master Oren Pike',
      'Tired formidable royal headsman with permanent cloth executioner hood with eyeholes, ceremonial axe, precise travel manifest and an implausibly organized supply cart; NEVER reveal face.',
    ],
    [
      'morrow',
      'Morrow',
      'Ambiguous androgynous fey changeling, sharply curious, caught between fairy-tale body and longing for an ordinary data-research career, expressive uncertain gaze.',
    ],
    [
      'mosswick',
      'Mosswick',
      'Briar Marches traveling merchant beside a weathered forest stall, wildflowers and lanterns for trade, warm but cautious expression.',
    ],
  ].map(([key, title, subject]) =>
    shot(
      `portrait-${key}`,
      'portrait',
      'portrait',
      title!,
      `Individual illustrated dialogue portrait, bust to waist, expressive face and hands, atmospheric forest-neutral background. ${subject}`,
      `${artRoot}/portraits/${key}.webp`,
      'hero',
    ),
  ),
  ...[
    ['moss-sprite', 'Moss Sprite', 'Impish moss-covered forest spirit springing from a branch.'],
    ['thorn-patrol', 'Thorn Patrol', 'Two armed sentries of the bramble road, clear combat silhouettes and readable expressions.'],
    ['rootbound-warden', 'Rootbound Warden', 'Ancient guardian of remembered names, roots and brass keys for armor, grave and imposing but capable of mercy.'],
  ].map(([key, title, subject]) =>
    shot(
      `monster-${key}`,
      'monster',
      'landscape',
      title!,
      `Individual combat character illustration in an environment suitable for placing alongside a memory board. ${subject}`,
      `${artRoot}/monsters/${key}.webp`,
      'hero',
    ),
  ),
]

const tileShots = BRIAR_TILES.flatMap((tile): MemoryArtShot[] => {
  const scene = BRIAR_STORY_ATLAS[tile.key]
  if (!scene) throw new Error(`Missing Briar scene: ${tile.key}`)
  const stem = tile.key.replace(',', '-')
  return [
    shot(
      `briar-${stem}`,
      'overworld',
      'landscape',
      scene.title,
      `Single detailed establishing illustration of the location. ${scene.artDirection} No menus or grids.`,
      `${sceneRoot}/sites/${stem}.webp`,
    ),
    ...scene.choices.map((choice) =>
      shot(
        `briar-${stem}-choice-${choice.id}`,
        'overworld-outcome',
        'landscape',
        `${scene.title}: ${choice.label}`,
        `Consequence still frame at ${scene.title}; prior setting: ${scene.artDirection}. Player action: ${choice.label}. Result: ${choice.result}. Show a visible difference from the other outcome.`,
        `${sceneRoot}/outcomes/${stem}-${choice.id}.webp`,
        'variant',
      ),
    ),
  ]
})

const roomShots = Object.values(HOUSE_ROOMS).flatMap(
  (room): MemoryArtShot[] => [
    shot(
      `house-${room.id}`,
      'dungeon',
      'landscape',
      room.title,
      room.artPrompt,
      room.imagePath,
    ),
    ...room.choices.map((choice) =>
      shot(
        `house-${room.id}-choice-${choice.id}`,
        'dungeon-outcome',
        'landscape',
        `${room.title}: ${choice.label}`,
        `${room.artPrompt} Choice: ${choice.label}. Consequence: ${choice.outcome}. Focus on one story moment, not a collage.`,
        `${houseRoot}/outcomes/${room.id.toLowerCase()}-${choice.id}.webp`,
        'variant',
      ),
    ),
  ],
)

const photoShots = BRIAR_EARTH_PHOTOS.map((photo) =>
  shot(
    `earth-photo-${photo.order}`,
    'photograph',
    'landscape',
    photo.title,
    `A candid contemporary Earth photograph, natural ordinary lighting, captured moment not a fantasy painting. ${photo.caption} No superimposed text. Preserve chronological ambiguity.`,
    photo.artPath,
    'hero',
  ),
)

/**
 * Briefs are not jobs. This manifest is a queue-ready deterministic registry;
 * ArtJob IDs and delivery URLs must come from the durable backend, never guessed.
 */
export const WORLD_ONE_ART_SHOTS: readonly MemoryArtShot[] = [
  ...openingShots,
  ...tileShots,
  ...roomShots,
  ...photoShots,
  ...WORLD_ONE_GALLERY.map((card) =>
    shot(
      card.id,
      'match-gallery',
      'card',
      card.title,
      card.prompt,
      card.artPath,
      'hero',
    ),
  ),
]

export function validateWorldOneArtManifest(): string[] {
  const issues: string[] = validateRealmGallery(WORLD_ONE_GALLERY, 1)
  const ids = new Set<string>()
  const paths = new Set<string>()
  for (const shot of WORLD_ONE_ART_SHOTS) {
    if (ids.has(shot.id)) issues.push(`Duplicate art shot: ${shot.id}`)
    if (paths.has(shot.targetPath))
      issues.push(`Duplicate art destination: ${shot.targetPath}`)
    if (!shot.prompt.trim() || !shot.targetPath.startsWith('/images/'))
      issues.push(`Incomplete art brief: ${shot.id}`)
    if (shot.jobId !== null || shot.deliveredUrl !== null || shot.delivery !== 'not-submitted')
      issues.push(`Brief claims unverified delivery: ${shot.id}`)
    ids.add(shot.id)
    paths.add(shot.targetPath)
  }
  for (const tile of BRIAR_TILES) {
    if (!ids.has(`briar-${tile.key.replace(',', '-')}`))
      issues.push(`Missing overworld art: ${tile.key}`)
  }
  for (const room of Object.values(HOUSE_ROOMS)) {
    if (!ids.has(`house-${room.id}`))
      issues.push(`Missing dungeon art: ${room.id}`)
  }
  for (const kind of ['card-back', 'portrait', 'monster', 'backdrop', 'transition', 'photograph'] as const) {
    if (!WORLD_ONE_ART_SHOTS.some((shot) => shot.kind === kind))
      issues.push(`Missing artwork category: ${kind}`)
  }
  return issues
}
