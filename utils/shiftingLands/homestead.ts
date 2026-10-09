export type HomesteadCard = {
  id: string
  title: string
  art: string
  teaser: string
  narrative: string
  reward: string
  penalty: string
}
export type HomesteadState = {
  version: 1
  seed: number
  deck: string[]
  discard: string[]
  revealed: string[]
  active: string | null
  health: number
  provisions: number
  journal: string[]
  bossResolved: boolean
}
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
const IDS = HOMESTEAD_CARDS.map((c) => c.id)
export function createHomestead(seed: number): HomesteadState {
  const value = Math.max(1, Math.trunc(Math.abs(seed)) || 1)
  let rng = value >>> 0
  const random = () => {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0
    return rng / 4294967296
  }
  const deck = [...IDS]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j]!, deck[i]!]
  }
  return {
    version: 1,
    seed: value,
    deck,
    discard: [],
    revealed: [],
    active: null,
    health: 8,
    provisions: 2,
    journal: ['Zuzu enters the Homestead, a stranger carrying an old code.'],
    bossResolved: false,
  }
}
export function isHomesteadState(v: unknown): v is HomesteadState {
  if (!v || typeof v !== 'object') return false
  const s = v as Partial<HomesteadState>
  if (
    s.version !== 1 ||
    !Number.isSafeInteger(s.seed) ||
    !Number.isInteger(s.health) ||
    !Number.isInteger(s.provisions) ||
    !Array.isArray(s.deck) ||
    !Array.isArray(s.discard) ||
    !Array.isArray(s.revealed) ||
    !Array.isArray(s.journal) ||
    typeof s.bossResolved !== 'boolean' ||
    !(s.active === null || typeof s.active === 'string')
  )
    return false
  const all = [...s.deck, ...s.discard, ...(s.active ? [s.active] : [])]
  return (
    all.length === 3 &&
    new Set(all).size === 3 &&
    all.every((id) => IDS.includes(id)) &&
    s.revealed.every((id) => IDS.includes(id)) &&
    s.journal.every((v) => typeof v === 'string') &&
    s.health >= 0 &&
    s.health <= 8 &&
    s.provisions >= 0 &&
    s.provisions <= 30
  )
}
export function drawHomestead(s: HomesteadState): HomesteadState {
  if (s.active || s.health <= 0 || !s.deck.length || s.bossResolved) return s
  const [active, ...deck] = s.deck
  return {
    ...s,
    active: active!,
    deck,
    revealed: [...s.revealed, active!],
    journal: [
      ...s.journal,
      `Drew ${HOMESTEAD_CARDS.find((c) => c.id === active)?.title}.`,
    ],
  }
}
export function resolveHomestead(
  s: HomesteadState,
  choice: 'help' | 'risk',
): HomesteadState {
  if (!s.active || s.health <= 0 || s.bossResolved) return s
  const card = HOMESTEAD_CARDS.find((c) => c.id === s.active)!
  const positive = choice === 'help'
  const health = Math.max(
    0,
    Math.min(
      8,
      s.health + (positive && card.id !== 'farm' ? 1 : positive ? 0 : -1),
    ),
  )
  const provisions = Math.max(
    0,
    Math.min(
      30,
      s.provisions +
        (positive && card.id === 'farm'
          ? 2
          : !positive && card.id === 'farm'
            ? -1
            : 0),
    ),
  )
  return {
    ...s,
    health,
    provisions,
    discard: [...s.discard, s.active],
    active: null,
    journal: [
      ...s.journal,
      `${card.title}: ${positive ? card.reward : card.penalty}`,
    ],
  }
}
export function confrontAbbess(
  s: HomesteadState,
  choice: 'confront' | 'escape',
): HomesteadState {
  if (s.active || s.deck.length || s.health <= 0 || s.bossResolved) return s
  return {
    ...s,
    bossResolved: true,
    health: Math.max(0, s.health - (choice === 'escape' ? 2 : 0)),
    journal: [
      ...s.journal,
      choice === 'confront' ? BOSS_CARD.reward : BOSS_CARD.penalty,
    ],
  }
}
