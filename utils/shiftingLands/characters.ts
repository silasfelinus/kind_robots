import type { Skill } from './journey'

// zuzu-shifting-lands/t-052 (Silas, 2026-11-11 PT): "Shifting lands should let
// us design a character and adjust stats ... you can't let the user play the
// siblings and have them encounter the siblings ... obv zuzu should be one of
// the playable characters. As should Jeffery Mittens."
//
// A character is a fixed snapshot taken when a journey starts. It never
// changes during a run, and a V10 save replays against exactly this snapshot.

export const SKILL_ORDER: readonly Skill[] = [
  'steel',
  'awareness',
  'wits',
  'bearing',
  'resolve',
  'insight',
]

// The Book One cast a card can feature. Species is never identity: a custom
// raccoon is not Jeffery Mittens, and the raiders' coyote is not the vagrant.
export const CAST_IDS = [
  'zuzu',
  'jeffery-mittens',
  'fennec-siblings',
  'coyote-vagrant',
  'the-abbess',
] as const
export type CastId = (typeof CAST_IDS)[number]

export const PLAYABLE_IDS = [
  'zuzu',
  'jeffery-mittens',
  'fennec-siblings',
  'custom',
] as const
export type PlayableId = (typeof PLAYABLE_IDS)[number]
export type Pronouns = 'he' | 'she' | 'they'

// Species drawn from the Book One cast list (BOOK-ONE-OUTLINE.md section 3).
// Portraits for custom travelers are queued in the conductor art ledger; until
// one lands, the creator shows the shared road plate in an image-shaped slot.
export const SPECIES = [
  { id: 'koala', label: 'Koala' },
  { id: 'raccoon', label: 'Raccoon' },
  { id: 'fennec', label: 'Fennec fox' },
  { id: 'coyote', label: 'Coyote' },
  { id: 'otter', label: 'Otter' },
  { id: 'rabbit', label: 'Rabbit' },
  { id: 'hare', label: 'Hare' },
  { id: 'jackal', label: 'Jackal' },
  { id: 'badger', label: 'Badger' },
  { id: 'pronghorn', label: 'Pronghorn' },
  { id: 'crow', label: 'Crow' },
] as const
export type SpeciesId = (typeof SPECIES)[number]['id']
export const CUSTOM_PORTRAIT_FALLBACK =
  '/zuzu-gamebook/scenes/shifting-road.webp'
export const speciesPortrait = (species: SpeciesId): string =>
  `/shifting-lands/portraits/${species}.webp`
// Painted species portraits that have actually shipped under public/. Until a
// species is listed here, its travelers show the shared road plate.
export const SHIPPED_SPECIES_PORTRAITS: ReadonlySet<SpeciesId> = new Set()
export const speciesLabel = (species: SpeciesId): string =>
  SPECIES.find((entry) => entry.id === species)?.label ?? species
export const characterPortrait = (
  character: Pick<ShiftingCharacter, 'id' | 'species' | 'portrait'>,
): string =>
  character.id !== 'custom' || SHIPPED_SPECIES_PORTRAITS.has(character.species)
    ? character.portrait
    : CUSTOM_PORTRAIT_FALLBACK

export type ShiftingCharacter = {
  id: PlayableId
  name: string
  species: SpeciesId
  pronouns: Pronouns
  portrait: string
  blurb: string
  skills: Record<Skill, number>
  startProvisions: number
  signatureFlags: string[]
  identity: CastId[]
}

