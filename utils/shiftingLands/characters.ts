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
  'mags',
  'hollis',
  'sister-wren',
  'brother-peddler',
  'old-ash',
  'hester-kell',
  'gideon-vane',
  'tamsin',
  'augustin',
] as const
export type CastId = (typeof CAST_IDS)[number]

export const PLAYABLE_IDS = [
  'zuzu',
  'jeffery-mittens',
  'fennec-siblings',
  'coyote',
  'mags',
  'hollis',
  'sister-wren',
  'brother-peddler',
  'old-ash',
  'hester-kell',
  'gideon-vane',
  'tamsin',
  'augustin',
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
  { id: 'bighorn', label: 'Bighorn sheep' },
  { id: 'gorilla', label: 'Gorilla' },
] as const
export type SpeciesId = (typeof SPECIES)[number]['id']
export const CUSTOM_PORTRAIT_FALLBACK =
  '/zuzu-gamebook/scenes/shifting-road.webp'
export const speciesPortrait = (species: SpeciesId): string =>
  `/shifting-lands/portraits/${species}.webp`
// Painted species portraits that have actually shipped under public/. Until a
// species is listed here, its travelers show the shared road plate.
export const SHIPPED_SPECIES_PORTRAITS: ReadonlySet<SpeciesId> = new Set([
  'koala',
  'raccoon',
  'fennec',
  'coyote',
  'otter',
  'rabbit',
  'hare',
  'jackal',
  'badger',
  'pronghorn',
  'crow',
])
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
  portrait: '/shifting-lands/portraits/jeffery-mittens.webp',
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

