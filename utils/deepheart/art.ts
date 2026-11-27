import type { KitArt } from '../playbookKit/types'
import { ANTHRO_ROMANCE_ACTION } from './anthro'
import { ENEMIES } from './dungeon'
import { DEEPHEART_ART_IDS, deepheartArtSrc } from './renderedArt'
import { CHARACTERS, ROLES, character } from './roster'
import type { Character, EventDef, RoomKind } from './types'

// Every Deepheart picture as a brief plus a literal render prompt for the
// kit's engine. Rendered art lands under /images/deepheart/ and is wired in
// by setting `src` once its URL is verified (conductor deepheart art ledger).

export const DH_PALETTE =
  'Modern 2D Western fantasy action cartoon, bold hand-inked outlines, lively expressive adult faces and animal anatomy, clean cel-painted shadows, saturated jewel tones in torch amber, slate blue and crimson, an ominous violent dungeon world.'

export function portraitArt(c: Character): KitArt {
  return {
    brief: `Character portrait of ${c.name}, ${ROLES[c.role].label.toLowerCase()}: ${c.blurb}`,
    prompt: `${c.look} Waist-up portrait in a torchlit stone dungeon corridor, warm torchlight from the left and cool blue shadow on the right, camera at eye level. ${DH_PALETTE}`,
    alt: `${c.name}, ${ROLES[c.role].label}`,
    src: deepheartArtSrc(`cast:${c.id}`),
    focus: 'center 25%',
  }
}

export function romanceArt(c: Character): KitArt {
  return {
    brief: `Romance plate: ${c.name} at the campfire. ${c.heart}`,
    prompt: `${c.look} ${c.id === 'brannoc' ? character('thessaly').look : ''} ${ANTHRO_ROMANCE_ACTION[c.id === 'brannoc' ? 'hearth' : c.id] ?? 'They exchange a keepsake with another adventurer.'} Another anthropomorphic delver in a travel-worn cloak shares the fire in a vaulted stone chamber. Medium shot at seated height. ${DH_PALETTE}`,
    alt: `${c.name} at the campfire`,
    src: deepheartArtSrc(
      `moment:romance-${c.id === 'brannoc' || c.id === 'thessaly' ? 'hearth' : c.id}`,
    ),
  }
}

export const ROOM_ART: Record<RoomKind, KitArt> = {
  fight: {
    src: deepheartArtSrc('room:fight'),
    brief: 'A dungeon corridor full of monsters, weapons drawn',
    prompt: `A narrow torchlit stone corridor where a skeleton footman, a goblin with two knives and a green slime advance toward the viewer, rusted weapons raised, bones scattered on the wet flagstones. Low camera at floor level. ${DH_PALETTE}`,
  },
  puzzle: {
    src: deepheartArtSrc('room:puzzle'),
    brief: 'A sealed rune door with a carved puzzle',
    prompt: `A tall sealed stone door carved with a grid of nine glowing runes and a ring of riddling inscriptions, two brass scales hanging from chains on either side, candlelight on the carvings. Straight-on view at eye level. ${DH_PALETTE}`,
  },
  treasure: {
    src: deepheartArtSrc('room:treasure'),
    brief: 'An iron-bound treasure chest in a vault',
    prompt: `An old iron-bound wooden treasure chest sitting on a stone plinth in a small vaulted chamber, its lid cracked open with gold light spilling out, coins scattered on the steps. Medium shot from slightly above. ${DH_PALETTE}`,
  },
  choice: {
    src: deepheartArtSrc('room:choice'),
    brief: 'A fork in the dungeon with a strange encounter',
    prompt: `A dungeon crossroads where three stone archways open onto different coloured lights, a hooded figure waiting under the middle arch holding out a glowing object, torches on the walls. Wide shot at eye level. ${DH_PALETTE}`,
  },
  camp: {
    src: deepheartArtSrc('room:camp'),
    brief: 'A campfire in a safe dungeon alcove',
    prompt: `A small campfire burning in a quiet vaulted alcove of a dungeon, bedrolls laid on the flagstones, a cooking pot hanging over the flames, packs and lanterns stacked against the wall. Medium shot at seated height. ${DH_PALETTE}`,
  },
  boss: {
    src: deepheartArtSrc('room:boss'),
    brief: 'The boss chamber at the bottom of a layer',
    prompt: `A vast round stone chamber with a raised dais at the far end, a huge dark figure rising from a throne in a ring of torches, the floor cracked and glowing. Wide shot from the chamber entrance. ${DH_PALETTE}`,
  },
}

const BOSS_ART_KEYS: Readonly<Record<string, string>> = {
  warden: 'cast:bone-warden',
  brine: 'cast:mother-brine',
  king: 'cast:hollow-king',
  mimic: 'moment:mimic',
}

export function enemyArt(id: string): KitArt | undefined {
  const enemy = ENEMIES[id]
  const key = BOSS_ART_KEYS[id] ?? `enemy:${id}`
  const src = deepheartArtSrc(key)
  if (!enemy || !src) return undefined
  return {
    src,
    alt: enemy.name,
    brief: enemy.look,
    prompt: enemy.look,
  }
}

export function bossBattleArt(id: string): KitArt | undefined {
  const enemy = ENEMIES[id]
  const src = deepheartArtSrc(`boss-plate:${id}`)
  if (!enemy || !src) return undefined
  return {
    src,
    alt: `${enemy.name} in its chamber`,
    brief: `${enemy.name} in its chamber`,
    prompt: enemy.look,
  }
}

export function encounterArt(event: EventDef): KitArt | undefined {
  const src =
    deepheartArtSrc(`encounter:${event.id}`) ??
    (event.moment ? deepheartArtSrc(`moment:${event.moment}`) : undefined)
  if (!src) return undefined
  return {
    src,
    alt: event.title,
    brief: event.title,
    prompt: event.text,
  }
}

export const ART_BASE = '/images/deepheart'

/** The rendered picture for a portrait, once delivered; null keeps the drawn fallback. */
export function portraitSrc(
  id: string,
  rendered: ReadonlySet<string>,
): string | null {
  const key = `portraits/${id}`
  return rendered.has(key) ? (deepheartArtSrc(`cast:${id}`) ?? null) : null
}

export const RENDERED_ART: ReadonlySet<string> = new Set(
  Object.keys(DEEPHEART_ART_IDS)
    .filter((key) => key.startsWith('cast:'))
    .map((key) => `portraits/${key.slice(5)}`),
)

export function roleColor(id: string): string {
  const archetype = ROLES[character(id).role].archetype
  return {
    tank: 'var(--color-info)',
    healer: 'var(--color-accent)',
    striker: 'var(--color-primary)',
    caster: 'var(--color-secondary)',
    support: 'var(--color-warning)',
  }[archetype]
}

export function initials(name: string): string {
  return name
    .replace(/^(Sir|Brother|Mother|Old|Archmage|Dr\.|The) /, '')
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
}

export const ALL_PORTRAITS = CHARACTERS.map(portraitArt)
