// Slime City crews and objective variants (conductor slime-city t-004, t-003):
// six legal ten-card crew decks with distinct keywords and named counters,
// every keyword and special effect resolving as its card text says, mana
// debt, roots, and the optional monster / rout / momentum / sudden-death /
// tiebreak / initiative rules, each replayable from its command record.
import assert from 'node:assert/strict'
import {
  advance,
  CARDS,
  cardById,
  createMatch,
  DEBT_CAP,
  DECK_CREATURES,
  DECK_SIZE,
  deckOf,
  deckProblems,
  DEFAULT_RULES,
  deploy,
  KEYWORDS,
  MONSTER_STATS,
  move,
  observe,
  OVERTIME,
  playerHasInitiative,
  replayMatch,
  ROUT_TARGET,
  RULE_VARIANTS,
  TEAMS,
  trapCapOf,
  type Fighter,
  type Keyword,
  type MatchState,
  type ModeId,
  type Side,
} from '../slimeCity/prototypes'
import { chooseCpuAction } from '../slimeCity/cpu'
import { playHeadless } from '../slimeCity/playtest'

const classicBlackout = (
  team: Parameters<typeof createMatch>[1],
  foe: Parameters<typeof createMatch>[2],
  seed: number,
  rules: Parameters<typeof createMatch>[4] = {},
) => createMatch('blackout', team, foe, seed, { ...rules, classicFog: true })

function fighter(
  over: Partial<Fighter> & Pick<Fighter, 'id' | 'side' | 'x' | 'y'>,
): Fighter {
  return {
    cardId: over.side === 'player' ? 'rat' : 'sprite',
    hp: 5,
    maxHp: 5,
    attack: 1,
    armor: 0,
    ap: 0,
    maxAp: 0,
    hidden: false,
    carryingFlag: false,
    keywords: [],
    burst: 1,
    struck: false,
    rootedUntil: 0,
    ...over,
  }
}

/** A quiet arena: no CPU plays, chosen fighters only. */
function arena(
  mode: ModeId,
  units: Fighter[],
  rules: Parameters<typeof createMatch>[4] = {},
): MatchState {
  const s = createMatch(
    mode,
    'riot',
    'bloodfairies',
    4817,
    mode === 'blackout' ? { ...rules, classicFog: true } : rules,
  )
  s.units = units
  s.mana = 0
  s.enemyMana = 0
  // Round 2 of the turn formats is the CPU's initiative turn: it already
  // spent nothing, and every card is resting so it cannot act.
  s.round = mode === 'bloodrush' ? 2 : 2
  s.cooldowns = {
    player: Object.fromEntries(CARDS.map((c) => [c.id, 999])),
    enemy: Object.fromEntries(CARDS.map((c) => [c.id, 999])),
  }
  return s
}
const at = (s: MatchState, id: number) => s.units.find((u) => u.id === id)