export const POINT_BUY_TOTAL = 13
export const SKILL_MIN = 0
export const SKILL_MAX = 4
export const NAME_MAX = 24
const NAME_PATTERN = /^[A-Za-z][A-Za-z .'-]*$/
const RESERVED_NAMES = /\b(?:zuzu|jeffery|mittens|abbess)\b/i

export const ZUZU: ShiftingCharacter = {
  id: 'zuzu',
  name: 'Zuzu',
  species: 'koala',
  pronouns: 'he',
  portrait: '/zuzu-gamebook/scenes/zuzu-alone.webp',
  blurb:
    'A ronin from a land nobody here knows, keeping an old code on a new frontier.',
  skills: {
    steel: 3,
    awareness: 2,
    wits: 2,
    bearing: 2,
    resolve: 2,
    insight: 2,
  },
  startProvisions: 2,
  signatureFlags: [],
  identity: ['zuzu'],
}

export const JEFFERY_MITTENS: ShiftingCharacter = {
  id: 'jeffery-mittens',
  name: 'Jeffery Mittens',
  species: 'raccoon',
  pronouns: 'he',
  portrait: '/zuzu-gamebook/scenes/looter.webp',
  blurb:
    'A young raccoon of Hollow Bell, quartermaster to the barefoot, who knows every gap in the rocks.',
  skills: {
    steel: 1,
    awareness: 3,
    wits: 3,
    bearing: 1,
    resolve: 2,
    insight: 3,
  },
  startProvisions: 3,
  signatureFlags: ['deed-knows-old-roads'],
  identity: ['jeffery-mittens'],
}

export const FENNEC_SIBLINGS: ShiftingCharacter = {
  id: 'fennec-siblings',
  name: 'The fennec siblings',
  species: 'fennec',
  pronouns: 'she',
  portrait: '/zuzu-gamebook/scenes/siblings.webp',
  blurb:
    'A fierce fennec girl with her little brother in tow. She feeds him first, every time.',
  skills: {
    steel: 2,
    awareness: 3,
    wits: 2,
    bearing: 1,
    resolve: 3,
    insight: 2,
  },
  startProvisions: 2,
  signatureFlags: ['deed-shared-bread'],
  identity: ['fennec-siblings'],
}

export const PREMADE_CHARACTERS: readonly ShiftingCharacter[] = [
  ZUZU,
  JEFFERY_MITTENS,
  FENNEC_SIBLINGS,
]

export type CustomCharacterInput = {
  name: string
  species: SpeciesId
  pronouns: Pronouns
  skills: Record<Skill, number>
}

export const skillTotal = (skills: Record<Skill, number>): number =>
  SKILL_ORDER.reduce((sum, skill) => sum + (skills[skill] ?? 0), 0)

// Readable problems with a custom traveler; empty when it can start a journey.
export function customCharacterProblems(input: CustomCharacterInput): string[] {
  const problems: string[] = []
  const name = typeof input?.name === 'string' ? input.name.trim() : ''
  if (!name) problems.push('Give your traveler a name.')
  else if (name.length > NAME_MAX)
    problems.push(`Names are at most ${NAME_MAX} characters.`)
  else if (!NAME_PATTERN.test(name))
    problems.push('Use letters, spaces, apostrophes, periods or hyphens.')
  else if (RESERVED_NAMES.test(name))
    problems.push('That name belongs to someone already on the road.')
  if (!SPECIES.some((entry) => entry.id === input?.species))
    problems.push('Choose a species.')
  if (!['he', 'she', 'they'].includes(input?.pronouns))
    problems.push('Choose pronouns.')
  const skills = input?.skills
  if (
    !skills ||
    typeof skills !== 'object' ||
    Object.keys(skills).length !== SKILL_ORDER.length ||
    SKILL_ORDER.some(
      (skill) =>
        !Number.isInteger(skills[skill]) ||
        skills[skill] < SKILL_MIN ||
        skills[skill] > SKILL_MAX,
    )
  )
    problems.push(
      `Each skill is a whole number from ${SKILL_MIN} to ${SKILL_MAX}.`,
    )
  else if (skillTotal(skills) !== POINT_BUY_TOTAL)
    problems.push(
      `Spend exactly ${POINT_BUY_TOTAL} skill points (${skillTotal(skills)} spent).`,
    )
  return problems
}

export function makeCustomCharacter(
  input: CustomCharacterInput,
): ShiftingCharacter | null {
  if (customCharacterProblems(input).length) return null
  const species = SPECIES.find((entry) => entry.id === input.species)!
  return {
    id: 'custom',
    name: input.name.trim(),
    species: species.id,
    pronouns: input.pronouns,
    portrait: speciesPortrait(species.id),
    blurb: `A ${species.label.toLowerCase()} traveler of your own making.`,
    skills: Object.fromEntries(
      SKILL_ORDER.map((skill) => [skill, input.skills[skill]]),
    ) as Record<Skill, number>,
    startProvisions: 2,
    signatureFlags: [],
    identity: [],
  }
}

// The fields that change play. Portrait and blurb are presentation, so a new
// painted portrait or reworded blurb never turns an existing save away.
const RULE_FIELDS = [
  'id',
  'name',
  'species',
  'pronouns',
  'skills',
  'startProvisions',
  'signatureFlags',
  'identity',
] as const
const canonical = (character: ShiftingCharacter) =>
  JSON.stringify(
    RULE_FIELDS.map((key) =>
      key === 'skills'
        ? SKILL_ORDER.map((skill) => character.skills?.[skill])
        : character[key],
    ),
  )

// Accepts a saved snapshot only when its rules are exactly a premade's, or
// exactly what makeCustomCharacter builds from its own fields, and returns the
// current roster entry. Anything else (raised stats, extra provisions, a
// borrowed identity or signature deed, a stray extra field) is refused.
export function characterFromSnapshot(
  value: unknown,
): ShiftingCharacter | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const saved = value as ShiftingCharacter
  try {
    const expected =
      saved.id === 'custom'
        ? makeCustomCharacter({
            name: saved.name,
            species: saved.species,
            pronouns: saved.pronouns,
            skills: saved.skills,
          })
        : (PREMADE_CHARACTERS.find((entry) => entry.id === saved.id) ?? null)
    if (
      !expected ||
      saved.name !== expected.name ||
      Object.keys(saved).some((key) => !Object.hasOwn(expected, key)) ||
      Object.keys(saved.skills ?? {}).length !== SKILL_ORDER.length
    )
      return null
    return canonical(saved) === canonical(expected)
      ? (JSON.parse(JSON.stringify(expected)) as ShiftingCharacter)
      : null
  } catch {
    return null
  }
}