// t-053 (Silas, 2026-11-12 PT): the siblings take their series-bible names,
// Ling and her toddler brother Bao. The id and every code keyed on it stay
// 'fennec-siblings', and a save written under the old display name still
// loads (FORMER_NAMES below).
export const FENNEC_SIBLINGS: ShiftingCharacter = {
  id: 'fennec-siblings',
  name: 'Ling and Bao',
  species: 'fennec',
  pronouns: 'she',
  portrait: '/shifting-lands/portraits/fennec-siblings.webp',
  blurb:
    'Ling, about ten, fierce and watchful, with her toddler brother Bao on her hip. She feeds him first, every time.',
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

// t-053 expansion (Silas, 2026-11-13 PT: "Expand to 13 premades"): ten more
// travelers from the Book One cast and the world guide's factions, each with
// its own road (personalDeckV10.ts, personalEndings.ts). Every premade spends
// the same 13 skill points as a custom traveler. Hester Kell and Augustin are
// provisional names, as Book One's outline marks its own.
const premade = (
  character: Omit<ShiftingCharacter, 'identity'> & { identity?: CastId[] },
): ShiftingCharacter => ({
  ...character,
  identity: character.identity ?? [character.id as CastId],
})

export const THE_COYOTE = premade({
  id: 'coyote',
  name: 'The Coyote',
  species: 'coyote',
  pronouns: 'he',
  portrait: '/zuzu-gamebook/scenes/coyote.webp',
  blurb:
    'A one-eyed drifter with an empty holster and a price on his head in Dustwater. He owes somebody something, and he has not decided who.',
  skills: {
    steel: 3,
    awareness: 3,
    wits: 2,
    bearing: 1,
    resolve: 2,
    insight: 2,
  },
  startProvisions: 1,
  signatureFlags: ['deed-marked-by-wardens'],
  identity: ['coyote-vagrant'],
})

export const MAGS = premade({
  id: 'mags',
  name: 'Mags',
  species: 'rabbit',
  pronouns: 'she',
  portrait: '/zuzu-gamebook/scenes/mags-bar.webp',
  blurb:
    "Dustwater's barkeep, scattergun under the counter, who lost her son to the mission road. She trades the truth for kindness and nothing else.",
  skills: {
    steel: 3,
    awareness: 2,
    wits: 2,
    bearing: 3,
    resolve: 2,
    insight: 1,
  },
  startProvisions: 3,
  signatureFlags: ['deed-told-truth'],
})

export const HOLLIS = premade({
  id: 'hollis',
  name: 'Hollis',
  species: 'jackal',
  pronouns: 'she',
  portrait: '/zuzu-gamebook/scenes/sections/a7-hollis-band.webp',
  blurb:
    'Leader of a starving raider band at the dry well, with her kits hidden in the rocks. Hungry, not wicked, and she will tell you so.',
  skills: {
    steel: 3,
    awareness: 3,
    wits: 2,
    bearing: 2,
    resolve: 2,
    insight: 1,
  },
  startProvisions: 1,
  signatureFlags: ['deed-owed-favor'],
})

export const SISTER_WREN = premade({
  id: 'sister-wren',
  name: 'Sister Wren',
  species: 'otter',
  pronouns: 'she',
  portrait: '/zuzu-gamebook/scenes/wren.webp',
  blurb:
    "A young novice who walked out of the Abbess's convent the night she stopped pretending not to know. She still carries the infirmary keys.",
  skills: {
    steel: 0,
    awareness: 3,
    wits: 2,
    bearing: 2,
    resolve: 2,
    insight: 4,
  },
  startProvisions: 2,
  signatureFlags: ['deed-carries-medicine'],
})

export const BROTHER_PEDDLER = premade({
  id: 'brother-peddler',
  name: 'Brother Peddler',
  species: 'hare',
  pronouns: 'he',
  portrait: '/zuzu-gamebook/scenes/peddler.webp',
  blurb:
    'He sells blessed water to desperate families from the back of a cart. Con man or the last kindness left on the road? Some days, both.',
  skills: {
    steel: 1,
    awareness: 2,
    wits: 4,
    bearing: 3,
    resolve: 1,
    insight: 2,
  },
  startProvisions: 2,
  signatureFlags: ['deed-owed-favor'],
})

export const OLD_ASH = premade({
  id: 'old-ash',
  name: 'Old Ash',
  species: 'crow',
  pronouns: 'she',
  portrait: '/zuzu-gamebook/scenes/crow-witch.webp',
  blurb:
    'A Storm Crow witch a long way from her cave, who sells sight at crossroads and never says what it costs until after.',
  skills: {
    steel: 1,
    awareness: 2,
    wits: 2,
    bearing: 2,
    resolve: 2,
    insight: 4,
  },
  startProvisions: 1,
  signatureFlags: ['deed-knows-old-roads'],
})

export const HESTER_KELL = premade({
  id: 'hester-kell',
  name: 'Hester Kell',
  species: 'badger',
  pronouns: 'she',
  portrait: '/zuzu-gamebook/scenes/bounty-badger.webp',
  blurb:
    "A bounty hunter with a writ in her coat and no lies in her mouth. She has been following one coyote's trail for a long time.",
  skills: {
    steel: 3,
    awareness: 3,
    wits: 2,
    bearing: 2,
    resolve: 3,
    insight: 0,
  },
  startProvisions: 2,
  signatureFlags: ['deed-kept-promise'],
})

export const GIDEON_VANE = premade({
  id: 'gideon-vane',
  name: 'Gideon Vane',
  species: 'pronghorn',
  pronouns: 'he',
  portrait: '/zuzu-gamebook/scenes/sections/a6-vane.webp',
  blurb:
    "Dustwater's water baron, who bought the water rights with other families' children. He has walked away from the office. The ledger walks with him.",
  skills: {
    steel: 1,
    awareness: 2,
    wits: 3,
    bearing: 4,
    resolve: 1,
    insight: 2,
  },
  startProvisions: 4,
  signatureFlags: ['deed-left-someone'],
})

export const TAMSIN = premade({
  id: 'tamsin',
  name: 'Tamsin',
  species: 'bighorn',
  pronouns: 'she',
  portrait: CUSTOM_PORTRAIT_FALLBACK,
  blurb:
    "A Tablelands guide and a widow, with two children and her husband's quarry debt. She knows every cairn on the ledges, including the ones she kicked down.",
  skills: {
    steel: 1,
    awareness: 4,
    wits: 3,
    bearing: 1,
    resolve: 3,
    insight: 1,
  },
  startProvisions: 1,
  signatureFlags: ['deed-knows-old-roads'],
})

export const AUGUSTIN = premade({
  id: 'augustin',
  name: 'Augustin',
  species: 'gorilla',
  pronouns: 'he',
  portrait: CUSTOM_PORTRAIT_FALLBACK,
  blurb:
    "Once the champion of the Black Verge's iron rings, he walked out the night they asked him to fight a child. Huge, gentle, and done fighting for anyone's purse.",
  skills: {
    steel: 4,
    awareness: 1,
    wits: 1,
    bearing: 2,
    resolve: 4,
    insight: 1,
  },
  startProvisions: 2,
  signatureFlags: ['deed-spared-foe'],
})

export const PREMADE_CHARACTERS: readonly ShiftingCharacter[] = [
  ZUZU,
  JEFFERY_MITTENS,
  FENNEC_SIBLINGS,
  THE_COYOTE,
  MAGS,
  HOLLIS,
  SISTER_WREN,
  BROTHER_PEDDLER,
  OLD_ASH,
  HESTER_KELL,
  GIDEON_VANE,
  TAMSIN,
  AUGUSTIN,
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

// Display names a premade carried in saves before it was renamed. Only these
// exact names are accepted as the premade; any other name is still refused.
const FORMER_NAMES: Readonly<Record<string, readonly string[]>> = {
  'fennec-siblings': ['The fennec siblings'],
}

// Accepts a saved snapshot only when its rules are exactly a premade's, or
// exactly what makeCustomCharacter builds from its own fields, and returns the
// current roster entry. Anything else (raised stats, extra provisions, a
// borrowed identity or signature deed, a stray extra field) is refused.
export function characterFromSnapshot(
  value: unknown,
): ShiftingCharacter | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const raw = value as ShiftingCharacter
  const premade = PREMADE_CHARACTERS.find((entry) => entry.id === raw.id)
  const saved =
    premade && FORMER_NAMES[raw.id]?.includes(raw.name)
      ? { ...raw, name: premade.name }
      : raw
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
