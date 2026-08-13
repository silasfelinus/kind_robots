// /server/utils/dailyDreamFacetBlueprint.ts
import {
  loadFacetCatalogEntries,
  type FacetCatalogEntry,
  type FacetTaxonomy,
} from './facetCatalog'

export type DailyDreamFacetUse = {
  facetId: number
  fieldKey: string
  taxonomy: FacetTaxonomy
  title: string
  value: string
  artPrompt: string | null
  imagePath: string | null
}

export type DailyDreamCharacterBlueprint = {
  name: string
  species: string
  characterClass: string
  role: string | null
  alignment: string
  personality: string
  quirks: string
  backstory: string
  artPrompt: string
  facets: DailyDreamFacetUse[]
}

export type DailyDreamRewardType =
  | 'SKILL'
  | 'ITEM'
  | 'POWER'
  | 'PET'
  | 'MAGIC'
  | 'FAVOR'

export type DailyDreamRewardBlueprint = {
  name: string
  description: string
  effect: string
  flavorText: string
  artPrompt: string
  rewardType: DailyDreamRewardType
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE'
  facets: DailyDreamFacetUse[]
}

export type DailyDreamNarratorBlueprint = {
  name: string
  botType: string
  personality: string
  voice: string
  artPrompt: string
  facets: DailyDreamFacetUse[]
}

/**
 * A location has no `mood`.
 *
 * It used to. The field was fed by `one('MOOD')`, and the facet catalog no
 * longer has a MOOD taxonomy to draw from -- `applyFacetCatalogDirectives`
 * migrates narrative tone to THEME and then asserts zero MOOD profiles remain.
 * So the pick had been silently returning null and every location was already
 * being built with `mood: ''` before this field was removed; dropping it
 * changes the type, not the output.
 *
 * ART_DIRECTION is not the substitute it looks like. Its eight `art-atmosphere`
 * rows (Serene, Melancholy, Ominous, Dreamlike...) are all
 * `isRandomizable: false`, so a randomizable pick from that taxonomy returns art
 * SUBJECTS instead -- a location's atmosphere would come out as "Landscape".
 *
 * Silas, 2026-08-13: "a mood is not a hard set thing anyway, it's like hard
 * setting a character with emotion. As my clown teacher said: every character
 * can experience every emotion." A place is the same. The Dream's THEME already
 * carries tone for the whole piece; pinning a second, different one per location
 * was fixing something that reads better unfixed.
 */
export type DailyDreamLocationBlueprint = {
  name: string
  setting: string
  description: string
  facets: DailyDreamFacetUse[]
}

export type DailyDreamBlueprint = {
  dateKey: string
  title: string
  slug: string
  description: string
  pitch: string
  flavorText: string
  artPrompt: string
  facets: DailyDreamFacetUse[]
  narrator: DailyDreamNarratorBlueprint | null
  locations: DailyDreamLocationBlueprint[]
  characters: DailyDreamCharacterBlueprint[]
  rewards: DailyDreamRewardBlueprint[]
}

const FIRST_NAMES = [
  'Mira',
  'Juniper',
  'Orlo',
  'Tamsin',
  'Vesper',
  'Quill',
  'Yara',
  'Moss',
  'Clover',
  'Gadget',
  'Nim',
  'Rook',
]
const LAST_NAMES = [
  'Voss',
  'Underbridge',
  'Moonspoon',
  'Softstep',
  'Nightjar',
  'Starling',
  'Foxglove',
  'Glasswater',
  'Tanglebone',
  'Oddwick',
]
const ITEM_NOUNS = [
  'Lantern',
  'Key',
  'Compass',
  'Mask',
  'Bell',
  'Cup',
  'Needle',
  'Crown',
  'Map',
  'Blade',
  'Locket',
  'Dice',
]
const SKILL_NOUNS = [
  'Technique',
  'Gift',
  'Knack',
  'Art',
  'Blessing',
  'Discipline',
  'Instinct',
  'Sense',
]
// Default reward types after the opening SKILL + ITEM pair (spec: one SKILL,
// one ITEM), so extra rewards still spread across the RewardType enum.
const EXTRA_REWARD_TYPES = ['POWER', 'MAGIC', 'PET', 'FAVOR'] as const

