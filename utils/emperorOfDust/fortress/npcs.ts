import type { Mood } from './castArt'
import type { Effects, KingdomFactionId, LocalFactionId } from './types'

// Major NPCs from conductor NPCS-V03.md. They get illustrated moods only, no
// portraits. No two named characters, NPC or follower, share a species.
export type NpcDef = {
  slug: string
  name: string
  species: string
  pronouns: string
  faction?: KingdomFactionId | LocalFactionId
}

export const NPCS: readonly NpcDef[] = [
  {
    slug: 'young-komodo',
    name: 'Young Komodo',
    species: 'Komodo dragon',
    pronouns: 'he/him',
  },
  {
    slug: 'mara-reedbell',
    name: 'Mara Reedbell',
    species: 'Mule',
    pronouns: 'she/her',
    faction: 'hollow-bell',
  },
  {
    slug: 'the-abbess',
    name: 'The Abbess',
    species: 'Otter',
    pronouns: 'she/her',
    faction: 'abbey',
  },
  {
    slug: 'sister-marrow',
    name: 'Sister Marrow',
    species: 'Goat',
    pronouns: 'she/her',
    faction: 'abbey',
  },
  {
    slug: 'sister-reedlight',
    name: 'Sister Reedlight',
    species: 'Heron',
    pronouns: 'she/her',
    faction: 'mire-mothers',
  },
  {
    slug: 'gristle-vane',
    name: 'Captain Gristle Vane',
    species: 'Hyena',
    pronouns: 'he/him',
    faction: 'jackalwire',
  },
  {
    slug: 'oriel-saltmarsh',
    name: 'Oriel Saltmarsh',
    species: 'Pelican',
    pronouns: 'she/her',
    faction: 'saltroad',
  },
  {
    slug: 'ferro-dunmark',
    name: 'Captain Ferro Dunmark',
    species: 'Wolf',
    pronouns: 'he/him',
    faction: 'gate-watch',
  },
  {
    slug: 'ottoline-vask',
    name: 'Lady Ottoline Vask',
    species: 'Black swan',
    pronouns: 'she/her',
    faction: 'old-houses',
  },
  {
    slug: 'marisol-tallow',
    name: 'Factor Marisol Tallow',
    species: 'Raccoon',
    pronouns: 'she/her',
    faction: 'ledger',
  },
  {
    slug: 'dunmore-ash',
    name: 'Foreman Dunmore Ash',
    species: 'Boar',
    pronouns: 'he/him',
    faction: 'yard',
  },
  {
    slug: 'storm-crow-envoy',
    name: 'A Storm Crow envoy',
    species: 'Crow',
    pronouns: 'he/him',
    faction: 'storm-crows',
  },
  {
    slug: 'elder-corvane',
    name: 'Elder Corvane',
    species: 'Crow',
    pronouns: 'he/him',
    faction: 'storm-crows',
  },
  {
    slug: 'granny-umber',
    name: 'Granny Umber',
    species: 'Mole',
    pronouns: 'she/her',
    faction: 'moles',
  },
  {
    slug: 'hester-plowright',
    name: 'Hester Plowright',
    species: 'Hen',
    pronouns: 'she/her',
    faction: 'freeholds',
  },
  {
    // A magpie beside Elder Corvane's crow: the same family, kept on
    // purpose because the Rustline are canonically magpie salvagers, and the
    // two designs share nothing (pied and glittering against grey and old).
    slug: 'jinx-coupler',
    name: 'Jinx Coupler',
    species: 'Magpie',
    pronouns: 'they/them',
    faction: 'rustline',
  },
  {
    slug: 'abelard-vellum',
    name: 'Keeper Abelard Vellum',
    species: 'Sloth',
    pronouns: 'he/him',
    faction: 'lamplight',
  },
  {
    slug: 'the-verge-envoy',
    name: 'The Envoy of the Black Verge',
    species: 'Gorilla',
    pronouns: 'they/them',
    faction: 'black-verge',
  },
]

export const npcDef = (slug: string): NpcDef | undefined =>
  NPCS.find((entry) => entry.slug === slug)

/**
 * How a major NPC looks after the throne answers them: their faction's change
 * in support (kingdom affinity or local standing) from the chosen option.
 */
export const reactionMood = (
  effects: Effects,
  faction?: KingdomFactionId | LocalFactionId,
): Mood => {
  if (!faction) return 'neutral'
  const change =
    (effects.affinity?.[faction as KingdomFactionId] ?? 0) +
    (effects.local?.[faction as LocalFactionId] ?? 0)
  if (change >= 10) return 'excited'
  if (change > 0) return 'happy'
  if (change <= -10) return 'angry'
  if (change < 0) return 'sad'
  return 'neutral'
}
