// Deepheart: a three-layer party dungeon crawl. Shared shapes for the roster,
// the dungeon content and the run engine. Everything here is plain data so a
// run serializes straight into a save slot.

export type Gender = 'w' | 'm' | 'n'

export type Value = 'kind' | 'bold' | 'greedy' | 'curious' | 'pious' | 'dark'

export type StatKey = 'hp' | 'atk' | 'def' | 'mag' | 'spd' | 'wit'

export type Stats = Record<StatKey, number>

export type Archetype = 'tank' | 'healer' | 'striker' | 'caster' | 'support'

export type RoleId =
  | 'guardian'
  | 'paladin'
  | 'cleric'
  | 'druid'
  | 'warrior'
  | 'monk'
  | 'rogue'
  | 'ranger'
  | 'mage'
  | 'warlock'
  | 'necromancer'
  | 'bard'
  | 'alchemist'
  | 'scholar'
  | 'artificer'

export type Role = {
  id: RoleId
  label: string
  archetype: Archetype
  base: Stats
  skill: { name: string; cooldown: number; text: string }
  perk: string
}

export type Character = {
  id: string
  name: string
  gender: Gender
  ancestry: string
  role: RoleId
  edge: StatKey
  drawnTo: Gender[]
  romanceable: boolean
  likes: [Value, Value]
  dislikes: Value
  blurb: string
  secret: string
  heart: string
  arc: string
  look: string
  scene: string
  partner?: string
  poly?: boolean
}

export type SupportKind =
  'siblings' | 'lovers' | 'exes' | 'rivals' | 'mentor' | 'friends' | 'sworn'

export type Support = {
  a: string
  b: string
  kind: SupportKind
  name: string
  bonus: Partial<Stats>
  scene: string
}

export type SynergyEffect =
  | 'scoutAll'
  | 'scoutHalf'
  | 'puzzleHint'
  | 'gold'
  | 'trapSense'
  | 'fullRest'
  | 'longAnthem'
  | 'twilight'
  | 'venom'
  | 'warmth'

export type Synergy = {
  id: string
  name: string
  text: string
  value: number
  mult: Partial<Stats>
  effects: SynergyEffect[]
}

export type RoomKind =
  'fight' | 'puzzle' | 'treasure' | 'choice' | 'camp' | 'boss'

export type EnemyTrait = 'aoe' | 'drain' | 'poison' | 'crit' | 'weaken' | null

export type EnemyDef = {
  id: string
  name: string
  hp: number
  atk: number
  def: number
  trait: EnemyTrait
  look: string
}

export type ItemDef = {
  id: string
  name: string
  layer: number
  bonus: Partial<Stats>
  text: string
}

export type Effects = {
  gold?: number
  heal?: number
  hurt?: number
  flag?: string
  item?: 'random' | string
  potion?: number
  reveal?: boolean
  affinityAll?: number
  mercy?: number
  deepen?: number
  boon?: Partial<Stats>
}

export type EventRequirement = {
  role?: RoleId[]
  synergy?: string
  flag?: string
  gold?: number
  potion?: number
}

export type EventOption = {
  id: string
  label: string
  hint: string
  tag?: Value
  requires?: EventRequirement
  effects: Effects
  check?: {
    stat: StatKey
    dc: number
    win: Effects
    lose: Effects
    winText: string
    loseText: string
  }
  gamble?: {
    chance: number
    win: Effects
    lose: Effects
    winText: string
    loseText: string
  }
  result: string
}

export type EventDef = {
  id: string
  layer: number
  title: string
  text: string
  moment?: string
  reveal?: string
  options: EventOption[]
}

export type EndingId =
  | 'delver'
  | 'usurper'
  | 'lichbound'
  | 'dawnbringer'
  | 'redemption'
  | 'sealed'
  | 'gilded'
  | 'hearthbound'
  | 'fallen'

export type PartyMember = {
  id: string
  hp: number
  cooldown: number
  down: boolean
  poison: number
  item: string | null
}

export type Enemy = {
  uid: string
  id: string
  name: string
  hp: number
  max: number
  atk: number
  def: number
  trait: EnemyTrait
  boss: boolean
  weak: number
  exposed: number
  poison: number
}

export type CombatState = {
  enemies: Enemy[]
  round: number
  actor: number
  shield: number
  anthem: number
  taunt: string | null
  turret: number
  defending: string[]
  boss: boolean
  mimic: boolean
  parleyTried?: boolean
}

export type PuzzleKind = 'riddle' | 'runes' | 'sequence' | 'scales'

export type PuzzleState = {
  kind: PuzzleKind
  hint: boolean
  riddle?: { id: string; options: string[]; removed: string | null }
  runes?: { lit: boolean[]; moves: number; limit: number }
  sequence?: { glyphs: number[]; entered: number[]; shows: number }
  scales?: {
    weights: number[]
    target: number
    picked: number[]
    hinted: number | null
  }
}

export type TreasureState = {
  mimic: boolean
  trap: boolean
  sensed: boolean
}

export type CampState = { talks: number }

export type Room = {
  kind: RoomKind
  known: boolean
  event?: string
}

export type Notice = { tone: 'good' | 'bad' | 'info' | 'heart'; text: string }

export type HeroSetup = {
  presetId: string
  name: string
  gender: Gender
  drawnTo: Gender[]
  boon: StatKey
}

export type RunPhase =
  | 'map'
  | 'fight'
  | 'puzzle'
  | 'treasure'
  | 'choice'
  | 'camp'
  | 'loot'
  | 'finale'
  | 'court'
  | 'ended'

export type RunState = {
  version: 1
  seed: number
  rng: number
  hero: HeroSetup
  companions: string[]
  party: PartyMember[]
  affinity: Record<string, number>
  partners: string[]
  oaths: string[]
  bonds: Record<string, number>
  boons: Stats
  flags: Record<string, boolean>
  gold: number
  potions: number
  layer: number
  depth: number
  rooms: Room[][]
  phase: RunPhase
  room: Room | null
  combat: CombatState | null
  puzzle: PuzzleState | null
  treasure: TreasureState | null
  camp: CampState | null
  loot: string | null
  seenEvents: string[]
  notices: Notice[]
  log: string[]
  moments: string[]
  reveals: string[]
  ending: EndingId | null
  pendingEnding?: EndingId | null
  courtSelected?: string | null
  courtOutcome?: {
    deity: string
    path: 'bargain' | 'expose' | 'defy'
    success: boolean
    die: number
    modifier: number
    target: number
    epilogue: string
  } | null
  deepening: number
  mercy: number
  turns: number
  fights: number
  puzzlesSolved: number
  puzzlesFailed: number
  chests: number
  mimics: number
  choices: string[]
  riddlesUsed: string[]
  cleanLayer: boolean
  cleanLayers: number
  peakGold: number
}