function hashSeed(input: string): number {
  let hash = 2166136261
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(values: readonly T[], random: () => number): T | null {
  if (!values.length) return null
  return values[Math.floor(random() * values.length)] ?? null
}

function weightedPick(
  entries: readonly FacetCatalogEntry[],
  random: () => number,
): FacetCatalogEntry | null {
  const viable = entries.filter(
    (entry) => entry.isRandomizable && entry.randomWeight > 0,
  )
  if (!viable.length) return null
  const total = viable.reduce((sum, entry) => sum + entry.randomWeight, 0)
  let roll = random() * total
  for (const entry of viable) {
    roll -= entry.randomWeight
    if (roll <= 0) return entry
  }
  return viable.at(-1) ?? null
}

function weightedMany(
  entries: readonly FacetCatalogEntry[],
  count: number,
  random: () => number,
): FacetCatalogEntry[] {
  const remaining = [...entries]
  const selected: FacetCatalogEntry[] = []
  while (remaining.length && selected.length < count) {
    const chosen = weightedPick(remaining, random)
    if (!chosen) break
    selected.push(chosen)
    remaining.splice(
      remaining.findIndex((entry) => entry.id === chosen.id),
      1,
    )
  }
  return selected
}

function value(entry: FacetCatalogEntry | null): string {
  return entry?.canonicalValue || entry?.title || ''
}

function use(
  entry: FacetCatalogEntry | null,
  fieldKey: string,
): DailyDreamFacetUse | null {
  if (!entry) return null
  return {
    facetId: entry.id,
    fieldKey,
    taxonomy: entry.taxonomy,
    title: entry.title,
    value: value(entry),
    artPrompt: entry.artPrompt,
    imagePath: entry.cardPath || entry.imagePath || entry.heroPath,
  }
}

function uses(
  entries: readonly FacetCatalogEntry[],
  fieldKey: string,
): DailyDreamFacetUse[] {
  return entries
    .map((entry) => use(entry, fieldKey))
    .filter((entry): entry is DailyDreamFacetUse => Boolean(entry))
}

function slugSegment(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'dream'
  )
}

