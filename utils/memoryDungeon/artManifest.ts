import { BRIAR_EARTH_PHOTOS } from './chronicle'
import { WORLD_ONE_GALLERY, validateRealmGallery } from './realmGallery'
import { HOUSE_ROOMS } from './house'
import { COMBAT_ROOMS } from './rooms'
import {
  BRIAR_STYLE,
  HOUSE_STYLE,
  RESEARCHER,
  TRAVELER,
  VISIBLE_ACTIONS,
  consequencePrompt,
} from './artPromptParts'
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

// Every brief is a complete literal prompt: authored place, room, photo and
// enemy prompts are used as written, and the openings below name only what
// is visible. Shared pieces live in ./artPromptParts.
function shot(
  id: string,
  kind: MemoryArtKind,
  format: MemoryArtFormat,
  title: string,
  prompt: string,
  targetPath: string,
  priority: MemoryArtShot['priority'] = 'scene',
): MemoryArtShot {
  return {
    id,
    kind,
    format,
    title,
    prompt,
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
    `An open-plan office at twilight with rows of empty desks under fluorescent ceiling lights. ${RESEARCHER} sits alone at a desk with two monitors of spreadsheets, a coffee mug with a brown ring stain and a stack of tidy folders. In the dark window glass behind them, their reflection has long pointed ears and short silver hair. Cold fluorescent light, deep blue dusk outside. Wide shot at eye level. ${BRIAR_STYLE}`,
    `${artRoot}/cinematics/earth-office.webp`,
    'hero',
  ),
  shot(
    'intro-exchange',
    'cinematic',
    'landscape',
    'The Changeling Trade',
    `A tall pane of glass divides a fluorescent-lit office on the left from a moonlit forest of ferns on the right. On the office side, ${RESEARCHER} presses one palm flat to the glass. On the forest side, ${TRAVELER} presses one palm to the same spot, and the two stare at each other with wide eyes. White office light on the left, blue moonlight on the right. Medium shot. ${BRIAR_STYLE}`,
    `${artRoot}/cinematics/changeling-trade.webp`,
    'hero',
  ),
  shot(
    'intro-arrival',
    'cinematic',
    'landscape',
    'Briar Arrival',
    `A mossy forest path of old flat stones crossed by curling roots leads toward a small campfire beside a patched canvas tent. Far beyond the treetops, a dark manor grown from roots stands on a hill with three lit windows. Two hands in dark green cloak sleeves reach into the lower edge of the view. Dusk light and warm firelight. Wide first-person view at eye level. ${BRIAR_STYLE}`,
    `${artRoot}/cinematics/briar-arrival.webp`,
    'hero',
  ),
  shot(
    'map-dawn',
    'backdrop',
    'landscape',
    'Briar Marches',
    `Straight-down aerial view of a forest valley at dawn: winding dirt trails between oak woods, a creek along the southern edge, a river with a plank bridge through the eastern third, a small camp with a tent in the west, a compact village of thatched cottages, crumbling grey stone ruins, a gate of woven thorns at the eastern edge and a dark manor grown from roots in the northeast corner. Soft pink dawn light. ${BRIAR_STYLE}`,
    `${artRoot}/backdrops/briar-overworld.webp`,
    'hero',
  ),
  shot(
    'house-interior',
    'backdrop',
    'landscape',
    'House That Remembers',
    `A manor hall grown from oak roots, with three wooden staircases bending at odd angles toward upper landings, tall brass mirrors along the walls, carved root pillars and open doorways leading deeper inside. Candles burn in brass wall sconces. Wide shot at eye level. ${HOUSE_STYLE}`,
    `${artRoot}/backdrops/house-interior.webp`,
    'hero',
  ),
  shot(
    'secret-vault',
    'backdrop',
    'landscape',
    'Secret Memory Vault',
    `A hidden archive behind twisting root walls: wooden shelves of glowing glass jars and bound ledgers lit by candles, a carved stone doorway marked with two interlocked leaf shapes, and a small brass-bound chest on the flagstones below the shelves. Warm candlelight. Medium-wide shot. ${HOUSE_STYLE}`,
    `${artRoot}/backdrops/secret-vault.webp`,
    'hero',
  ),
  shot(
    'combat-stage',
    'backdrop',
    'landscape',
    'Memory Duel',
    `A round forest clearing ringed by tall oaks and bramble walls, its flat mossy ground bare and evenly lit in the middle. On the far side, two dark shapes move between the tree trunks. Lanterns hang from low branches. Dusk light. Wide shot from a high angle. ${BRIAR_STYLE}`,
    `${artRoot}/backdrops/combat.webp`,
    'hero',
  ),
  shot(
    'briar-unveil',
    'transition',
    'landscape',
    'First Realm Unveiled',
    `A dark forest at night with fog lifting in patches, uncovering pairs of lantern-lit clearings joined by pale dirt paths: a campfire beside a tent, a mossy plank bridge, a merchant stall and a gate of woven thorns. Moonlight from above, warm lanterns below. Wide high-angle shot. ${BRIAR_STYLE}`,
    `${artRoot}/transitions/briar-unveil.webp`,
    'hero',
  ),
  shot(
    'next-world-unveil',
    'transition',
    'landscape',
    'Beyond the Thorn Gate',
    `A gate of woven thorns stands open on a forest road at dusk. Through the gap, a valley village of stone cottages with glowing bread ovens and chimney smoke stretches toward low hills. Warm orange oven light ahead, blue dusk behind. Wide shot from behind the gate. ${BRIAR_STYLE}`,
    `${artRoot}/transitions/second-realm.webp`,
    'hero',
  ),
  shot(
    'card-back-briar',
    'card-back',
    'card',
    'Briar Crest',
    'A flat upright panel of dark evergreen lacquer covered edge to edge with symmetric antique gold filigree of thorn stems and oak leaves around a central coiled knot, mirrored top to bottom. Straight-on view under even soft light. Hand-painted gouache and ink illustration in dark evergreen and antique gold.',
    `${artRoot}/card-backs/briar-default.webp`,
    'hero',
  ),
  shot(
    'card-back-arcane',
    'card-back',
    'card',
    'Moonlit Cipher',
    'A flat upright panel of ink-black lacquer covered edge to edge with silver bramble filigree around two interlocked round seals, mirrored top to bottom, lit by pale moonlight. Straight-on view. Hand-painted gouache and ink illustration in ink black and moonlight silver.',
    `${artRoot}/card-backs/briar-arcane.webp`,
    'hero',
  ),
  ...[
    [
      'scylla',
      'Princess Scylla',
      'Scylla, a stout broad-shouldered adult woman with light brown skin, a chestnut braid and a small polished silver crown, in a tailored navy travel coat with brass buttons, stands upright with her hands folded and her chin raised in a sunlit forest clearing.',
    ],
    [
      'char',
      'Princess Charybdis',
      'Char, a stout broad-shouldered adult woman with deep brown skin, black hair in a high braid, layered black velvet and lace, silver rings and chains, black lipstick and dark eye makeup, grins with one hand on her hip in a sunlit forest clearing.',
    ],
    [
      'oren',
      'Master Oren Pike',
      'Oren, a very tall broad man in a rough brown cloth executioner hood with two eyeholes and a leather apron of pouches, holds a long ledger in one hand and rests a ceremonial axe on his shoulder beside a neatly packed supply cart.',
    ],
    [
      'morrow',
      'Morrow',
      `Morrow, ${TRAVELER}, stands at the edge of a forest at dusk turning a smartphone with a cracked screen over in both hands, brows raised.`,
    ],
    [
      'mosswick',
      'Mosswick',
      'Mosswick, a stooped old man with a long grey braided beard and a patched moss-green coat, leans on a wooden forest stall crowded with brass lanterns and bunches of wildflowers, eyes narrowed in a guarded smile.',
    ],
  ].map(([key, title, subject]) =>
    shot(
      `portrait-${key}`,
      'portrait',
      'portrait',
      title!,
      `${subject} Warm afternoon light. Waist-up view, medium close-up. ${BRIAR_STYLE}`,
      `${artRoot}/portraits/${key}.webp`,
      'hero',
    ),
  ),
  ...(
    [
      ['moss-sprite', 'sprite'],
      ['thorn-patrol', 'patrol'],
      ['rootbound-warden', 'vault-2'],
    ] as const
  ).map(([key, room]) =>
    shot(
      `monster-${key}`,
      'monster',
      'landscape',
      COMBAT_ROOMS[room].enemy.name,
      COMBAT_ROOMS[room].artPrompt,
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
      scene.artDirection,
      `${sceneRoot}/sites/${stem}.webp`,
    ),
    ...scene.choices.map((choice) =>
      shot(
        `briar-${stem}-choice-${choice.id}`,
        'overworld-outcome',
        'landscape',
        `${scene.title}: ${choice.label}`,
        consequencePrompt(
          scene.artDirection,
          VISIBLE_ACTIONS[`briar-${stem}-${choice.id}`] ?? choice.label,
          BRIAR_STYLE,
        ),
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
        choice.artPrompt ??
          consequencePrompt(
            room.artPrompt,
            VISIBLE_ACTIONS[`house-${room.id}-${choice.id}`] ?? choice.label,
            HOUSE_STYLE,
          ),
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
    photo.artPrompt,
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

/** Select only an authored Briar scene or its recorded choice outcome. */
export function briarIllustrationPath(
  key: string,
  choiceId?: string | null,
): string | null {
  const scene = BRIAR_STORY_ATLAS[key]
  if (!scene) return null
  const stem = key.replace(',', '-')
  if (choiceId && scene.choices.some((choice) => choice.id === choiceId))
    return `${sceneRoot}/outcomes/${stem}-${choiceId}.webp`
  return `${sceneRoot}/sites/${stem}.webp`
}

/** Select only an authored House room or its recorded choice consequence. */
export function houseIllustrationPath(
  roomId: string,
  choiceId?: string | null,
): string | null {
  const room = HOUSE_ROOMS[roomId]
  if (!room) return null
  if (choiceId && room.choices.some((choice) => choice.id === choiceId))
    return `${houseRoot}/outcomes/${room.id.toLowerCase()}-${choiceId}.webp`
  return room.imagePath
}

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
    if (
      shot.jobId !== null ||
      shot.deliveredUrl !== null ||
      shot.delivery !== 'not-submitted'
    )
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
  for (const kind of [
    'card-back',
    'portrait',
    'monster',
    'backdrop',
    'transition',
    'photograph',
  ] as const) {
    if (!WORLD_ONE_ART_SHOTS.some((shot) => shot.kind === kind))
      issues.push(`Missing artwork category: ${kind}`)
  }
  return issues
}
