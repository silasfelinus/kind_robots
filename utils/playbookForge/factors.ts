import { CHECKPOINT_CLASSES } from './calibration'
import type { Blueprint } from './types'

// Every option the forge offers, as data. A row is a console option line:
// label on the left, value on the right, ◀ ▶ to change it. Adding a factor to
// every playbook is one row here plus its term in estimate.ts.

export type ForgeTab =
  'pitch' | 'player' | 'cast' | 'story' | 'rules' | 'endings' | 'save'

export const FORGE_TABS: { id: ForgeTab; label: string; blurb: string }[] = [
  {
    id: 'pitch',
    label: 'Pitch',
    blurb: 'The idea, where it lives and how it is painted.',
  },
  {
    id: 'player',
    label: 'Player',
    blurb: 'Who the player is, and how they become them.',
  },
  {
    id: 'cast',
    label: 'Cast',
    blurb: 'Followers, villains, rivals and the people in between.',
  },
  {
    id: 'story',
    label: 'Story',
    blurb: 'Acts, encounters, quests and the moments worth keeping.',
  },
  {
    id: 'rules',
    label: 'Rules',
    blurb: 'Stats, checks and what happens when a roll goes wrong.',
  },
  {
    id: 'endings',
    label: 'Endings',
    blurb: 'How many fates, and how each one plays out.',
  },
  {
    id: 'save',
    label: 'Save',
    blurb: 'Autosave, slots, rewinds and what survives a run.',
  },
]

type Choice = { value: string; label: string }

export type FactorRow = {
  key: keyof Blueprint
  tab: ForgeTab
  label: string
  help: string
  visible?: (b: Blueprint) => boolean
} & (
  | { kind: 'stepper'; min: number; max: number; step?: number }
  | { kind: 'choice'; options: Choice[] }
  | { kind: 'toggle' }
)

const isBuilder = (b: Blueprint) => b.creator === 'builder'
const hasChecks = (b: Blueprint) => b.checks !== 'none'

