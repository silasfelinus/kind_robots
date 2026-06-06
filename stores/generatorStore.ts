// /stores/generatorStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Rarity, RewardType } from '~/prisma/generated/prisma/client'
import { performFetch } from '@/stores/utils'

export type RolledReward = {
  id: string
  rewardId: number
  label: string
  text: string
  power?: string | null
  icon?: string | null
  imagePath?: string | null
  rarity: Rarity
  rewardType: RewardType
  payload?: Record<string, unknown>
}

type RewardRecord = {
  id: number
  label?: string | null
  name?: string | null
  title?: string | null
  text?: string | null
  description?: string | null
  power?: string | null
  icon?: string | null
  imagePath?: string | null
  image?: string | null
  rarity?: Rarity | null
  rewardType?: RewardType | null
  payload?: Record<string, unknown> | null
}

type RollRewardOptionsInput = {
  baseRarity?: Rarity
  count?: number
  rewardTypes?: RewardType[]
}

type GeneratorListKey =
  | 'givenName'
  | 'name'
  | 'honorific'
  | 'genre'
  | 'species'
  | 'characterClass'
  | 'class'
  | 'alignment'
  | 'genderIdentity'
  | 'gender'
  | 'personality'
  | 'quirks'
  | 'background'
  | 'backstory'
  | 'art'
  | 'artPrompt'

type RarityRollOption = {
  rarity: Rarity
  weight: number
}

const GIVEN_NAMES = [
  'Mira',
  'Buttonwick',
  'Zora',
  'Juniper',
  'Cassian',
  'Nim',
  'Vex',
  'Tamsin',
  'Orlo',
  'Pip',
  'Ludo',
  'Maribel',
  'Quill',
  'Rook',
  'Sable',
  'Thimble',
  'Vesper',
  'Wren',
  'Yara',
  'Zig',
  'Moss',
  'Clover',
  'Fern',
  'Gadget',
  'Hex',
  'Ivy',
  'Juno',
  'Kestrel',
  'Lark',
  'Marlow',
]

const FAMILY_NAMES = [
  'Voss',
  'Underbridge',
  'Moonspoon',
  'Gearwhistle',
  'Holloway',
  'Softstep',
  'Ashburrow',
  'Copperpot',
  'Nightjar',
  'Velvet',
  'Grimble',
  'Fallow',
  'Widdershins',
  'Starling',
  'Bramblehook',
  'Oddwick',
  'Glasswater',
  'Mothweather',
  'Tanglebone',
  'Foxglove',
]

const HONORIFICS = [
  'adventurer',
  'the inconvenient',
  'formerly respectable',
  'certified menace',
  'the mildly foretold',
  'holder of several opinions',
  'technically innocent',
  'the suspiciously prepared',
  'licensed in three municipalities',
  'the one with the bag',
  'public nuisance',
  'reluctant protagonist',
  'keeper of the tiny ledger',
  'the recently noticed',
  'bearer of confusing credentials',
  'the mostly harmless',
]

const PERSONALITIES = [
  'introverted',
  'extroverted',
  'passionate',
  'hopeless-romantic',
  'foolish',
  'easily-frustrated',
  'submissive',
  'dominant',
  'narcissistic',
  'nervous',
  'scatter-brained',
  'bookworm',
  'book-smart',
  'obsequious',
  'driven',
  'show-off',
  'altruistic',
  'generous',
  'apathetic',
  'sarcastic',
  'sense-of-humor',
  'fatalistic',
  'optimist',
  'pessimist',
  'logical',
  'emotional',
  'charismatic',
  'enthusiastic',
  'energetic',
  'hyperactive',
  'ditzy',
  'artistic',
  'authoritarian',
  'problem-solver',
  'puzzler',
  'devious',
  'ignorant',
  'obsessive',
  'amoral',
  'inventive',
  'creative-writer',
  'secretive',
  'lone-wolf',
  'team-player',
  'believes-psychic',
  'metaphysical',
  'superstitious',
  'overly-literal',
  'compulsively-honest',
  'pathological-liar',
  'hoarder',
  'conspiracy-minded',
  'soft-spoken',
  'brash',
  'dramatic',
  'deadpan',
  'melancholy',
  'cheerfully-morbid',
  'worrisome',
  'reckless',
  'protective',
  'jealous',
  'vindictive',
  'diplomatic',
  'blunt',
  'curious',
  'inquisitive',
  'gullible',
  'suspicious',
  'perfectionist',
  'animist',
  'serene',
  'competitive',
  'flirtatious',
  'daydreamer',
  'daredevil',
]