// --- Six legal, distinct crew decks
assert.equal(CARDS.length, TEAMS.length * (DECK_SIZE + 2))
assert.equal(new Set(CARDS.map((c) => c.id)).size, CARDS.length)
assert.equal(new Set(CARDS.map((c) => c.name)).size, CARDS.length)
const crewKeywords = new Map<string, string>()
for (const team of TEAMS) {
  assert.deepEqual(deckProblems(team), [], team.id + ' deck is legal')
  const deck = deckOf(team.id)
  assert.equal(deck.length, DECK_SIZE)
  assert.equal(deck.filter((c) => c.kind === 'creature').length, DECK_CREATURES)
  assert.ok(team.pattern.length > 40, team.id + ' has a play pattern')
  assert.ok(team.counters.length > 40, team.id + ' names its counters')
  assert.equal(cardById(team.signature).signature, true)
  assert.ok(team.trapCap >= 1)
  // The crew's keyword set is its fingerprint: no two crews share one.
  const kws = [
    ...new Set(
      deck.flatMap((c) => [...(c.keywords ?? []), ...(c.grants ?? [])]),
    ),
  ].sort()
  assert.ok(kws.length >= 1, team.id + ' has keywords')
  const key = kws.join(',')
  assert.ok(!crewKeywords.has(key), team.id + ' shares a keyword set')
  crewKeywords.set(key, team.id)
  for (const card of deck) assert.ok(card.text.length > 15, card.id + ' text')
}
// Printed numbers match the rules: damage and healing on the card text
for (const card of CARDS) {
  const dmg = card.text.match(/(\d+) damage/)
  if (dmg && card.effect !== 'chaos' && card.kind !== 'creature')
    assert.equal(Number(dmg?.[1] ?? NaN), card.power ?? 2, card.id + ' damage')
  const heal = card.text.match(/estore (\d+) HP/)
  if (heal)
    assert.equal(Number(heal?.[1] ?? NaN), card.power ?? 2, card.id + ' heal')
}
// Every keyword is used and explained
for (const k of Object.keys(KEYWORDS) as Keyword[]) {
  assert.ok(
    CARDS.some((c) => c.keywords?.includes(k) || c.grants?.includes(k)),
    k + ' is used',
  )
  assert.ok(KEYWORDS[k].text.length > 10)
}
// Illegal decks are named, not silently accepted
const broken = { ...TEAMS[0]!, special: TEAMS[0]!.special.slice(1) }
assert.ok(deckProblems(broken).some((p) => /cards/.test(p)))
assert.ok(
  deckProblems({ ...TEAMS[0]!, creatures: ['lynx', 'mau', 'calico', 'sprite'] })
    .length > 0,
)
// The hand is the crew deck; Undertow keeps two traps armed, others one
const view = observe(
  createMatch('gridiron', 'undertow', 'exchange', 5),
  'player',
)
assert.deepEqual(
  view.hand.map((c) => c.id),
  deckOf('undertow').map((c) => c.id),
)
assert.equal(view.trapCap, 2)
const twoTraps = createMatch('gridiron', 'undertow', 'exchange', 5)
twoTraps.mana = 9
let rigged = deploy(twoTraps, 'tripwire', 4, 1)
rigged = deploy(rigged, 'grate', 5, 2)
assert.equal(rigged.traps.length, 2, 'Undertow arms two traps')
assert.equal(trapCapOf(rigged, 'enemy'), 1)