function sentenceList(values: string[]): string {
  const clean = values.filter(Boolean)
  if (clean.length < 2) return clean[0] || ''
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`
  return `${clean.slice(0, -1).join(', ')}, and ${clean.at(-1)}`
}

export async function buildDailyDreamFacetBlueprint(options: {
  userId: number
  isAdmin?: boolean
  includeMature?: boolean
  dateKey: string
  characterCount?: number
  rewardCount?: number
}): Promise<DailyDreamBlueprint> {
  const catalog = await loadFacetCatalogEntries({
    userId: options.userId,
    isAdmin: Boolean(options.isAdmin),
    includeMature: Boolean(options.includeMature),
    randomizableOnly: true,
  })
  const byTaxonomy = new Map<FacetTaxonomy, FacetCatalogEntry[]>()
  for (const entry of catalog) {
    const list = byTaxonomy.get(entry.taxonomy) ?? []
    list.push(entry)
    byTaxonomy.set(entry.taxonomy, list)
  }
  const pool = (...taxonomies: FacetTaxonomy[]) =>
    taxonomies.flatMap((taxonomy) => byTaxonomy.get(taxonomy) ?? [])
  const random = mulberry32(hashSeed(`${options.userId}:${options.dateKey}`))
  const one = (...taxonomies: FacetTaxonomy[]) =>
    weightedPick(pool(...taxonomies), random)

  const genre = one('GENRE')
  const theme = one('THEME')
  const setting = one('SETTING')
  const style = one('STYLE')
  const color = one('COLOR')
  // No MOOD pick: the taxonomy is empty by policy. See DailyDreamLocationBlueprint.
  const dreamEntries = [genre, theme, setting, style, color].filter(
    (entry): entry is FacetCatalogEntry => Boolean(entry),
  )
  const dreamValues = dreamEntries.map(value)
  const titleCore = value(theme) || value(setting) || value(genre) || 'Daily Dream'
  const title = `${titleCore}: ${value(genre) || value(style) || 'A Strange Invitation'}`

  const facetByEnum = (taxonomy: FacetTaxonomy, enumValue: string) =>
    pool(taxonomy).find(
      (entry) =>
        String(
          (entry.metadata as { enumValue?: unknown } | null)?.enumValue ?? '',
        ).toUpperCase() === enumValue.toUpperCase(),
    ) ?? null

  // A narrator bot hosts every Dream (spec: 1 narrator bot).
  const narratorBotType = one('BOT_TYPE')
  const narratorPersonality = one('PERSONALITY')
  const narratorName = `${pick(FIRST_NAMES, random) || 'Nim'} ${pick(LAST_NAMES, random) || 'Starling'}`
  const narratorBotValue = value(narratorBotType) || 'Story Bot'
  const narratorVoiceValue = value(narratorPersonality) || 'wry'
  const narrator: DailyDreamNarratorBlueprint | null =
    narratorBotType || narratorPersonality
      ? {
          name: narratorName,
          botType: narratorBotValue,
          personality: narratorVoiceValue,
          voice: `${narratorName} narrates in a ${narratorVoiceValue.toLowerCase()} register`,
          artPrompt: `${narratorName}, a ${narratorBotValue} narrating this Dream, ${narratorVoiceValue}, ${sentenceList(dreamValues)}, expressive mascot bot design`,
          facets: [
            use(narratorBotType, 'narratorBotType'),
            use(narratorPersonality, 'narratorPersonality'),
          ].filter((entry): entry is DailyDreamFacetUse => Boolean(entry)),
        }
      : null

  // Two locations so a Dream spans more than one place (spec: 2 locations).
  const locationEntries = weightedMany(pool('SETTING'), 2, random)
  const locations: DailyDreamLocationBlueprint[] = locationEntries.map(
    (entry) => {
      const settingValue = value(entry) || 'A place that should not exist'
      return {
        name: settingValue,
        setting: settingValue,
        description: `${settingValue} — one of the two places this Dream unfolds.`,
        facets: [use(entry, 'location')].filter(
          (item): item is DailyDreamFacetUse => Boolean(item),
        ),
      }
    },
  )
  const locationSummary = sentenceList(locations.map((place) => place.name))

  const characters: DailyDreamCharacterBlueprint[] = []
  const characterCount = Math.min(4, Math.max(1, options.characterCount ?? 3))
  for (let index = 0; index < characterCount; index++) {
    const species = one('ANIMAL', 'SPECIES')
    const characterClass = one('OCCUPATION', 'ARCHETYPE', 'ROLE')
    const alignment = one('ALIGNMENT')
    const personalities = weightedMany(pool('PERSONALITY'), 2, random)
    const quirks = weightedMany(pool('QUIRK'), 2, random)
    const backstory = one('BACKSTORY')
    const name = `${pick(FIRST_NAMES, random) || 'Mira'} ${pick(LAST_NAMES, random) || 'Voss'}`
    const classValue = value(characterClass) || 'Wanderer'
    const speciesValue = value(species) || 'Mysterious Being'
    const alignmentValue = value(alignment) || 'Uncertain'
    const personalityValue = sentenceList(personalities.map(value)) || 'curious'
    const quirkValue = sentenceList(quirks.map(value)) || 'impossible to overlook'
    const backstoryValue =
      value(backstory) || 'They arrived carrying a history nobody agrees on.'
    const facetUses = [
      use(species, 'species'),
      use(characterClass, characterClass?.taxonomy === 'ROLE' ? 'role' : 'class'),
      use(alignment, 'alignment'),
      ...uses(personalities, 'personality'),
      ...uses(quirks, 'quirks'),
      use(backstory, 'backstory'),
    ].filter((entry): entry is DailyDreamFacetUse => Boolean(entry))

    characters.push({
      name,
      species: speciesValue,
      characterClass: classValue,
      role: characterClass?.taxonomy === 'ROLE' ? classValue : null,
      alignment: alignmentValue,
      personality: personalityValue,
      quirks: quirkValue,
      backstory: `${backstoryValue} In this Dream, ${name} must decide what ${alignmentValue.toLowerCase()} means when certainty is dangerous.`,
      artPrompt: `${name}, ${speciesValue} ${classValue}, ${personalityValue}, ${quirkValue}, ${sentenceList(dreamValues)}, expressive full character design`,
      facets: facetUses,
    })
  }

  const rewards: DailyDreamRewardBlueprint[] = []
  const rewardCount = Math.min(4, Math.max(1, options.rewardCount ?? 2))
  for (let index = 0; index < rewardCount; index++) {
    // The first two rewards are always a SKILL and an ITEM (spec); any extras
    // spread across the remaining RewardType enum values.
    const rewardType: DailyDreamRewardType =
      index === 0
        ? 'SKILL'
        : index === 1
          ? 'ITEM'
          : EXTRA_REWARD_TYPES[(index - 2) % EXTRA_REWARD_TYPES.length]!
    const rewardTypeFacet = facetByEnum('REWARD_TYPE', rewardType)
    const material = one('MATERIAL')
    const rewardTheme = one('THEME') || theme
    const rewardColor = one('COLOR')
    const materialValue = value(material) || 'Impossible'
    const themeValue = value(rewardTheme)
    const colorValue = value(rewardColor)
    const rarityRoll = random()
    const rarity =
      rarityRoll > 0.9 ? 'RARE' : rarityRoll > 0.6 ? 'UNCOMMON' : 'COMMON'
    const facetUses = [
      use(rewardTypeFacet, 'rewardType'),
      use(material, 'material'),
      use(rewardTheme, 'theme'),
      use(rewardColor, 'color'),
    ].filter((entry): entry is DailyDreamFacetUse => Boolean(entry))

    if (rewardType === 'SKILL') {
      const skillNoun = pick(SKILL_NOUNS, random) || 'Technique'
      const name = `The ${materialValue} ${skillNoun}${themeValue ? ` of ${themeValue}` : ''}`
      rewards.push({
        name,
        description: `A learnable ${skillNoun.toLowerCase()} drawn from ${materialValue}${themeValue ? ` and ${themeValue.toLowerCase()}` : ''} — an ability a character carries out of the Dream.`,
        effect: `Whoever masters the ${skillNoun.toLowerCase()} can bend the Dream's central rule once, but the Dream remembers who used it.`,
        flavorText: 'You do not hold it; it holds you.',
        artPrompt: `${name}, an ability manifesting as ${colorValue || 'luminous'} energy around a figure, ${sentenceList(dreamValues)}, dynamic skill aura, no object`,
        rewardType,
        rarity,
        facets: facetUses,
      })
    } else {
      const noun = pick(ITEM_NOUNS, random) || 'Relic'
      const name = `${materialValue} ${noun}${themeValue ? ` of ${themeValue}` : ''}`
      rewards.push({
        name,
        description: `A ${colorValue ? `${colorValue} ` : ''}${noun.toLowerCase()} made from ${materialValue}${themeValue ? ` and shaped by ${themeValue}` : ''}.`,
        effect: `When introduced into a scene, the ${noun.toLowerCase()} changes what the characters believe is possible, but demands a choice that reflects the Dream's central conflict.`,
        flavorText: 'It feels as though it remembers tomorrow.',
        artPrompt: `${name}, singular magical reward item, ${colorValue}, ${sentenceList(dreamValues)}, readable silhouette, detailed object illustration`,
        rewardType,
        rarity,
        facets: facetUses,
      })
    }
  }

  const castSummary = characters
    .map(
      (character) =>
        `${character.name}, a ${character.species} ${character.characterClass}`,
    )
    .join('; ')
  const rewardSummary = rewards.map((reward) => reward.name).join('; ')
  const placeClause = locationSummary
    ? ` It moves between ${locationSummary}.`
    : ''
  const narratorClause = narrator
    ? ` ${narrator.name}, a ${narrator.botType}, narrates.`
    : ''
  const description = `A ${sentenceList(dreamValues)} Dream. Its cast: ${castSummary}. Its consequential rewards: ${rewardSummary}.${placeClause}${narratorClause}`
  const pitch = `${
    narrator ? `${narrator.name} opens the Dream: ` : ''
  }it begins when ${characters[0]?.name || 'a stranger'} discovers ${rewards[0]?.name || 'an impossible gift'} in ${locations[0]?.name || 'a place that should not exist'} and learns that ${value(theme) || 'the apparent theme'} is not a mood but a rule. Every character wants something different from that rule, and the rewards inside the Dream can alter it.`

  return {
    dateKey: options.dateKey,
    title,
    slug: `daily-dream-${options.dateKey}-${options.userId}-${slugSegment(titleCore)}`,
    description,
    pitch,
    flavorText: `Generated as a nested Facet blueprint for ${options.dateKey}.`,
    artPrompt: `${title}, ${description}, cinematic ensemble scene across ${locationSummary || 'a shifting dreamscape'}, characters interacting with visible rewards, ${sentenceList(dreamValues)}, coherent visual storytelling`,
    facets: uses(dreamEntries, 'dream'),
    narrator,
    locations,
    characters,
    rewards,
  }
}