const QUIRKS = [
  'double-jointed',
  'fortunate',
  'heterochromia',
  'extra-body-part',
  'musical',
  'likes-to-dance',
  'left-handed',
  'obsessive-compulsive',
  'clumsy',
  'notably-tall',
  'notably-short',
  'kleptomaniac',
  'pyromaniac',
  'lactose-intolerant',
  'allergies',
  'addict',
  'secret-identity',
  'always-online',
  'messy',
  'fashionable',
  'forgetful',
  'animal-magnet',
  'green-thumb',
  'insomniac',
  'bad-luck-magnet',
]

const GENRES = [
  'Fantasy',
  'Science Fiction',
  'Mystery',
  'Thriller',
  'Crime',
  'Horror',
  'Romance',
  'Comedy',
  'Drama',
  'Action',
  'Adventure',
  'Historical Fiction',
  'Literary Fiction',
  'Contemporary Fiction',
  'Young Adult',
  "Children's Fantasy",
  'True Crime',
  'Gothic',
  'Gothic Comedy',
  'Weirdcore',
  'Magical Realism',
  'Cosmic Horror',
  'Cosmic Dread',
  'Folk Horror',
  'Cozy Horror',
  'Noir',
  'Western',
  'War',
  'Spy / Espionage',
  'Superhero',
  'Cyberpunk',
  'Steampunk',
  'Space Opera',
  'Urban Fantasy',
  'Dark Fantasy',
  'Paranormal',
  'Dystopian',
  'Post-Apocalypse',
  'Satire',
  'Musical',
  'Solarpunk',
  'Sword and Sorcery',
  'Martial Arts',
  'Fairy Tale',
  'Mythology',
  'Carnival',
]

const SPECIES = [
  'Human',
  'Elf',
  'Dwarf',
  'Orc',
  'Goblin',
  'Halfling',
  'Gnome',
  'Troll',
  'Ogre',
  'Giant',
  'Catfolk',
  'Wolfkin',
  'Foxkin',
  'Rabbitfolk',
  'Bearfolk',
  'Lizardfolk',
  'Frogfolk',
  'Birdfolk',
  'Sharkfolk',
  'Mothfolk',
  'Fae',
  'Satyr',
  'Merfolk',
  'Centaur',
  'Minotaur',
  'Harpy',
  'Sphinx',
  'Dragonkin',
  'Phoenixborn',
  'Unicorn-Touched',
  'Vampire',
  'Werebeast',
  'Ghost',
  'Skeleton',
  'Zombie',
  'Ghoul',
  'Witchborn',
  'Shadowkin',
  'Changeling',
  'Nightmare',
  'Robot',
  'Android',
  'Golem',
  'Living Doll',
  'Slime',
  'Plantfolk',
  'Mushroomfolk',
  'Crystalborn',
  'Starborn',
  'Voidling',
  'Siren',
  'Tardigrade',
  'Axolotl',
  'Mantis Shrimp',
  'Murder of Crows',
  'Leech',
  'Octopus',
  'Elder God',
  'Platypus',
  'Ankylosaurus',
  'Angel',
  'Demon',
  'Trickster',
  'Deity',
  'Fairy',
  'Imp',
  'Gremlin',
  'Dryad',
  'Luck Dragon',
  'Butterfly',
  'Spider',
  'Imaginary Friend',
  'Poltergeist',
  'Cryptid',
  'Dragon',
  'Whale',
  'Potted Geranium',
  'Sentient Spaceship',
  'Space Clown',
  'Kaiju',
  'Toon',
  'Yokai',
  'Scarecrow',
  'Time Being',
  'Lion',
  'Cat',
  'Dog',
  'Rabbit',
]

