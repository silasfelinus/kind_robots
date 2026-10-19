import type { KingdomFactionId, LocalFactionId } from './types'

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
    slug: 'the-verge-envoy',
    name: 'The Envoy of the Black Verge',
    species: 'Gorilla',
    pronouns: 'they/them',
    faction: 'black-verge',
  },
]

export const npcDef = (slug: string): NpcDef | undefined =>
  NPCS.find((entry) => entry.slug === slug)
