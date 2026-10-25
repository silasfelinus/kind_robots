export const SKILLS = [
  'brawn',
  'brains',
  'charm',
  'nerve',
  'lore',
  'hustle',
] as const
export type Skill = (typeof SKILLS)[number]

export const TAGS = [
  'paranormal',
  'slasher',
  'creature',
  'cosmic',
  'tech',
  'camp',
  'cult',
  'dream',
] as const
export type Tag = (typeof TAGS)[number]

export const EMOTIONS = [
  'neutral',
  'happy',
  'scared',
  'angry',
  'sad',
  'determined',
] as const
export type Emotion = (typeof EMOTIONS)[number]

export const TARGETS = [7, 9, 11] as const
export type Target = (typeof TARGETS)[number]

/**
 * The four groups whose standing the week wears down (Silas, 2026-10-24 PT:
 * "factions: friends family officials neighbors. if any of them drop to zero
 * that could trigger a special end sequence").
 */
export const FACTIONS = ['friends', 'family', 'officials', 'neighbors'] as const
export type Faction = (typeof FACTIONS)[number]

/** A special end sequence: a faction hit zero, or the Final Girl won. */
export type SpecialEnding = Exclude<Faction, 'friends'> | 'final-girl'

export type SpecialEndingText = { title: string; text: string; art: string }

export type Effects = {
  nerve?: number
  dread?: number
  quarters?: number
  skills?: Partial<Record<Skill, number>>
  items?: string[]
  loseItems?: string[]
  clues?: string[]
  flags?: string[]
  teleport?: Tag
}

export type Outcome = {
  text: string
  art: string
  effects: Effects
}

export type Choice = {
  id: string
  label: string
  intent: 'brave' | 'clever' | 'kind' | 'camp' | 'sneaky' | 'reckless'
  skill: Skill
  target: Target
  bonus?: { item?: string; companion?: string; flag?: string; amount: number }
  /** Finale only: which ending path a success counts as (defaults to the id). */
  approach?: 'fight' | 'trick' | 'heart'
  requires?: { clues?: number; item?: string; flag?: string }
  success: Outcome
  failure: Outcome
}

export type Encounter = {
  id: string
  title: string
  place: string
  text: string
  art: string
  choices: Choice[]
  /** Villain-deck cards only: the act (nights 1-2, 3-4, 5-6) that deals it. */
  act?: 1 | 2 | 3
}

export type Clue = {
  id: string
  title: string
  location: string
  hint: string
  encounter: Encounter
}

export type EndingTier = 'best' | 'good' | 'bittersweet' | 'bad'

export type Ending = {
  title: string
  text: string
  art: string
}

export type Inspiration = {
  original: string
  film: string
  year: number
  kind: 'flip' | 'bend' | 'remix'
  oldScript: string
  newLens: string
}

export type Villain = {
  id: string
  name: string
  epithet: string
  inspiration: Inspiration
  tags: Tag[]
  palette: [string, string, string]
  sigil: string
  logline: string
  backstory: string
  centralIssue: { title: string; summary: string }
  poster: string
  portrait: string
  /** The monster's ending photo, in the style of the Masking Up cover. */
  endingPhoto: string
  taunts: string[]
  clues: Clue[]
  signature: Encounter[]
  finale: Encounter
  endings: Record<EndingTier, Ending>
}

/** A selectable player avatar: a full-body character in an exaggerated pose. */
/** How you face trouble: the intent a choice is played with. */
export type Style = Choice['intent']

export type Avatar = {
  id: string
  name: string
  blurb: string
  /** The look's signature style: a bonus on every choice played that way. */
  style: Style
  art: string
}

/**
 * Look × clique = your character (Silas, 2026-10-24 PT): every pairing has
 * its own name, bio and portrait so the player has made someone unique.
 */
export type Character = {
  id: string
  avatar: string
  archetype: string
  title: string
  tagline: string
  bio: string
  catchphrase: string
  art: string
}

export type CompanionPerk =
  | { kind: 'dawn-nerve'; amount: number }
  | { kind: 'reroll'; per: 'night' | 'day' }
  | { kind: 'quarters'; amount: number }
  | { kind: 'shield'; per: 'night' }
  | { kind: 'clue-sense' }
  | { kind: 'tag-ward'; tag: Tag }

export type Companion = {
  id: string
  name: string
  pronouns: string
  age: number
  role: string
  bio: string
  location: string
  skills: Skill[]
  perk: { name: string; text: string; effect: CompanionPerk }
  palette: [string, string]
  poster: string
  emotions: Record<Emotion, { line: string; art: string }>
  meet: Encounter
}

export type Location = {
  id: string
  name: string
  blurb: string
  art: string
  train: Skill
  x: number
  y: number
  beats: Encounter[]
}

export type Item = {
  id: string
  name: string
  text: string
  price: number
  skill?: Skill
  bonus?: number
  ward?: Tag
  consumable?: boolean
  art: string
}

export type TagDeck = {
  tag: Tag
  name: string
  blurb: string
  encounters: Encounter[]
}

export type Archetype = {
  id: string
  name: string
  text: string
  /** The clique's home style; a look that shares it is typecast. */
  style: Style
  skills: Record<Skill, number>
}