const CALLINGS = [
  'Rogue',
  'Warrior',
  'Wizard',
  'Cleric',
  'Bard',
  'Ranger',
  'Paladin',
  'Druid',
  'Monk',
  'Warlock',
  'Artificer',
  'Oracle',
  'Witch',
  'Slacker',
  'Netrunner',
  'Cupid',
  'Accountant',
  'Public Notary',
  'Politician',
  'Groupie',
  'Musician',
  'Performance Artist',
  'Bounty Hunter',
  'Doctor',
  'Lawyer',
  'Space Lawyer',
  'Criminal Mastermind',
  'Super Hero',
  'Super Villain',
  'Reporter',
  'Clown',
  'Mime',
  'Assassin',
  'NPC',
  'Gambler',
  'Mad Scientist',
  'Alchemist',
  'Polymath',
  'Poet',
  'Waste of Space',
  'Philanthropist',
  'Troublemaker',
  'Chaos Consultant',
  'Reluctant Chosen One',
  'Tactical Coward',
  'Unlicensed Exorcist',
  'Narrative Engineer',
  'Drone Wrangler',
  'Containment Specialist',
  'The Bait',
  'Mentor',
  'Middle Manager',
  'Compliance Officer',
  'Apex Predator',
]

const ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
  'Appetite',
  'Onanism',
  'Safety',
  'Curious',
  'Petty',
  'Correct',
  'Loyal',
  'Aesthetic',
  'Utilitarian',
  'Transactional',
]

const GENDERS = [
  'man',
  'woman',
  'nonbinary',
  'agender',
  'fluid',
  'N/A — inapplicable to entity architecture',
  'two-spirit',
  'demi',
  'intersex',
  'questioning',
  'pangender',
  'genderqueer',
  'androgynous',
  'neutrois',
  'xenogender',
]

const BACKGROUNDS = [
  'hunted',
  'tragic-past',
  'blessed-life',
  'survivor',
  'exiled',
  'orphaned',
  'resurrected',
  'witch-blood',
  'escaped-cultist',
  'reformed-villain',
  'rejected-destiny',
  'mutation',
  'child-prodigy',
  'science-experiment',
  'cursed',
  'haunted',
  'chosen-wrong',
  'hidden-heir',
  'lost-royal',
  'forbidden-born',
  'omen-born',
  'star-fallen',
  'time-lost',
  'world-stranded',
  'memory-erased',
  'name-stolen',
  'debt-born',
  'miracle-child',
  'last-of-kind',
  'unmade',
]

const UPGRADE_TABLE: Record<Rarity, RarityRollOption[]> = {
  COMMON: [
    { rarity: 'COMMON', weight: 72 },
    { rarity: 'UNCOMMON', weight: 20 },
    { rarity: 'RARE', weight: 7 },
    { rarity: 'EPIC', weight: 1 },
    { rarity: 'LEGENDARY', weight: 0 },
    { rarity: 'MYTHIC', weight: 0 },
  ],
  UNCOMMON: [
    { rarity: 'UNCOMMON', weight: 68 },
    { rarity: 'RARE', weight: 22 },
    { rarity: 'EPIC', weight: 8 },
    { rarity: 'LEGENDARY', weight: 2 },
    { rarity: 'COMMON', weight: 0 },
    { rarity: 'MYTHIC', weight: 0 },
  ],
  RARE: [
    { rarity: 'RARE', weight: 65 },
    { rarity: 'EPIC', weight: 24 },
    { rarity: 'LEGENDARY', weight: 9 },
    { rarity: 'MYTHIC', weight: 2 },
    { rarity: 'COMMON', weight: 0 },
    { rarity: 'UNCOMMON', weight: 0 },
  ],
  EPIC: [
    { rarity: 'EPIC', weight: 80 },
    { rarity: 'LEGENDARY', weight: 16 },
    { rarity: 'MYTHIC', weight: 4 },
    { rarity: 'COMMON', weight: 0 },
    { rarity: 'UNCOMMON', weight: 0 },
    { rarity: 'RARE', weight: 0 },
  ],
  LEGENDARY: [
    { rarity: 'LEGENDARY', weight: 85 },
    { rarity: 'MYTHIC', weight: 15 },
    { rarity: 'COMMON', weight: 0 },
    { rarity: 'UNCOMMON', weight: 0 },
    { rarity: 'RARE', weight: 0 },
    { rarity: 'EPIC', weight: 0 },
  ],
  MYTHIC: [
    { rarity: 'MYTHIC', weight: 100 },
    { rarity: 'COMMON', weight: 0 },
    { rarity: 'UNCOMMON', weight: 0 },
    { rarity: 'RARE', weight: 0 },
    { rarity: 'EPIC', weight: 0 },
    { rarity: 'LEGENDARY', weight: 0 },
  ],
}

