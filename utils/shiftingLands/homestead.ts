export type SpeciesId = 'rabbit' | 'otter' | 'coyote'
export type RoleId = 'homesteader' | 'caretaker' | 'trader'
export type DispositionId = 'helpful' | 'wary' | 'predatory'
export type Approach = 'insight' | 'bearing'
export type HomesteadCard = {
  id: string
  title: string
  art: string
  teaser: string
  narrative: string
  reward: string
  penalty: string
}
export type HomesteadEncounter = {
  locationId: string
  species: SpeciesId
  role: RoleId
  disposition: DispositionId
}
export type HomesteadCheck = {
  locationId: string
  approach: Approach
  dice: [number, number]
  modifier: number
  difficulty: number
  total: number
  success: boolean
  disposition: DispositionId
}
export type HomesteadState = {
  version: 2
  seed: number
  rngState: number
  deck: string[]
  discard: string[]
  revealed: string[]
  active: string | null
  activeEncounter: HomesteadEncounter | null
  lastCheck: HomesteadCheck | null
  health: number
  provisions: number
  journal: string[]
  bossResolved: boolean
}
export const HOMESTEAD_SPECIES: { id: SpeciesId; label: string }[] = [
  { id: 'rabbit', label: 'Rabbit' },
  { id: 'otter', label: 'Otter' },
  { id: 'coyote', label: 'Coyote' },
]
export const HOMESTEAD_ROLES: { id: RoleId; label: string }[] = [
  { id: 'homesteader', label: 'Homesteader' },
  { id: 'caretaker', label: 'Caretaker' },
  { id: 'trader', label: 'Trader' },
]
const DISPOSITIONS: DispositionId[] = ['helpful', 'wary', 'predatory']
export const HOMESTEAD_SKILLS = { insight: 2, bearing: 1 } as const
export const HOMESTEAD_CARDS: HomesteadCard[] = [
  {
    id: 'farm',
    title: 'The Border Farm',
    art: '/zuzu-gamebook/scenes/apple-tree.webp',
    teaser: 'An orchard bends toward the road.',
    narrative:
      'A weathered settler offers Zuzu water and work. A stranger need not be a foe.',
    reward: 'A shared meal restores two provisions.',
    penalty: 'An uneasy bargain costs one provision.',
  },
  {
    id: 'well',
    title: 'The Old Well',
    art: '/zuzu-gamebook/scenes/waterhole.webp',
    teaser: 'Something ripples beneath the stones.',
    narrative:
      'Two travelers disagree over the well. Zuzu may listen before he draws steel.',
    reward: 'Careful observation restores one health.',
    penalty: 'A fall among the stones costs one health.',
  },
  {
    id: 'mission',
    title: 'The Wayside Mission',
    art: '/zuzu-gamebook/scenes/mission.webp',
    teaser: 'A warm lamp burns beyond the fence.',
    narrative:
      'The mission promises refuge. Its Abbess greets every traveler with an immaculate smile.',
    reward: 'A night of shelter restores one health.',
    penalty: 'The troubling bell costs Zuzu one health.',
  },
]
export const BOSS_CARD: HomesteadCard = {
  id: 'abbess',
  title: 'The Abbess',
  art: '/zuzu-gamebook/scenes/abbess-welcome.webp',
  teaser: 'The mission bells ring without a hand.',
  narrative:
    'The kindness of the convent conceals years of disappearances and rituals intended to summon something hungry. Zuzu must confront its keeper.',
  reward: 'The Homestead is liberated. The next land awaits.',
  penalty: 'Zuzu escapes the mission wounded, carrying its dreadful truth.',
}
const IDS = HOMESTEAD_CARDS.map((card) => card.id)
const SPECIES_IDS = HOMESTEAD_SPECIES.map((card) => card.id)
const ROLE_IDS = HOMESTEAD_ROLES.map((card) => card.id)
const nextRandom = (value: number): [number, number] => {
  const next = (Math.imul(value, 1664525) + 1013904223) >>> 0
  return [next, next / 4294967296]
}
const sample = <T>(pool: readonly T[], rng: number): [number, T] => {
  const [next, roll] = nextRandom(rng)
  return [next, pool[Math.floor(roll * pool.length)]!]
}
export function createHomestead(seed: number): HomesteadState {
  const value = Math.max(1, Math.trunc(Math.abs(seed)) || 1)
  let rng = value >>> 0
  const deck = [...IDS]
  for (let i = deck.length - 1; i > 0; i--) {
    const [next, roll] = nextRandom(rng)
    rng = next
    const j = Math.floor(roll * (i + 1))
    ;[deck[i], deck[j]] = [deck[j]!, deck[i]!]
  }
  return {
    version: 2,
    seed: value,
    rngState: rng,
    deck,
    discard: [],
    revealed: [],
    active: null,
    activeEncounter: null,
    lastCheck: null,
    health: 8,
    provisions: 2,
    journal: ['Zuzu enters the Homestead, a stranger carrying an old code.'],
    bossResolved: false,
  }
}
export function isHomesteadState(value: unknown): value is HomesteadState {
  if (!value || typeof value !== 'object') return false
  const state = value as Partial<HomesteadState>
  if (
    state.version !== 2 ||
    !Number.isSafeInteger(state.seed) ||
    !Number.isInteger(state.rngState) ||
    (typeof state.health !== 'number' || !Number.isInteger(state.health)) ||
    (typeof state.provisions !== 'number' || !Number.isInteger(state.provisions)) ||
    !Array.isArray(state.deck) ||
    !Array.isArray(state.discard) ||
    !Array.isArray(state.revealed) ||
    !Array.isArray(state.journal) ||
    typeof state.bossResolved !== 'boolean' ||
    !(state.active === null || typeof state.active === 'string')
  )
    return false
  const all = [...state.deck, ...state.discard, ...(state.active ? [state.active] : [])]
  const participant = state.activeEncounter
  const check = state.lastCheck
  return (
    all.length === IDS.length &&
    new Set(all).size === IDS.length &&
    all.every((id) => typeof id === 'string' && IDS.includes(id)) &&
    state.revealed.every((id) => typeof id === 'string' && IDS.includes(id)) &&
    state.revealed.length === new Set(state.revealed).size &&
    state.journal.every((entry) => typeof entry === 'string') &&
    (state.active ? participant !== null : participant === null) &&
    (!participant ||
      (participant.locationId === state.active &&
        SPECIES_IDS.includes(participant.species) &&
        ROLE_IDS.includes(participant.role) &&
        DISPOSITIONS.includes(participant.disposition))) &&
    (check === null ||
      (IDS.includes(check.locationId) &&
        (check.approach === 'insight' || check.approach === 'bearing') &&
        check.dice.length === 2 &&
        check.dice.every((die) => Number.isInteger(die) && die >= 1 && die <= 6) &&
        Number.isInteger(check.total) &&
        typeof check.success === 'boolean' &&
        DISPOSITIONS.includes(check.disposition))) &&
    state.rngState! >= 0 &&
    state.rngState! <= 4294967295 &&
    state.health >= 0 &&
    state.health <= 8 &&
    state.provisions >= 0 &&
    state.provisions <= 30
  )
}
export function restoreHomestead(value: unknown): HomesteadState | null {
  if (isHomesteadState(value)) return value
  if (!value || typeof value !== 'object') return null
  const old = value as Record<string, unknown>
  if (old.version !== 1) return null
  const fresh = createHomestead(Number(old.seed))
  const candidate: HomesteadState = {
    ...fresh,
    deck: Array.isArray(old.deck) ? old.deck : [],
    discard: Array.isArray(old.discard) ? old.discard : [],
    revealed: Array.isArray(old.revealed) ? old.revealed : [],
    active: typeof old.active === 'string' ? old.active : null,
    health: typeof old.health === 'number' ? old.health : 8,
    provisions: typeof old.provisions === 'number' ? old.provisions : 2,
    journal: Array.isArray(old.journal) ? old.journal : fresh.journal,
    bossResolved: old.bossResolved === true,
  }
  if (candidate.active) {
    const [rng, encounter] = createParticipant(candidate.active, candidate.rngState)
    candidate.rngState = rng
    candidate.activeEncounter = encounter
  }
  return isHomesteadState(candidate) ? candidate : null
}
function createParticipant(locationId: string, start: number): [number, HomesteadEncounter] {
  const [r1, species] = sample(SPECIES_IDS, start)
  const [r2, role] = sample(ROLE_IDS, r1)
  const [r3, disposition] = sample(DISPOSITIONS, r2)
  return [r3, { locationId, species, role, disposition }]
}
export function drawHomestead(state: HomesteadState): HomesteadState {
  if (state.active || state.health <= 0 || !state.deck.length || state.bossResolved) return state
  const [active, ...deck] = state.deck
  const [rngState, activeEncounter] = createParticipant(active!, state.rngState)
  return {
    ...state,
    deck,
    active: active!,
    activeEncounter,
    rngState,
    revealed: [...state.revealed, active!],
    lastCheck: null,
    journal: [...state.journal, `Drew ${HOMESTEAD_CARDS.find((card) => card.id === active)?.title}.`],
  }
}
export function resolveHomestead(state: HomesteadState, approach: Approach): HomesteadState {
  if (!state.active || !state.activeEncounter || state.health <= 0 || state.bossResolved) return state
  if (approach === 'bearing' && state.provisions <= 0) return state
  const card = HOMESTEAD_CARDS.find((candidate) => candidate.id === state.active)!
  const [r1, d1] = nextRandom(state.rngState)
  const [r2, d2] = nextRandom(r1)
  const dice: [number, number] = [Math.floor(d1 * 6) + 1, Math.floor(d2 * 6) + 1]
  const difficulty = approach === 'insight' ? 9 : 7
  const modifier = HOMESTEAD_SKILLS[approach]
  const total = dice[0] + dice[1] + modifier
  const success = total >= difficulty
  const check: HomesteadCheck = {
    locationId: card.id,
    approach,
    dice,
    difficulty,
    modifier,
    total,
    success,
    disposition: state.activeEncounter.disposition,
  }
  const spent = approach === 'bearing' ? 1 : 0
  const health = Math.max(0, Math.min(8, state.health + (success && card.id !== 'farm' ? 1 : success ? 0 : -1)))
  const provisions = Math.max(0, Math.min(30, state.provisions - spent + (card.id === 'farm' ? (success ? 2 : -1) : 0)))
  const species = HOMESTEAD_SPECIES.find((item) => item.id === state.activeEncounter!.species)!.label
  const role = HOMESTEAD_ROLES.find((item) => item.id === state.activeEncounter!.role)!.label
  return {
    ...state,
    active: null,
    activeEncounter: null,
    rngState: r2,
    discard: [...state.discard, card.id],
    lastCheck: check,
    health,
    provisions,
    journal: [
      ...state.journal,
      `${card.title}: ${species} ${role} (${check.disposition}). ${approach} ${dice.join('+')} + ${modifier} = ${total} against ${difficulty}: ${success ? 'success' : 'failure'}.`,
      success ? card.reward : card.penalty,
    ],
  }
}
export function confrontAbbess(state: HomesteadState, choice: 'confront' | 'escape'): HomesteadState {
  if (state.active || state.deck.length || state.health <= 0 || state.bossResolved) return state
  return {
    ...state,
    bossResolved: true,
    health: Math.max(0, state.health - (choice === 'escape' ? 2 : 0)),
    journal: [...state.journal, choice === 'confront' ? BOSS_CARD.reward : BOSS_CARD.penalty],
  }
}