// --- Keywords
// AMBUSH: the first blow lands +2, later ones do not
const amb = arena('blackout', [
  fighter({
    id: 1,
    side: 'player',
    x: 3,
    y: 3,
    attack: 1,
    keywords: ['ambush'],
  }),
  fighter({ id: 2, side: 'enemy', x: 4, y: 3, hp: 9, maxHp: 9, attack: 0 }),
])
const amb1 = advance(amb)
assert.equal(at(amb1, 2)!.hp, 6, 'ambush 1 + 2')
assert.equal(at(amb1, 1)!.struck, true)
const amb2 = advance(amb1)
assert.equal(at(amb2, 2)!.hp, 5, 'only once')
// Catnip Overdrive rearms a spent ambusher
const cats = createMatch('gridiron', 'catgirls', 'ironjaw', 4817)
cats.mana = 9
const lynx = cats.units.find((u) => u.side === 'player')!
lynx.struck = true
const rearmed = deploy(cats, 'pounce', lynx.x, lynx.y)
assert.equal(at(rearmed, lynx.id)!.struck, false)
assert.equal(at(rearmed, lynx.id)!.ap, lynx.ap + 2)
// REGEN: +1 at the end of each round, up to max
const regen = arena('blackout', [
  fighter({ id: 1, side: 'player', x: 0, y: 0, hp: 2, keywords: ['regen'] }),
  fighter({ id: 2, side: 'enemy', x: 7, y: 7 }),
])
assert.equal(at(advance(regen), 1)!.hp, 3)
// SWARM: +1 attack with a friend beside it
const swarm = arena('blackout', [
  fighter({
    id: 1,
    side: 'player',
    x: 3,
    y: 3,
    attack: 1,
    keywords: ['swarm'],
  }),
  fighter({ id: 3, side: 'player', x: 3, y: 2, attack: 0 }),
  fighter({ id: 2, side: 'enemy', x: 4, y: 3, hp: 9, maxHp: 9, attack: 0 }),
])
assert.equal(at(advance(swarm), 2)!.hp, 7)
swarm.units = swarm.units.filter((u) => u.id !== 3)
assert.equal(at(advance(swarm), 2)!.hp, 8, 'alone: no bonus')
// LEECH: heals 1 when its blow deals damage
const leech = arena('blackout', [
  fighter({
    id: 1,
    side: 'player',
    x: 3,
    y: 3,
    hp: 3,
    attack: 2,
    keywords: ['leech'],
  }),
  fighter({ id: 2, side: 'enemy', x: 4, y: 3, hp: 9, maxHp: 9, attack: 1 }),
])
assert.equal(at(advance(leech), 1)!.hp, 3, 'took 1, leeched 1')
// PIERCE: ignores 1 armor
const pierce = arena('blackout', [
  fighter({
    id: 1,
    side: 'player',
    x: 3,
    y: 3,
    attack: 2,
    keywords: ['pierce'],
  }),
  fighter({
    id: 2,
    side: 'enemy',
    x: 4,
    y: 3,
    hp: 9,
    maxHp: 9,
    armor: 2,
    attack: 0,
  }),
])
assert.equal(at(advance(pierce), 2)!.hp, 8)
// SNARE: the damaged fighter loses its next move
const snare = arena('blackout', [
  fighter({
    id: 1,
    side: 'player',
    x: 3,
    y: 3,
    attack: 1,
    keywords: ['snare'],
  }),
  fighter({
    id: 2,
    side: 'enemy',
    x: 4,
    y: 3,
    hp: 9,
    maxHp: 9,
    attack: 0,
    ap: 2,
    maxAp: 2,
  }),
])
const snared = advance(snare)
assert.ok(observe(snared, 'player').units.find((u) => u.id === 2)!.rooted)
assert.equal(at(snared, 2)!.ap, 0, 'snared: no AP next round')
assert.ok(snared.stats.roots >= 1)
// A rooted lane fighter holds its square for the movement
const lane = arena('gridiron', [
  fighter({ id: 2, side: 'enemy', x: 6, y: 2, rootedUntil: 2 }),
  fighter({ id: 3, side: 'player', x: 0, y: 5, attack: 0 }),
])
assert.equal(at(advance(lane), 2)!.x, 6, 'rooted fighter holds its lane')
lane.units[0]!.rootedUntil = 0
assert.equal(at(advance(lane), 2)!.x, 5)
// VOLATILE: explodes when it falls, chaining into the next fuse
const boom = arena('blackout', [
  fighter({
    id: 1,
    side: 'player',
    x: 3,
    y: 3,
    hp: 1,
    keywords: ['volatile'],
    burst: 2,
  }),
  fighter({
    id: 4,
    side: 'player',
    x: 3,
    y: 4,
    hp: 2,
    keywords: ['volatile'],
    attack: 0,
  }),
  fighter({ id: 2, side: 'enemy', x: 4, y: 3, hp: 9, maxHp: 9, attack: 1 }),
  fighter({ id: 5, side: 'enemy', x: 3, y: 5, hp: 9, maxHp: 9, attack: 0 }),
])
const boomed = advance(boom)
assert.equal(at(boomed, 1), undefined)
assert.equal(at(boomed, 4), undefined, 'friendly fire chains')
assert.equal(boomed.stats.explosions, 2)
assert.equal(at(boomed, 2)!.hp, 9 - 1 - 2, 'blow 1 + explosion 2')
assert.equal(at(boomed, 5)!.hp, 8, 'second fuse hits for 1')
// COLLECT: damaging blows put the other crew in debt, paid from the refill
const debt = arena('blackout', [
  fighter({
    id: 1,
    side: 'player',
    x: 3,
    y: 3,
    attack: 1,
    keywords: ['collect'],
  }),
  fighter({ id: 2, side: 'enemy', x: 4, y: 3, hp: 9, maxHp: 9, attack: 0 }),
])
const owed = advance(debt)
assert.equal(owed.mana, 3)
assert.equal(owed.enemyMana, 2, 'refill 3 minus 1 debt')
assert.deepEqual(owed.debt, { player: 0, enemy: 0 }, 'debt is paid off')
const capped = { ...debt, debt: { player: 0, enemy: 0 } }
capped.units = [
  ...[1, 2, 3].map((i) =>
    fighter({
      id: i,
      side: 'player',
      x: 3,
      y: i,
      attack: 1,
      keywords: ['collect'],
    }),
  ),
  ...[1, 2, 3].map((i) =>
    fighter({
      id: 10 + i,
      side: 'enemy',
      x: 4,
      y: i,
      hp: 9,
      maxHp: 9,
      attack: 0,
    }),
  ),
]
assert.equal(advance(capped).enemyMana, 3 - DEBT_CAP, 'debt caps')
// BLOODRUSH debt comes straight out of the bank
const rushDebt = arena(
  'bloodrush',
  debt.units.map((u) => ({ ...u, rootedUntil: 99 })),
)
rushDebt.enemyMana = 5
assert.equal(advance(rushDebt).enemyMana, 4)
// BULLDOZE: shoves a blocking enemy one square back
const doze = arena('gridiron', [
  fighter({
    id: 1,
    side: 'player',
    x: 4,
    y: 2,
    hp: 9,
    attack: 0,
    ap: 1,
    maxAp: 1,
    keywords: ['bulldoze'],
  }),
  fighter({
    id: 2,
    side: 'enemy',
    x: 5,
    y: 2,
    hp: 9,
    maxHp: 9,
    attack: 0,
    ap: 1,
    maxAp: 1,
  }),
  fighter({ id: 3, side: 'enemy', x: 11, y: 0, attack: 0 }),
])
doze.round = 3
const dozed = advance(doze)
assert.ok(dozed.stats.shoves >= 1)
assert.ok(at(dozed, 1)!.x >= 5, 'bulldozer took the square')

