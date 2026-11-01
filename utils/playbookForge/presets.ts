import type { Blueprint } from './types'

// Where a new idea starts. Every blueprint begins as a Vignette and a genre
// nudges it toward the shape of the playbook that pioneered that genre. These
// are starting loadouts, not limits: every row stays adjustable.

export const VIGNETTE_DEFAULTS: Blueprint = {
  slug: '',
  title: '',
  idea: '',
  genre: 'open',
  placement: 'admin',
  tier: null,
  checkpoint: 'illustrious',
  artStyles: 1,

  creator: 'roster',
  rosterSize: 3,
  creatorFactors: 2,
  optionsPerFactor: 4,
  portraits: 'per-option',
  expressions: 1,
  nameAndPronouns: true,
  playerUpload: false,
  identityAffectsOdds: false,

  stats: 2,
  checks: '2d6',
  visibleOdds: true,
  outcomes: 'pass-fail',
  failForward: true,
  outcomeArt: 'success',
  meters: 1,
  hiddenLedger: false,

  acts: 2,
  chaptersPerAct: 3,
  encounters: 18,
  choicesPerEncounter: 3,
  quests: 0,
  questSteps: 2,
  locations: 0,

  followers: 3,
  partySize: 1,
  followerExpressions: 1,
  followerQuestSteps: 0,
  villains: 1,
  villainPerRun: false,
  figures: 2,
  factions: 1,
  romances: 1,

  reveals: 3,
  moments: 9,
  trailerBeats: 4,
  endings: 4,
  endingMode: 'authored',
  finaleBeats: 2,
  endingVersions: 'one',
  followerEpilogues: false,
  partyEndings: 0,
  partyAdventureSteps: 0,
  villainEndings: 0,

  autosave: true,
  saveStyle: 'snapshot',
  unreadable: 'hold',
  saveSlots: 0,
  undo: 'last-choice',
  seededRuns: true,
  shareSeed: false,
  metaProgress: true,
  exportSaves: false,

  sparks: [],
  designs: [],
}

export type Genre = {
  id: string
  label: string
  pitch: string
  lineage: string
  tones: string
  /** Art from the playbook that pioneered the genre. */
  cover: string
  shape: Partial<Blueprint>
}

export const GENRES: Genre[] = [
  {
    id: 'open',
    cover: '/zuzu-gamebook/scenes/bell-tower.webp',
    label: 'Open idea',
    pitch: 'Start from a clean Vignette and shape it yourself.',
    lineage: 'The Lantern Ferry',
    tones: 'any',
    shape: {},
  },
  {
    id: 'space-comedy',
    cover: '/game-of-captains/front/splash.webp',
    label: 'Space comedy',
    pitch:
      'Pilot a long red couch, unfold pocket rooms and decide who deserves an intervention.',
    lineage: 'Space Couch',
    tones: 'comic, ethical, ensemble',
    shape: {
      creator: 'roster',
      rosterSize: 6,
      followers: 8,
      partySize: 3,
      villains: 3,
      villainPerRun: true,
      quests: 6,
      checks: 'percent',
      outcomes: 'four-tier',
      outcomeArt: 'both',
      encounters: 24,
    },
  },
  {
    id: 'hero-academy',
    cover: '/comet-city-academy/front/splash.webp',
    label: 'Hero academy',
    pitch: 'Build a student, learn a power, survive a term and a prom.',
    lineage: 'Prom of Doom · Capes & Tassels series',
    tones: 'romantic, comic, coming-of-age',
    shape: {
      creator: 'builder',
      creatorFactors: 2,
      optionsPerFactor: 6,
      portraits: 'per-combination',
      identityAffectsOdds: true,
      outcomes: 'four-tier',
      followers: 6,
      romances: 3,
      villains: 2,
      outcomeArt: 'both',
      chaptersPerAct: 7,
    },
  },
  {
    id: 'court-intrigue',
    cover: '/emperor-of-dust/map/wasteland.webp',
    label: 'Court intrigue',
    pitch: 'Rule from a throne; every petition costs someone.',
    lineage: 'Emperor of Dust',
    tones: 'grim, strategic, political',
    shape: {
      creator: 'fixed',
      followers: 6,
      factions: 3,
      quests: 8,
      questSteps: 2,
      checks: 'percent',
      outcomes: 'four-tier',
      meters: 2,
      saveStyle: 'ledger',
      saveSlots: 3,
      undo: 'rewind',
    },
  },
  {
    id: 'office-dystopia',
    cover: '/shifting-desks/front-poster.svg',
    label: 'Office dystopia',
    pitch: 'File, stamp, survive. No clean wins.',
    lineage: 'Shifting Desks',
    tones: 'dark comic, satirical',
    shape: {
      creator: 'fixed',
      factions: 2,
      followers: 1,
      villains: 1,
      encounters: 24,
      meters: 3,
      hiddenLedger: true,
      shareSeed: true,
    },
  },
  {
    id: 'fable-journey',
    cover: '/shifting-lands/cards/the-map-in-ashes.webp',
    label: 'Fable journey',
    pitch: 'Cross shifting lands; the map remembers what you did.',
    lineage: 'Zuzu: Shifting Lands',
    tones: 'whimsical, wandering, kind',
    shape: {
      creator: 'fixed',
      followers: 2,
      factions: 0,
      romances: 0,
      acts: 2,
      chaptersPerAct: 3,
      encounters: 21,
      hiddenLedger: true,
      saveStyle: 'ledger',
    },
  },
  {
    id: 'comedy-horror',
    cover: '/crystal-street/cover.webp',
    label: 'Comedy horror',
    pitch: 'Something is wrong with this town, and it is very funny.',
    lineage: 'Ecotone, Terrors on Crystal Street',
    tones: 'spooky, warm, absurd',
    shape: {
      creator: 'roster',
      rosterSize: 4,
      playerUpload: true,
      villains: 1,
      reveals: 3,
      endings: 5,
      figures: 3,
      saveSlots: 3,
    },
  },
  {
    id: 'cozy-mystery',
    cover: '/ecotone/title/key-art.webp',
    label: 'Cozy mystery',
    pitch: 'Interview, notice, accuse. Get it wrong charmingly.',
    lineage: 'Ecotone Mysteries',
    tones: 'gentle, clever, local',
    shape: {
      creator: 'fixed',
      checks: 'none',
      followers: 1,
      figures: 3,
      reveals: 3,
      endings: 3,
      romances: 0,
    },
  },
]

export function blueprintFromIdea(
  title: string,
  idea: string,
  genreId: string,
): Blueprint {
  const genre = GENRES.find((g) => g.id === genreId) ?? GENRES[0]!
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return {
    ...VIGNETTE_DEFAULTS,
    ...genre.shape,
    slug,
    title,
    idea,
    genre: genre.id,
  }
}
