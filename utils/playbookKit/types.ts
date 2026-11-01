// Playbook Kit: the shared anatomy every Kind Robots story game ("playbook")
// declares. A game keeps its own engine and rules; this spec is the part the
// framework reads to draw the one-screen shell, the title trailer, the
// scrapbook of cinematic moments, the cast, factions, secrets and endings
// galleries, and to audit the game against its complexity budget.

/** How big a playbook is allowed to be. Start small; earn the next tier. */
export type PlaybookTier = 'vignette' | 'standard' | 'saga'

/** DaisyUI color tokens, so a faction reads in every theme. */
export type KitTone =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'

/**
 * One picture. `brief` is always required: it is the ArtJob prompt seed, so an
 * entity without rendered art still knows what to ask for. `src` arrives once
 * the art is rendered and delivered.
 */
export type KitArt = {
  brief: string
  /**
   * The picture in literal prose for the kit's render engine (Krea 2): who,
   * where, doing what, under what light, from what camera. No metaphors,
   * negations or format nouns; the Playbook Forge verifier holds it to that.
   */
  prompt?: string
  src?: string
  alt?: string
  /** CSS object-position for crops whose subject sits off-centre. */
  focus?: string
}

export type KitAct = { id: number; title: string; blurb: string }

/** A number the player sees on screen at all times. Every one costs attention. */
export type KitMeter = {
  id: string
  label: string
  min: number
  max: number
  start: number
  /** A faction whose standing this meter is. */
  faction?: string
}

export type KitFaction = {
  id: string
  name: string
  tagline: string
  tone: KitTone
  emblem: KitArt
}

export type KitCastRole = 'follower' | 'villain' | 'figure'

export type KitRomance = {
  /** One line on what the relationship is about, not just who it is with. */
  arc: string
  /** Scrapbook moments of kind `romance` that carry it. */
  moments: string[]
}

export type KitCastMember = {
  id: string
  name: string
  role: KitCastRole
  tagline: string
  portrait: KitArt
  faction?: string
  /** Villains only: exactly one per playbook is the principal antagonist. */
  primary?: boolean
  /** Optional, always player-chosen, and hidden when the romance setting is off. */
  romance?: KitRomance
}

export type KitReveal = {
  id: string
  title: string
  /** What the Secrets pane shows before it is discovered. Must not spoil it. */
  teaser: string
  text: string
  act: number
  /** Cast and faction ids the reveal changes how the player sees. */
  about: string[]
}

export type KitEndingTone =
  'hopeful' | 'bittersweet' | 'dark' | 'comic' | 'secret'

export type KitEnding = {
  id: string
  title: string
  tone: KitEndingTone
  summary: string
  /** Shown on the locked card. A nudge, never the recipe. */
  hint: string
  about: string[]
  art: KitArt
}

export type KitMomentKind =
  'scene' | 'follower' | 'villain' | 'romance' | 'reveal' | 'faction' | 'ending'

/** A cinematic beat the scrapbook keeps once the player has lived it. */
export type KitMoment = {
  id: string
  title: string
  caption: string
  kind: KitMomentKind
  act: number
  about: string[]
  art: KitArt
}

export type KitTrailerBeat = { moment: string; line: string }

export type KitTrailer = { tagline: string; beats: KitTrailerBeat[] }

/**
 * A written exception to the tier's cap for one dimension. Complexity past the
 * budget is allowed only when someone has said, in the spec, why it is worth it.
 */
export type KitAllowance = { dimension: string; max: number; reason: string }

export type PlaybookKitSpec = {
  /** Kebab-case slug: the storage namespace and the admin route. */
  id: string
  /** The Conductor project this playbook's tasks and art are tagged to. */
  conductorSlug: string
  title: string
  tagline: string
  /** The dramatic question, in one sentence. */
  premise: string
  tier: PlaybookTier
  /** Where the game itself is played, once it has a route. */
  route?: string
  /** Scoped daisyUI theme the console frame wears (default `forge`). */
  theme?: string
  keyArt: KitArt
  acts: KitAct[]
  meters: KitMeter[]
  factions: KitFaction[]
  cast: KitCastMember[]
  reveals: KitReveal[]
  endings: KitEnding[]
  moments: KitMoment[]
  trailer: KitTrailer
  allowances?: KitAllowance[]
  /** Every unpainted picture carries a `prompt` (held by verifyPlaybookArtPrompts). */
  artPromptsComplete?: boolean
}