// --- Special effects
const fx = createMatch('gridiron', 'riot', 'bloodfairies', 4817)
fx.mana = 10
fx.units = [
  fighter({ id: 1, side: 'enemy', x: 5, y: 2, hp: 5 }),
  fighter({ id: 2, side: 'enemy', x: 5, y: 3, hp: 5 }),
  fighter({ id: 3, side: 'player', x: 4, y: 2, hp: 5 }),
]
// Confetti Cannon: 2 to the target, 1 to everyone beside it, friends too
const party = deploy(fx, 'confetti', 5, 2)
assert.equal(at(party, 1)!.hp, 3)
assert.equal(at(party, 2)!.hp, 4)
assert.equal(at(party, 3)!.hp, 4, 'friendly fire')
// Moshpit Massacre: enemies only
const fairy = createMatch('gridiron', 'bloodfairies', 'riot', 4817)
fairy.mana = 10
fairy.units = fx.units.map((u) => ({
  ...u,
  side: (u.side === 'enemy' ? 'enemy' : 'player') as Side,
}))
const pit = deploy(fairy, 'mosh', 5, 2)
assert.equal(at(pit, 3)!.hp, 5, 'the moshpit spares friends')
assert.ok(at(pit, 2)!.hp < 5)
// Laser Pointer: roots without damage; a rooted BLACKOUT fighter cannot move
const laserGame = classicBlackout('catgirls', 'riot', 4817)
laserGame.mana = 10
const prey = laserGame.units.find((u) => u.side === 'enemy')!
const lasered = deploy(laserGame, 'laser', prey.x, prey.y)
assert.equal(at(lasered, prey.id)!.ap, 0)
assert.equal(at(lasered, prey.id)!.hp, prey.hp)
// Foreclosure: damage and debt on the target's crew
const bank = createMatch('gridiron', 'exchange', 'riot', 4817)
bank.mana = 10
const debtor = bank.units.find((u) => u.side === 'enemy')!
const foreclosed = deploy(bank, 'foreclosure', debtor.x, debtor.y)
assert.equal(foreclosed.debt.enemy, 2)
// Equipment: +1 attack, granted keywords (refused when already held)
const kit = createMatch('gridiron', 'riot', 'undertow', 4817)
kit.mana = 10
const kid = kit.units.find((u) => u.side === 'player')!
const vest = deploy(kit, 'fusevest', kid.x, kid.y)
assert.equal(vest, kit, 'Riot Rat is already volatile')
const shredKit = createMatch('gridiron', 'catgirls', 'undertow', 4817)
shredKit.mana = 10
const cat = shredKit.units.find((u) => u.side === 'player')!
const clawed = deploy(shredKit, 'shredders', cat.x, cat.y)
assert.equal(at(clawed, cat.id)!.attack, cat.attack + 1)
const collared = deploy(shredKit, 'ninthlife', cat.x, cat.y)
assert.ok(at(collared, cat.id)!.keywords!.includes('regen'))
// Trap riders: roots and debt
const stepped = classicBlackout('catgirls', 'ironjaw', 99)
stepped.traps = [{ x: 5, y: 3, side: 'enemy', damage: 1, roots: true, debt: 2 }]
stepped.units = [
  fighter({ id: 1, side: 'player', x: 6, y: 3, ap: 2, maxAp: 2 }),
  fighter({ id: 2, side: 'enemy', x: 7, y: 7 }),
]
const caught = move(stepped, 1, 5, 3)
assert.equal(at(caught, 1)!.hp, 4)
assert.equal(at(caught, 1)!.ap, 0, 'pinned in place')
assert.equal(caught.debt.player, 2)
assert.equal(move(caught, 1, 4, 3), caught)
// Sonar reveals and disarms within two squares
const sonarGame = classicBlackout('undertow', 'riot', 4817)
sonarGame.mana = 10
sonarGame.units = [
  fighter({ id: 1, side: 'player', x: 3, y: 3 }),
  fighter({ id: 2, side: 'enemy', x: 4, y: 4, hidden: true }),
  fighter({ id: 3, side: 'enemy', x: 7, y: 7, hidden: true }),
]
sonarGame.traps = [{ x: 3, y: 5, side: 'enemy', damage: 2 }]
const pinged = deploy(sonarGame, 'sonar', 3, 3)
assert.equal(at(pinged, 2)!.hidden, false)
assert.equal(at(pinged, 3)!.hidden, true)
assert.equal(pinged.traps.length, 0)