export const FACTOR_ROWS: FactorRow[] = [
  {
    key: 'placement',
    tab: 'pitch',
    label: 'Lives in',
    kind: 'choice',
    options: [
      { value: 'admin', label: 'Admin preview' },
      { value: 'play', label: 'Play' },
      { value: 'projects', label: 'Projects' },
    ],
    help: 'Admin preview is private while it is built. Play is the public arcade; Projects lists it with the other works in progress.',
  },
  {
    key: 'tier',
    tab: 'pitch',
    label: 'Scope',
    kind: 'choice',
    options: [
      { value: '', label: 'Auto' },
      { value: 'vignette', label: 'Vignette' },
      { value: 'standard', label: 'Standard' },
      { value: 'saga', label: 'Saga' },
    ],
    help: 'Auto picks the smallest tier everything fits. Locking a tier turns every cap into a hard limit.',
  },
  {
    key: 'checkpoint',
    tab: 'pitch',
    label: 'Checkpoint',
    kind: 'choice',
    options: CHECKPOINT_CLASSES.map((c) => ({ value: c.id, label: c.label })),
    help: 'The render lane decides seconds per picture: Illustrious ~23 s, SDXL ~37 s, Krea 2 ~82 s, Flux 2 ~13 min.',
  },
  {
    key: 'artStyles',
    tab: 'pitch',
    label: 'Art styles',
    kind: 'stepper',
    min: 1,
    max: 4,
    help: 'Every picture is rendered once per style. Ecotone offers 2–4; most playbooks ship one.',
  },
  {
    key: 'creator',
    tab: 'player',
    label: 'Opening',
    kind: 'choice',
    options: [
      { value: 'fixed', label: 'Fixed hero' },
      { value: 'roster', label: 'Pick a hero' },
      { value: 'builder', label: 'Build a hero' },
    ],
    help: 'Fixed: one protagonist (Zuzu). Pick: choose from a roster (Warp captains, Ecotone archetypes). Build: combine factors (Prom of Doom forms and elements).',
  },
  {
    key: 'rosterSize',
    tab: 'player',
    label: 'Heroes to pick from',
    kind: 'stepper',
    min: 2,
    max: 16,
    visible: (b) => b.creator === 'roster',
    help: 'Each hero needs a portrait set, a bio and a reason to replay as them.',
  },
  {
    key: 'creatorFactors',
    tab: 'player',
    label: 'Factors to build from',
    kind: 'stepper',
    min: 1,
    max: 5,
    visible: isBuilder,
    help: 'Archetype, background, power, look, home… each factor is one choice in the opening creator.',
  },
  {
    key: 'optionsPerFactor',
    tab: 'player',
    label: 'Options per factor',
    kind: 'stepper',
    min: 2,
    max: 12,
    visible: isBuilder,
    help: 'Options multiply when portraits are painted per combination.',
  },
  {
    key: 'portraits',
    tab: 'player',
    label: 'Hero portraits',
    kind: 'choice',
    options: [
      { value: 'per-option', label: 'Per option' },
      { value: 'per-combination', label: 'Per combination' },
      { value: 'on-demand', label: 'Painted on demand' },
      { value: 'code-drawn', label: 'Drawn in code' },
    ],
    help: 'Per option paints a tile per choice. Per combination paints every finished hero (6 × 8 = 48 for Prom). On demand paints the player’s own hero when they finish creating.',
  },
  {
    key: 'expressions',
    tab: 'player',
    label: 'Poses per hero',
    kind: 'stepper',
    min: 0,
    max: 6,
    help: 'Extra emotion or action portraits beyond the first.',
  },
  {
    key: 'nameAndPronouns',
    tab: 'player',
    label: 'Name and pronouns',
    kind: 'toggle',
    visible: (b) => b.creator !== 'fixed',
    help: 'The player names their hero and chooses pronouns (Ecotone, Crystal Street).',
  },
  {
    key: 'playerUpload',
    tab: 'player',
    label: 'Upload own portrait',
    kind: 'toggle',
    visible: (b) => b.creator !== 'fixed',
    help: 'The player may use their own picture, kept as a private ArtImage (Ecotone). One more system to build and moderate.',
  },
  {
    key: 'identityAffectsOdds',
    tab: 'player',
    label: 'Identity changes odds',
    kind: 'toggle',
    visible: (b) => b.creator !== 'fixed',
    help: 'On: who you are changes what you can do (Prom powers, Desks jobs). Off: identity is cosmetic (Ecotone), so no choice is a trap.',
  },
  {
    key: 'followers',
    tab: 'cast',
    label: 'Followers',
    kind: 'stepper',
    min: 0,
    max: 60,
    help: 'Companions who travel with the player, or the pool a seeded roster deals roles from (Prom of Doom: 48). Each needs a portrait, a voice and a moment of their own.',
  },
  {
    key: 'partySize',
    tab: 'cast',
    label: 'Party size',
    kind: 'stepper',
    min: 0,
    max: 6,
    visible: (b) => b.followers > 0,
    help: 'How many followers come along at once (Warp away teams: 0–3).',
  },
  {
    key: 'followerExpressions',
    tab: 'cast',
    label: 'Poses per follower',
    kind: 'stepper',
    min: 0,
    max: 6,
    visible: (b) => b.followers > 0,
    help: 'Emotion portraits for each follower.',
  },
  {
    key: 'followerQuestSteps',
    tab: 'cast',
    label: 'Follower quest steps',
    kind: 'stepper',
    min: 0,
    max: 6,
    visible: (b) => b.followers > 0,
    help: 'Each follower brings a personal quest that travels the map (Space Couch crew quests). The party chosen decides where the story goes.',
  },
  {
    key: 'partyAdventureSteps',
    tab: 'story',
    label: 'Party adventure steps',
    kind: 'stepper',
    min: 0,
    max: 6,
    visible: (b) => b.partySize > 1,
    help: 'Every combination of followers gets an adventure of its own between the main beats. Twelve crew in threes is 220 parties, so each step here is 220 scenes.',
  },
  {
    key: 'villains',
    tab: 'cast',
    label: 'Villains',
    kind: 'stepper',
    min: 1,
    max: 22,
    help: 'Each villain needs a reveal and an ending of their own, not just a final confrontation.',
  },
  {
    key: 'villainPerRun',
    tab: 'cast',
    label: 'New villain each run',
    kind: 'toggle',
    visible: (b) => b.villains > 1,
    help: 'The seed draws the principal villain (Warp: one of eight). Replay value, but every villain needs a full arc.',
  },
  {
    key: 'figures',
    tab: 'cast',
    label: 'Other figures',
    kind: 'stepper',
    min: 0,
    max: 24,
    help: 'Named people who matter without joining the party.',
  },
  {
    key: 'factions',
    tab: 'cast',
    label: 'Factions',
    kind: 'stepper',
    min: 0,
    max: 15,
    help: 'Rival groups whose standing changes what the player can do.',
  },
  {
    key: 'romances',
    tab: 'cast',
    label: 'Romances',
    kind: 'stepper',
    min: 0,
    max: 50,
    help: 'Optional, player-chosen, hidden when the romance setting is off. Three scenes each.',
  },
  {
    key: 'acts',
    tab: 'story',
    label: 'Acts',
    kind: 'stepper',
    min: 1,
    max: 5,
    help: 'The big turns of the story.',
  },
  {
    key: 'chaptersPerAct',
    tab: 'story',
    label: 'Chapters per act',
    kind: 'stepper',
    min: 1,
    max: 12,
    help: 'Days, lands, floors or nights inside each act.',
  },
  {
    key: 'encounters',
    tab: 'story',
    label: 'Encounters',
    kind: 'stepper',
    min: 3,
    max: 400,
    step: 5,
    help: 'Authored scenes the player meets. The biggest single driver of words and pictures.',
  },
  {
    key: 'choicesPerEncounter',
    tab: 'story',
    label: 'Choices per encounter',
    kind: 'stepper',
    min: 2,
    max: 4,
    help: 'Every choice needs an outcome per tier of the outcome model.',
  },
  {
    key: 'quests',
    tab: 'story',
    label: 'Quests',
    kind: 'stepper',
    min: 0,
    max: 100,
    help: 'Multi-step goals that span encounters (Emperor petitions, Warp missions).',
  },
  {
    key: 'questSteps',
    tab: 'story',
    label: 'Steps per quest',
    kind: 'stepper',
    min: 1,
    max: 5,
    visible: (b) => b.quests > 0,
    help: 'Emperor’s missions run two steps.',
  },
  {
    key: 'locations',
    tab: 'story',
    label: 'Places on the map',
    kind: 'stepper',
    min: 0,
    max: 60,
    help: 'Star systems, districts or towns the story travels between, each with an establishing scene.',
  },
  {
    key: 'reveals',
    tab: 'story',
    label: 'Reveals',
    kind: 'stepper',
    min: 0,
    max: 16,
    help: 'Secrets that change how a character or faction reads.',
  },
  {
    key: 'moments',
    tab: 'story',
    label: 'Scrapbook moments',
    kind: 'stepper',
    min: 0,
    max: 80,
    help: 'Cinematic beats the scrapbook keeps. The trailer is cut from these.',
  },
  {
    key: 'trailerBeats',
    tab: 'story',
    label: 'Trailer beats',
    kind: 'stepper',
    min: 0,
    max: 8,
    help: 'Spoiler-free shots for the title trailer. Free: they reuse moments.',
  },
  {
    key: 'stats',
    tab: 'rules',
    label: 'Player stats',
    kind: 'stepper',
    min: 0,
    max: 6,
    help: 'Numbers checks roll against. Every visible stat costs attention.',
  },
  {
    key: 'meters',
    tab: 'rules',
    label: 'Resource meters',
    kind: 'stepper',
    min: 0,
    max: 5,
    help: 'Supplies, standing, time: anything else on screen at all times.',
  },
  {
    key: 'checks',
    tab: 'rules',
    label: 'Skill checks',
    kind: 'choice',
    options: [
      { value: 'none', label: 'Choice only' },
      { value: '2d6', label: '2d6 vs target' },
      { value: 'percent', label: 'Percent forecast' },
      { value: 'd20', label: 'd20' },
      { value: 'cards', label: 'Card draw' },
    ],
    help: '2d6 plus a stat against a target, with natural 2 and 12 overrides, is the house standard in five playbooks. Emperor and Warp roll a shown percentage from the party’s stats.',
  },
  {
    key: 'visibleOdds',
    tab: 'rules',
    label: 'Show the target',
    kind: 'toggle',
    visible: hasChecks,
    help: 'The player sees what they need before they roll.',
  },
  {
    key: 'outcomes',
    tab: 'rules',
    label: 'Outcome tiers',
    kind: 'choice',
    options: [
      { value: 'pass-fail', label: 'Pass / fail' },
      { value: 'three-tier', label: 'Success / mixed / fail' },
      { value: 'four-tier', label: 'Triumph to disaster' },
      { value: 'five-tier', label: 'Great to refusal' },
    ],
    help: 'Each tier is written text for every choice. Emperor, Prom and Warp ship four tiers (triumph, success, partial, failure); Warp’s plan asks for five.',
  },
  {
    key: 'failForward',
    tab: 'rules',
    label: 'Always interesting',
    kind: 'toggle',
    help: 'Failure branches the story with a cost instead of ending a thread. About a third more outcome text.',
  },
  {
    key: 'outcomeArt',
    tab: 'rules',
    label: 'Outcome pictures',
    kind: 'choice',
    options: [
      { value: 'none', label: 'Text only' },
      { value: 'success', label: 'One per choice' },
      { value: 'both', label: 'Success and failure' },
    ],
    help: 'Prom of Doom and Warp paint both sides of a choice.',
  },
  {
    key: 'hiddenLedger',
    tab: 'rules',
    label: 'Hidden moral ledger',
    kind: 'toggle',
    help: 'Unseen marks shape the ending (Shifting Lands marks, Desks grades, Gamebook honor).',
  },
  {
    key: 'endings',
    tab: 'endings',
    label: 'Unique endings',
    kind: 'stepper',
    min: 1,
    max: 92,
    help: 'Each is reachable from a fresh seed, written in full and proven by two seeded playthroughs.',
  },
  {
    key: 'endingMode',
    tab: 'endings',
    label: 'Ending writing',
    kind: 'choice',
    options: [
      { value: 'authored', label: 'Authored' },
      { value: 'families', label: 'Families' },
    ],
    help: 'Families compose endings from parts (Ecotone: leads × lenses × fates). More variety per word, harder to make each one land.',
  },
  {
    key: 'finaleBeats',
    tab: 'endings',
    label: 'Finale beats',
    kind: 'stepper',
    min: 1,
    max: 6,
    help: 'Painted cards in each end sequence.',
  },
  {
    key: 'endingVersions',
    tab: 'endings',
    label: 'Ending versions',
    kind: 'choice',
    visible: (b) => b.creator !== 'fixed',
    options: [
      { value: 'one', label: 'One each' },
      { value: 'per-hero', label: 'Per hero' },
    ],
    help: 'Different openings reach different endings. The hero multiplies them: per hero, every ending is written and painted once for each hero you can start as. The party only colours an ending through follower epilogues.',
  },
  {
    key: 'partyEndings',
    tab: 'endings',
    label: 'Endings per party',
    kind: 'stepper',
    min: 0,
    max: 4,
    visible: (b) => b.partySize > 1,
    help: 'Endings only one combination of followers can reach. Every ending here is written and painted for every party.',
  },
  {
    key: 'villainEndings',
    tab: 'endings',
    label: 'Endings per villain',
    kind: 'stepper',
    min: 0,
    max: 6,
    help: 'Each villain closes the story its own way: beaten, won over, outlasted. Multiplies with the villain count.',
  },
  {
    key: 'followerEpilogues',
    tab: 'endings',
    label: 'Follower epilogues',
    kind: 'toggle',
    visible: (b) => b.followers > 0,
    help: 'Every follower gets a line in every ending.',
  },
  {
    key: 'autosave',
    tab: 'save',
    label: 'Autosave',
    kind: 'toggle',
    help: 'Saves after every choice. Every playbook does.',
  },
  {
    key: 'saveStyle',
    tab: 'save',
    label: 'Save style',
    kind: 'choice',
    options: [
      { value: 'snapshot', label: 'Snapshot' },
      { value: 'ledger', label: 'Replay ledger' },
    ],
    help: 'A snapshot stores the run. A ledger stores the seed and every action and replays them (Shifting Lands): perfect proof and migrations, but rules changes need a pinned version.',
  },
  {
    key: 'unreadable',
    tab: 'save',
    label: 'Unreadable save',
    kind: 'choice',
    options: [
      { value: 'hold', label: 'Hold it' },
      { value: 'warn', label: 'Warn' },
      { value: 'reset', label: 'Start over' },
    ],
    help: 'Hold keeps a save the game cannot read untouched and says so (Emperor, the kit). Start over overwrites it: the player loses the run.',
  },
  {
    key: 'saveSlots',
    tab: 'save',
    label: 'Save slots',
    kind: 'stepper',
    min: 0,
    max: 6,
    help: 'Manual slots beside the autosave (Emperor: 3).',
  },
  {
    key: 'undo',
    tab: 'save',
    label: 'Undo',
    kind: 'choice',
    options: [
      { value: 'none', label: 'None' },
      { value: 'last-choice', label: 'Last choice' },
      { value: 'rewind', label: 'Rewind days' },
    ],
    help: 'Emperor rewinds to any dawn; Ecotone undoes the last choice.',
  },
  {
    key: 'seededRuns',
    tab: 'save',
    label: 'Seeded runs',
    kind: 'toggle',
    help: 'The seed lives in the save, so every run replays exactly and every ending has a proof trace.',
  },
  {
    key: 'shareSeed',
    tab: 'save',
    label: 'Share a run',
    kind: 'toggle',
    visible: (b) => b.seededRuns,
    help: 'A link or daily seed lets friends play the same week (Crystal Street, Shifting Desks Daily Memo).',
  },
  {
    key: 'metaProgress',
    tab: 'save',
    label: 'Keep between runs',
    kind: 'toggle',
    help: 'Scrapbook, endings found and secrets survive a new run.',
  },
  {
    key: 'exportSaves',
    tab: 'save',
    label: 'Export saves',
    kind: 'toggle',
    help: 'Download and restore a save file.',
  },
]

