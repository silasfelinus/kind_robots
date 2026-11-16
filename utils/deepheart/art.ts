import type { KitArt } from '../playbookKit/types'
import { CHARACTERS, ROLES, character } from './roster'
import type { Character, RoomKind } from './types'

// Every Deepheart picture as a brief plus a literal render prompt for the
// kit's engine. Rendered art lands under /images/deepheart/ and is wired in
// by setting `src` once its URL is verified (conductor deepheart art ledger).

export const DH_PALETTE =
  'Painted dark-fantasy storybook illustration in torch amber, slate blue and deep crimson.'

export function portraitArt(c: Character): KitArt {
  return {
    brief: `Character portrait of ${c.name}, ${c.ancestry} ${ROLES[c.role].label.toLowerCase()}: ${c.blurb}`,
    prompt: `${c.look}. Waist-up portrait in a torchlit stone dungeon corridor, warm torchlight from the left and cool blue shadow on the right, camera at eye level. ${DH_PALETTE}`,
    alt: `${c.name}, ${c.ancestry} ${ROLES[c.role].label}`,
    focus: 'center 25%',
  }
}

export function romanceArt(c: Character): KitArt {
  return {
    brief: `Romance plate: ${c.name} at the campfire. ${c.heart}`,
    prompt: `${c.look}. ${c.scene} A hooded delver in a travel-worn green cloak sits close beside them. A small campfire burns on the flagstones of a vaulted dungeon chamber. Medium shot at seated height. ${DH_PALETTE}`,
    alt: `${c.name} at the campfire`,
  }
}

export const ROOM_ART: Record<RoomKind, KitArt> = {
  fight: {
    brief: 'A dungeon corridor full of monsters, weapons drawn',
    prompt: `A narrow torchlit stone corridor where a skeleton footman, a goblin with two knives and a green slime advance toward the viewer, rusted weapons raised, bones scattered on the wet flagstones. Low camera at floor level. ${DH_PALETTE}`,
  },
  puzzle: {
    brief: 'A sealed rune door with a carved puzzle',
    prompt: `A tall sealed stone door carved with a grid of nine glowing runes and a ring of riddling inscriptions, two brass scales hanging from chains on either side, candlelight on the carvings. Straight-on view at eye level. ${DH_PALETTE}`,
  },
  treasure: {
    brief: 'An iron-bound treasure chest in a vault',
    prompt: `An old iron-bound wooden treasure chest sitting on a stone plinth in a small vaulted chamber, its lid cracked open with gold light spilling out, coins scattered on the steps. Medium shot from slightly above. ${DH_PALETTE}`,
  },
  choice: {
    brief: 'A fork in the dungeon with a strange encounter',
    prompt: `A dungeon crossroads where three stone archways open onto different coloured lights, a hooded figure waiting under the middle arch holding out a glowing object, torches on the walls. Wide shot at eye level. ${DH_PALETTE}`,
  },
  camp: {
    brief: 'A campfire in a safe dungeon alcove',
    prompt: `A small campfire burning in a quiet vaulted alcove of a dungeon, bedrolls laid on the flagstones, a cooking pot hanging over the flames, packs and lanterns stacked against the wall. Medium shot at seated height. ${DH_PALETTE}`,
  },
  boss: {
    brief: 'The boss chamber at the bottom of a layer',
    prompt: `A vast round stone chamber with a raised dais at the far end, a huge dark figure rising from a throne in a ring of torches, the floor cracked and glowing. Wide shot from the chamber entrance. ${DH_PALETTE}`,
  },
}

export const ART_BASE = '/images/deepheart'

/** The rendered picture for a portrait, once delivered; null keeps the drawn fallback. */
export function portraitSrc(
  id: string,
  rendered: ReadonlySet<string>,
): string | null {
  const key = `portraits/${id}`
  return rendered.has(key) ? `${ART_BASE}/${key}.webp` : null
}

export const RENDERED_ART: ReadonlySet<string> = new Set<string>()

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