// --- Hidden keywords never leak
const fog = classicBlackout('catgirls', 'undertow', 7)
for (const u of observe(fog, 'enemy').units.filter(
  (x) => x.side === 'player',
)) {
  assert.equal(u.keywords, null)
  assert.equal(u.ambushReady, null)
}
const twin = structuredClone(fog)
for (const u of twin.units)
  if (u.side === 'player') {
    u.keywords = ['volatile', 'collect']
    u.struck = true
  }
assert.deepEqual(observe(twin, 'enemy'), observe(fog, 'enemy'))

// --- t-003 rule variants: all off by default
assert.ok(Object.values(DEFAULT_RULES).every((v) => v === false))
assert.deepEqual(
  createMatch('gridiron', 'riot', 'exchange', 3).rules,
  DEFAULT_RULES,
)
assert.equal(createMatch('gridiron', 'riot', 'exchange', 3).monster, null)
for (const v of RULE_VARIANTS) {
  assert.ok(v.modes.length > 0 && v.text.length > 20)
  assert.ok(v.id in DEFAULT_RULES)
}
// Monster: placed in the centre, blocks squares, swats, and its slayer wins
for (const mode of ['blackout', 'gridiron', 'bloodrush'] as ModeId[]) {
  const m = createMatch(mode, 'riot', 'exchange', 11, { monster: true })
  assert.ok(m.monster)
  assert.equal(m.monster!.hp, MONSTER_STATS[mode].hp)
  assert.ok(Math.abs(m.monster!.x - (m.width - 1) / 2) <= 1)
  assert.ok(
    !(m.monster!.x === m.flag.x && m.monster!.y === m.flag.y),
    'not on the flag',
  )
  assert.ok(observe(m, 'enemy').monster, 'both sides see it')
}
const lair = arena(
  'blackout',
  [
    fighter({
      id: 1,
      side: 'player',
      x: 3,
      y: 3,
      attack: 3,
      ap: 1,
      maxAp: 1,
      hp: 9,
    }),
    fighter({ id: 2, side: 'enemy', x: 7, y: 7 }),
  ],
  { monster: true },
)
lair.monster = { x: 4, y: 3, hp: 2, maxHp: 20, attack: 2, armor: 1 }
assert.equal(move(lair, 1, 4, 3), lair, 'the monster blocks its square')
const slain = advance(lair)
assert.equal(slain.victor, 'player')
assert.equal(slain.winPath, 'monster')
assert.equal(at(slain, 1)!.hp, 7, 'the monster swatted back')
const tough = { ...lair, monster: { ...lair.monster!, hp: 20 } }
const swatted = advance(tough)
assert.equal(swatted.monster!.hp, 18)
assert.equal(swatted.monsterDamage.player, 2)
// Damage spells may target the monster
const zapLair = createMatch('gridiron', 'ironjaw', 'riot', 4817, {
  monster: true,
})
zapLair.mana = 10
zapLair.monster!.hp = 1
const zapped = deploy(zapLair, 'slap', zapLair.monster!.x, zapLair.monster!.y)
assert.equal(zapped.victor, 'player')
assert.equal(zapped.winPath, 'monster')
// Rout (lanes): the first crew to reach the knockout target wins
const routed = arena(
  'gridiron',
  [
    fighter({ id: 1, side: 'player', x: 3, y: 3, attack: 9 }),
    fighter({ id: 2, side: 'enemy', x: 4, y: 3, hp: 1, attack: 0 }),
    fighter({ id: 3, side: 'enemy', x: 11, y: 0, attack: 0 }),
  ],
  { rout: true },
)
routed.stats.knockouts.enemy = ROUT_TARGET.gridiron - 1
const routWin = advance(routed)
assert.equal(routWin.victor, 'player')
assert.equal(routWin.winPath, 'rout')
const noRout = { ...routed, rules: { ...routed.rules, rout: false } }
assert.equal(advance(noRout).victor, null, 'off by default')
// Sudden death: a tie at the limit adds extra time; the next score wins
const tied = arena(
  'gridiron',
  [fighter({ id: 3, side: 'enemy', x: 11, y: 0, attack: 0 })],
  { overtime: true },
)
tied.round = tied.maxRounds
const ot = advance(tied)
assert.equal(ot.victor, null)
assert.equal(ot.overtime, true)
assert.equal(ot.maxRounds, tied.maxRounds + OVERTIME.gridiron)
ot.units.push(fighter({ id: 9, side: 'player', x: 10, y: 4, ap: 2, maxAp: 2 }))
const golden = advance(ot)
assert.equal(golden.victor, 'player')
assert.equal(golden.winPath, 'score')
const plainTie = { ...tied, rules: { ...DEFAULT_RULES } }
assert.equal(advance(plainTie).victor, 'draw')
// Yardage tiebreak: further upfield wins a tied clock
const yards = arena(
  'gridiron',
  [
    fighter({ id: 1, side: 'player', x: 7, y: 0, attack: 0 }),
    fighter({ id: 3, side: 'enemy', x: 10, y: 5, attack: 0 }),
  ],
  { tiebreak: true },
)
yards.round = yards.maxRounds
const measured = advance(yards)
assert.equal(measured.victor, 'player')
assert.equal(measured.winPath, 'time')
// Momentum: after a scoring drought, upfield fighters surge an extra square
const surge = arena(
  'gridiron',
  [
    fighter({ id: 1, side: 'player', x: 6, y: 0, attack: 0, ap: 2, maxAp: 2 }),
    fighter({ id: 2, side: 'player', x: 2, y: 5, attack: 0, ap: 2, maxAp: 2 }),
    fighter({ id: 3, side: 'enemy', x: 11, y: 3, attack: 0 }),
  ],
  { momentum: true },
)
surge.round = 6
surge.lastBreak = 0
const surged = advance(surge)
assert.equal(at(surged, 1)!.x, 8, 'upfield: two squares')
assert.equal(at(surged, 2)!.x, 3, 'own half: one square')
const calm = { ...surge, lastBreak: 5 }
assert.equal(at(advance(calm), 1)!.x, 7, 'no drought, no surge')
// Rush initiative swap
assert.equal(playerHasInitiative({ mode: 'bloodrush', round: 4 }), true)
const swap = { ...DEFAULT_RULES, rushAlternate: true }
assert.equal(
  playerHasInitiative({ mode: 'bloodrush', round: 4, rules: swap }),
  false,
  'every other beat the CPU commits first',
)
assert.equal(
  playerHasInitiative({ mode: 'bloodrush', round: 2, rules: swap }),
  true,
)