export function rowsFor(tab: ForgeTab, b: Blueprint): FactorRow[] {
  return FACTOR_ROWS.filter(
    (row) => row.tab === tab && (!row.visible || row.visible(b)),
  )
}

/** The value one press of ◀ (-1) or ▶ (+1) gives a row, or null at the end of its range. */
export function stepValue(
  row: FactorRow,
  b: Blueprint,
  direction: 1 | -1,
): Blueprint[keyof Blueprint] | null {
  const current = b[row.key]
  if (row.kind === 'toggle') return !current
  if (row.kind === 'stepper') {
    const next = (current as number) + direction * (row.step ?? 1)
    // A plan already past the stepper's range (Memory Dungeon's 1,600
    // positions) steps from where it is instead of snapping to the cap.
    const max = (current as number) > row.max ? Infinity : row.max
    const clamped = Math.min(max, Math.max(row.min, next))
    return clamped === current ? null : clamped
  }
  const values = row.options.map((o) => o.value)
  const at = values.indexOf(current === null ? '' : String(current))
  const next = values[(at + direction + values.length) % values.length]!
  return (
    row.key === 'tier' && next === '' ? null : next
  ) as Blueprint[keyof Blueprint]
}

export function displayValue(row: FactorRow, b: Blueprint): string {
  const value = b[row.key]
  if (row.kind === 'toggle') return value ? 'On' : 'Off'
  if (row.kind === 'stepper') return String(value)
  return (
    row.options.find((o) => o.value === (value === null ? '' : String(value)))
      ?.label ?? String(value)
  )
}
