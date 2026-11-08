import assert from 'node:assert/strict'
import {
  applyClashCommand,
  canClashPlay,
  chooseClashCpu,
  createClash,
  playClash,
  type ClashUnit,
} from '../slimeCity/clash'
import { CLASH_EVOLUTIONS } from '../slimeCity/clashEvolutions'
import type { Side } from '../slimeCity/prototypes'

const fighter = (
  side: Side,
  lane: number,
  uid: number,
  extras: Partial<ClashUnit> = {},
): ClashUnit => ({
  uid,
  side,
  lane,
  cardId: side === 'player' ? 'lynx' : 'scrapper',
  hp: 12,
  maxHp: 12,
  attack: 6,
  armor: 1,
  keywords: [],
  surge: 0,
  rooted: false,
  ambushUsed: false,
  attacked: false,
  fresh: false,
  gear: [],
  level: 1,
  ...extras,
})

// Previously the CPU never selected two-play utility gear in the
// 1,230-match audit, even when all five alleys already had strong fighters.
// Preserve the choice to invest in an existing unit over replacing a friend.
{
  const s = createClash('catgirls', 'riot', 507)
  s.round = 5
  s.units = Array.from({ length: 5 }, (_, lane) =>
    fighter('player', lane, lane + 1),
  )
  s.hands.player = ['merc-emergency-wings', 'mau']
  s.plays.player = 0
  assert.ok(canClashPlay(s, 'player', 'merc-emergency-wings', 2))
  const cmd = chooseClashCpu(s, 'player')
  assert.deepEqual(cmd, {
    t: 'play',
    side: 'player',
    card: 'merc-emergency-wings',
    lane: 0,
  })
  const played = applyClashCommand(s, cmd)
  assert.ok(
    played.units.some(
      (u) => u.side === 'player' && u.keywords.includes('swarm'),
    ),
    'investment adds SWARM without sacrificing a fighter',
  )
  assert.deepEqual(chooseClashCpu(s), cmd, 'identical board, identical choice')
}

// A situational L3 still chooses by the *actual* board: one wounded
// friend wants a clinic payoff; several wounded friends want the ward.
for (const wounded of [1, 3]) {
  const s = createClash('catgirls', 'riot', 518 + wounded)
  s.round = 5
  s.hands.player = ['mutual-aid']
  s.levels.player['mutual-aid'] = 3
  s.units = Array.from({ length: 4 }, (_, lane) =>
    fighter('player', lane, lane + 1, {
      hp: lane < wounded ? 4 : 12,
    }),
  )
  const cmd = chooseClashCpu(s, 'player')
  assert.equal(cmd.t, 'play')
  if (cmd.t === 'play') {
    assert.equal(
      cmd.choice,
      wounded === 1 ? undefined : 1,
      'the crew decides between pharmacy and emergency ward',
    )
    const played = applyClashCommand(s, cmd)
    assert.deepEqual(
      played,
      applyClashCommand(s, cmd),
      'seeded choice has deterministic command effects',
    )
  }
}

// Evaluating a random-target stage is not a dice roll. Previously this
// advanced the live RNG during lookahead and broke transcript replay.
{
  const id = 's3-riot-bottle-rocket'
  const s = createClash('riot', 'catgirls', 930)
  s.round = 5
  s.hands.player = [id]
  s.levels.player[id] = 2
  s.units = [fighter('enemy', 1, 10), fighter('enemy', 3, 11)]
  const before = structuredClone(s)
  const cmd = chooseClashCpu(s, 'player')
  assert.equal(cmd.t, 'play')
  assert.deepEqual(
    s,
    before,
    'CPU analysis cannot modify the match RNG or board',
  )
}

// Both prior duplicate evolution pairs now diverge in *mechanics*, not
// merely in their names or visual art.
for (const [left, right] of [
  ['s3-bloodfairies-banana-bouncer', 's3-ironjaw-overtime-toll'],
  ['s2-undertow-backwater-iou', 's3-exchange-compound-notice'],
] as const) {
  const a = CLASH_EVOLUTIONS[left]!
  const b = CLASH_EVOLUTIONS[right]!
  assert.notDeepEqual(a[3].abilities, b[3].abilities, left + ' / ' + right)
}

// A Bloodfairy trap becomes a crowd encore; a stunned Undertow debtor
// freezes neighboring witnesses. These are real battle effects.
{
  const id = 's3-bloodfairies-banana-bouncer'
  const s = createClash('bloodfairies', 'ironjaw', 811)
  s.active = 'enemy'
  s.round = 5
  s.phase = 'play'
  s.plays.enemy = 0
  s.hands.enemy = ['juggernaut']
  s.traps = [{ side: 'player', lane: 2, cardId: id, level: 3 }]
  const battle = playClash(s, 'enemy', 'juggernaut', 2)
  assert.notEqual(battle, s)
  assert.ok(
    battle.units.some(
      (u) => u.side === 'player' && u.token && u.keywords.includes('swarm'),
    ),
    'Banana Bouncer L3 starts a new SWARM fighter',
  )
}
{
  const id = 's2-undertow-backwater-iou'
  const s = createClash('undertow', 'riot', 812)
  s.round = 5
  s.hands.player = [id]
  s.levels.player[id] = 3
  s.units = [1, 2, 3, 4].map((lane) =>
    fighter('enemy', lane, 10 + lane, { hp: 20, maxHp: 20 }),
  )
  const battle = playClash(s, 'player', id, 2)
  assert.notEqual(battle, s)
  for (const lane of [1, 2, 3]) {
    assert.ok(
      battle.units.some(
        (u) => u.side === 'enemy' && u.lane === lane && u.rooted,
      ),
      'witness in alley ' + lane + ' is stunned',
    )
  }
  assert.ok(
    battle.units.some((u) => u.side === 'enemy' && u.lane === 4 && !u.rooted),
    'the distant witness remains untouched',
  )
}

console.log(
  'Slime City CLASH CPU evolved decision-making, heavy gear, distinct faction payoff fixtures PASS',
)