// --- Full CPU matches with every variant on: they end, replay exactly and
// the monster path is reachable.
let monsterWins = 0
for (const mode of ['blackout', 'gridiron', 'bloodrush'] as ModeId[]) {
  const rules = Object.fromEntries(
    RULE_VARIANTS.filter((v) => v.modes.includes(mode)).map((v) => [
      v.id,
      true,
    ]),
  )
  for (const [a, b, seed] of [
    ['catgirls', 'exchange', 3],
    ['undertow', 'riot', 8],
    ['bloodfairies', 'ironjaw', 13],
  ] as const) {
    const { state } = playHeadless(mode, a, b, seed, undefined, rules)
    assert.ok(state.victor, mode + ' ends')
    if (state.winPath === 'monster') monsterWins++
    assert.deepEqual(
      replayMatch({ mode, teamId: a, foeId: b, seed, rules }, state.commands),
      state,
      mode + ' replays with variants',
    )
    assert.ok(state.mana >= 0 && state.enemyMana >= 0)
  }
}
assert.ok(monsterWins > 0, 'the CPU can win by slaying the monster')
// The CPU aims spells at a monster it can finish
const finisher = createMatch('gridiron', 'ironjaw', 'riot', 4817, {
  monster: true,
})
finisher.enemyMana = 0
finisher.mana = 10
finisher.monster!.hp = 1
const shot = chooseCpuAction(observe(finisher, 'player'))
assert.ok(shot && shot.t === 'deploy')
assert.equal(shot.x, finisher.monster!.x)

console.log(
  'Slime City crews: six legal decks, nine keywords, special effects, debt, roots and t-003 objective variants PASS',
)
