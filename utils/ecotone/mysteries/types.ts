import type { Check, CompanionId, Effects, LeadId, SceneKind } from '../content'

// Mysteries (conductor weird-humboldt t-062): one seeded local case per run.
// Three gate interludes reach you as digressions (a text, a voicemail, a flyer),
// two passed gates open the true path, and a short choice tree ends in a Real Ending.
// Each of the twelve cases takes its point of view from one sign of the zodiac.
// The sign shapes the story and the card design; the story never names it.

export type MysterySign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces'

export type MysteryElement = 'fire' | 'earth' | 'air' | 'water'

/** The interstitial digression that opens a gate. */
export type MysteryMessage = {
  medium: 'text' | 'voicemail' | 'note' | 'flyer' | 'radio' | 'email'
  /** Who it is from, as the phone or the paper shows it. */
  from: string
  lines: string[]
}

/** Mystery effects stay small. The compiler adds the gate and path flags itself. */
export type MysteryEffects = Pick<Effects, 'nerve' | 'goodwill' | 'weird'>

export type MysteryOutcome = {
  text: string
  effects?: MysteryEffects
  leadLines?: Partial<Record<LeadId, string>>
}

/** A gate approach always rolls: passing it is what the Case Files track. */
export type MysteryApproach = {
  id: string
  label: string
  check: Check
  cost?: string
  success: MysteryOutcome
  failure: MysteryOutcome
}

export type MysteryGate = {
  title: string
  place: string
  /** Map chapter (1-6) the digression pulls you to. */
  chapter: number
  scene: SceneKind
  message: MysteryMessage
  body: string[]
  approaches: MysteryApproach[]
  leadLines?: Partial<Record<CompanionId, string>>
  aloneLine?: string
  recall?: MysteryRecall
}

/**
 * Lines a scene adds when an earlier gate went a certain way, keyed `g<N>:pass`,
 * `g<N>:fail` or `g<N>:<approach id>` (only gates before this scene). They are how
 * a failure, or what one approach turned up, carries forward.
 */
export type MysteryRecall = Record<string, string>

export type MysteryEndingTone = 'true' | 'bittersweet' | 'strange'

export type MysteryEnding = {
  id: string
  title: string
  tone: MysteryEndingTone
  text: string[]
}

/** A finale choice goes to a branch scene (`next`) or lands on a Real Ending (`ending`). */
export type MysteryFinaleChoice = {
  id: string
  label: string
  /** What you do, before the ending's own text. */
  text: string
  next?: string
  ending?: string
  effects?: MysteryEffects
}

export type MysteryScene = {
  title: string
  place: string
  chapter: number
  scene: SceneKind
  body: string[]
  choices: MysteryFinaleChoice[]
  leadLines?: Partial<Record<CompanionId, string>>
  aloneLine?: string
  recall?: MysteryRecall
}

export type MysteryMotif =
  | 'horns'
  | 'herd'
  | 'twin-beams'
  | 'crab-pot'
  | 'mane'
  | 'grove'
  | 'scales'
  | 'crows'
  | 'arrow'
  | 'sea-goat'
  | 'jug'
  | 'two-fish'

export type MysteryCardDesign = {
  element: MysteryElement
  motif: MysteryMotif
  /** Card colors: night sky, line ink, and the glow behind the motif. */
  palette: { sky: string; ink: string; glow: string }
  /** The hidden constellation, 0-100 on both axes, drawn faintly behind the motif. */
  stars: [number, number][]
  links: [number, number][]
}

export type Mystery = {
  id: string
  /** Case number, 1-12. */
  number: number
  sign: MysterySign
  title: string
  /** One line for the Case Files shelf. */
  tagline: string
  region: string
  /** The case file's opening paragraph, shown once the case is discovered. */
  hook: string
  design: MysteryCardDesign
  /** Painted card art request (projects/art-prompts.yaml in conductor). */
  artPrompt: string
  provenance: string
  /** Gate I's way to walk away. Declining closes the case for this run. */
  decline: { label: string; text: string }
  gates: [MysteryGate, MysteryGate, MysteryGate]
  /** Fewer than two passed gates: the trail goes cold. Two plain choices, no next/ending. */
  coldCase: MysteryScene
  /** Two passed gates: the true path opens here. */
  reveal: MysteryScene & {
    /** The reveal's body when Gate III failed but Gates I and II passed: the trap missed, yet the truth still surfaces. */
    afterMiss: string[]
  }
  branches: Record<string, MysteryScene>
  /** The Real Endings, at least three, one of them tone 'true'. */
  endings: MysteryEnding[]
}