function pickRandom<T>(items: T[]): T | null {
  if (!items.length) return null
  return items[Math.floor(Math.random() * items.length)] ?? null
}

function pickMany<T>(items: T[], count: number): T[] {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count)
}

function weightedRoll<T extends { weight: number }>(options: T[]): T {
  const viable = options.filter((option) => option.weight > 0)
  const total = viable.reduce((sum, option) => sum + option.weight, 0)

  if (!viable.length || total <= 0) {
    return options[0] as T
  }

  let roll = Math.random() * total

  for (const option of viable) {
    roll -= option.weight
    if (roll <= 0) return option
  }

  return viable[viable.length - 1] as T
}

function normalizeReward(reward: RewardRecord): RolledReward | null {
  const label = String(reward.label || reward.name || reward.title || '').trim()
  const text = String(reward.text || reward.description || '').trim()

  if (!reward.id || !label || !reward.rewardType) return null

  return {
    id: String(reward.id),
    rewardId: reward.id,
    label,
    text,
    power: reward.power ?? null,
    icon: reward.icon ?? null,
    imagePath: reward.imagePath ?? reward.image ?? null,
    rarity: reward.rarity ?? 'COMMON',
    rewardType: reward.rewardType,
    payload: reward.payload ?? {},
  }
}

function titleCaseSlug(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

export const useGeneratorStore = defineStore('generatorStore', () => {
  const rewardPool = ref<RolledReward[]>([])
  const rewardLoading = ref(false)
  const rewardError = ref('')

  const rewardsLoaded = computed(() => rewardPool.value.length > 0)

  async function fetchRewards(force = false): Promise<void> {
    if (rewardLoading.value) return
    if (rewardsLoaded.value && !force) return

    rewardLoading.value = true
    rewardError.value = ''

    try {
      const response = await performFetch<RewardRecord[]>('/api/rewards')

      if (!response.success) {
        rewardError.value = response.message || 'Could not load rewards.'
        return
      }

      const rawRewards: RewardRecord[] = Array.isArray(response.data)
        ? response.data
        : []

      rewardPool.value = rawRewards
        .map((reward: RewardRecord) => normalizeReward(reward))
        .filter((reward): reward is RolledReward => Boolean(reward))
    } catch (error) {
      rewardError.value =
        error instanceof Error ? error.message : 'Could not load rewards.'
    } finally {
      rewardLoading.value = false
    }
  }

  function rarityUpgrade(baseRarity: Rarity = 'COMMON'): Rarity {
    return weightedRoll(UPGRADE_TABLE[baseRarity] ?? UPGRADE_TABLE.COMMON)
      .rarity
  }

  function rollRewardOptions(
    input: RollRewardOptionsInput | Rarity = {},
    legacyCount?: number,
  ): RolledReward[] {
    const options: RollRewardOptionsInput =
      typeof input === 'string'
        ? {
            baseRarity: input,
            count: legacyCount,
          }
        : input

    const baseRarity = options.baseRarity ?? 'COMMON'
    const count = options.count ?? 6
    const rewardTypes = options.rewardTypes ?? []
    const results: RolledReward[] = []
    const usedIds = new Set<string>()
    let attempts = 0

    while (results.length < count && attempts < count * 30) {
      attempts++

      const rarity = rarityUpgrade(baseRarity)

      const candidates = rewardPool.value.filter((reward) => {
        if (reward.rarity !== rarity) return false
        if (rewardTypes.length && !rewardTypes.includes(reward.rewardType)) {
          return false
        }
        return !usedIds.has(reward.id)
      })

      const pick = pickRandom(candidates)

      if (!pick) continue

      usedIds.add(pick.id)
      results.push(pick)
    }

    if (results.length >= count) return results

    const fallbackCandidates = rewardPool.value.filter((reward) => {
      if (rewardTypes.length && !rewardTypes.includes(reward.rewardType)) {
        return false
      }

      return !usedIds.has(reward.id)
    })

    for (const reward of pickMany(fallbackCandidates, count - results.length)) {
      usedIds.add(reward.id)
      results.push(reward)
    }

    return results
  }

  function givenName(): string {
    const first = pickRandom(GIVEN_NAMES) ?? 'Mira'
    const last = pickRandom(FAMILY_NAMES) ?? 'Voss'
    return `${first} ${last}`
  }

  function honorific(): string {
    return pickRandom(HONORIFICS) ?? 'adventurer'
  }

  function genre(): string {
    return pickRandom(GENRES) ?? 'Fantasy'
  }

  function species(): string {
    return pickRandom(SPECIES) ?? 'Human'
  }

  function characterClass(): string {
    return pickRandom(CALLINGS) ?? 'Rogue'
  }

  function alignment(): string {
    return pickRandom(ALIGNMENTS) ?? 'Chaotic Good'
  }

  function genderIdentity(): string {
    return pickRandom(GENDERS) ?? 'nonbinary'
  }

  function personality(count = 3): string {
    return pickMany(PERSONALITIES, count).join(', ')
  }

  function quirks(count = 1): string {
    return pickMany(QUIRKS, count).map(titleCaseSlug).join(', ')
  }

  function background(): string {
    const pick = pickRandom(BACKGROUNDS) ?? 'hunted'
    return titleCaseSlug(pick)
  }

  function backstory(): string {
    const origin = background()
    const vibe = pickRandom(PERSONALITIES) ?? 'curious'
    const flaw = pickRandom(QUIRKS) ?? 'bad-luck-magnet'

    return `${origin}. They learned early that survival is less about being prepared and more about looking prepared while everything catches fire. Their ${titleCaseSlug(
      vibe,
    ).toLowerCase()} nature keeps dragging them toward trouble, while their ${titleCaseSlug(
      flaw,
    ).toLowerCase()} tendency makes the trouble recognisably theirs.`
  }

  function artPrompt(context: Record<string, unknown> = {}): string {
    const name = String(context.name || givenName())
    const selectedSpecies = String(context.species || species())
    const selectedClass = String(context.class || characterClass())
    const selectedGenre = String(context.genre || genre())
    const selectedPersonality = String(context.personality || personality(2))
    const selectedQuirks = String(context.quirks || quirks())

    return [
      `${name}, a ${selectedSpecies} ${selectedClass}`,
      `genre: ${selectedGenre}`,
      `personality: ${selectedPersonality}`,
      `quirks: ${selectedQuirks}`,
      'expressive character portrait',
      'dramatic readable silhouette',
      'rich fantasy editorial lighting',
      'high-detail illustration',
    ].join(', ')
  }

  function suggest(key: string, context: Record<string, unknown> = {}): string {
    if (key === 'givenName' || key === 'name') return givenName()
    if (key === 'honorific') return honorific()
    if (key === 'genre') return genre()
    if (key === 'species') return species()
    if (key === 'characterClass' || key === 'class') return characterClass()
    if (key === 'alignment') return alignment()
    if (key === 'genderIdentity' || key === 'gender') return genderIdentity()
    if (key === 'personality') return personality()
    if (key === 'quirks') return quirks()
    if (key === 'background' || key === 'backstory') return backstory()
    if (key === 'art' || key === 'artPrompt') return artPrompt(context)

    return ''
  }
  function generateName(): string {
    return givenName()
  }

  function generateAlignment(): string {
    return alignment()
  }

  function generateOne(
    key: GeneratorListKey | string,
    fallbackOrContext: string | Record<string, unknown> = {},
  ): string {
    const fallback =
      typeof fallbackOrContext === 'string' ? fallbackOrContext : ''

    const context =
      fallbackOrContext && typeof fallbackOrContext === 'object'
        ? fallbackOrContext
        : {}

    const generated = suggest(key, context).trim()

    return generated || fallback
  }

  return {
    rewardPool,
    rewardLoading,
    rewardError,
    rewardsLoaded,
    fetchRewards,
    rarityUpgrade,
    rollRewardOptions,
    givenName,
    honorific,
    genre,
    species,
    characterClass,
    alignment,
    genderIdentity,
    personality,
    quirks,
    background,
    backstory,
    artPrompt,
    suggest,
    generateName,
    generateAlignment,
    generateOne,
  }
})
