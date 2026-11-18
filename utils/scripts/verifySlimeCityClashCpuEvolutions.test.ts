import assert from 'node:assert/strict'
import {
  applyClashCommand,
  activateClash,
  canClashActivate,
  canClashPlay,
  clashEffectivePlayCost,
  clashCardText,
  clashPower,
  CLASH_CPU_TWO_SLOT_MARGIN,
  chooseClashCpu,
  chooseClashCpuPlay,
  createClash,
  endClashTurn,
  nextClashStrike,
  playClash,
  strikeClash,
  type ClashUnit,
} from '../slimeCity/clash'
import { CLASH_EVOLUTIONS } from '../slimeCity/clashEvolutions'
import { cardById, type Side } from '../slimeCity/prototypes'

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
  // Isolate the play heuristic from the one-time faction power (every Clash
  // side has one since 2026-11-10; five full alleys overcharge it).
  s.powersUsed = { player: ['catgirls'], enemy: ['riot'] }
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
  assert.deepEqual(
    chooseClashCpu(s, 'player'),
    cmd,
    'identical board, identical choice',
  )
}

// Two mercenary upgrades used to discard their level-two tactical job. The
// auction golem now keeps pricing down a surviving tenant after its L3 hit,
// while an empty lot still bills the rival boss. The spark midwife still
// shares VOLATILE before its separate death payoff. Occupancy remains the
// counterplay, and both commands replay exactly.
{
  const id = 'merc-auction-golem'
  const occupied = createClash('catgirls', 'riot', 202616)
  occupied.round = 5
  occupied.hands.player = [id]
  occupied.levels.player[id] = 3
  occupied.units = [fighter('enemy', 2, 90, { hp: 12, maxHp: 12, attack: 6 })]
  occupied.powersUsed = { player: ['catgirls'], enemy: ['riot'] }
  const golemChoice = chooseClashCpu(occupied, 'player')
  assert.equal(golemChoice.t, 'play')
  if (golemChoice.t === 'play') assert.equal(golemChoice.card, id)
  assert.deepEqual(
    chooseClashCpu(occupied, 'player'),
    golemChoice,
    'the evolved golem has a deterministic CPU valuation',
  )
  const sold = playClash(occupied, 'player', id, 2)
  const tenant = sold.units.find((unit) => unit.uid === 90)!
  assert.equal(tenant.hp, 8, 'the occupied lot takes the authored L3 hit')
  assert.equal(
    clashPower(sold, tenant),
    4,
    'a surviving tenant remains priced down by the L2 job',
  )
  assert.equal(sold.boss.enemy, occupied.boss.enemy)
  assert.deepEqual(playClash(occupied, 'player', id, 2), sold)
  assert.ok(clashCardText(cardById(id), 3).includes('pierce 4 across'))

  const empty = structuredClone(occupied)
  empty.units = []
  const foreclosed = playClash(empty, 'player', id, 2)
  assert.equal(foreclosed.boss.enemy, empty.boss.enemy - 3)
  assert.deepEqual(playClash(empty, 'player', id, 2), foreclosed)
}
{
  const id = 'merc-spark-midwife'
  const s = createClash('catgirls', 'riot', 202617)
  s.round = 5
  s.hands.player = [id]
  s.levels.player[id] = 3
  s.units = [fighter('player', 1, 91), fighter('player', 3, 93)]
  s.powersUsed = { player: ['catgirls'], enemy: ['riot'] }
  assert.deepEqual(chooseClashCpu(s, 'player'), {
    t: 'play',
    side: 'player',
    card: id,
    lane: 2,
  })
  const brainstorm = playClash(s, 'player', id, 2)
  for (const uid of [91, 93])
    assert.ok(
      brainstorm.units
        .find((unit) => unit.uid === uid)!
        .keywords.includes('volatile'),
      'Brainstorm keeps Ideas Are Catching for ally ' + uid,
    )
  assert.deepEqual(playClash(s, 'player', id, 2), brainstorm)

  const isolated = structuredClone(s)
  isolated.units = []
  const alone = playClash(isolated, 'player', id, 2)
  assert.deepEqual(
    alone.units
      .filter((unit) => unit.keywords.includes('volatile'))
      .map((unit) => unit.cardId),
    [id],
    'an isolated midwife has nobody else to prime',
  )
}

// Broken Halo used to drop its L2 Second-Hand Grace at L3, so the evolved
// halo did nothing for the crew until its wearer fell. The miracle is now
// an extra payoff: a living wearer's landed hit still heals both
// neighbors, a stunned wearer heals nobody, and the strike replays exactly.
{
  const id = 'merc-broken-halo'
  const s = createClash('catgirls', 'riot', 202618)
  s.round = 5
  s.active = 'player'
  s.phase = 'attack'
  s.cursor = 0
  s.powersUsed = { player: ['catgirls'], enemy: ['riot'] }
  s.units = [
    fighter('player', 1, 81, { hp: 5, attacked: true }),
    fighter('player', 2, 82, {
      gear: [id],
      gearLevels: { [id]: 3 },
      keywords: ['leech'],
    }),
    fighter('player', 3, 83, { hp: 5, attacked: true }),
    fighter('enemy', 2, 84, { hp: 20, maxHp: 20, armor: 0 }),
  ]
  assert.equal(nextClashStrike(s, 'player'), 2)
  const graced = strikeClash(s, 'player')
  for (const uid of [81, 83])
    assert.equal(
      graced.units.find((unit) => unit.uid === uid)!.hp,
      6,
      'One Last Miracle keeps Second-Hand Grace for neighbor ' + uid,
    )
  assert.deepEqual(strikeClash(s, 'player'), graced, 'the hit replays')
  assert.ok(
    clashCardText(cardById(id), 3).includes('Hit: heal adjacent allies 1'),
  )

  const stunned = structuredClone(s)
  stunned.units.find((unit) => unit.uid === 82)!.rooted = true
  const quiet = strikeClash(stunned, 'player')
  for (const uid of [81, 83])
    assert.equal(
      quiet.units.find((unit) => unit.uid === uid)!.hp,
      5,
      'a stunned wearer spills no grace',
    )
}

// A situational L3 still chooses by the *actual* board: one wounded
// friend wants a clinic payoff; several wounded friends want the ward.
for (const wounded of [1, 3]) {
  const s = createClash('catgirls', 'riot', 518 + wounded)
  s.round = 5
  s.hands.player = ['mutual-aid']
  s.levels.player['mutual-aid'] = 3
  s.powersUsed = { player: ['catgirls'], enemy: ['riot'] }
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
  s.powersUsed = { player: ['riot'], enemy: ['catgirls'] }
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

// Thundersaur-style investment: the Dreadnought must survive a *complete*
// round to become a growing storm. No level-2 growth, and no RNG or enemy
// hand peeking. Its smaller L3 starting hull is deliberate counterplay.
{
  const id = 's3-ironjaw-dreadnought'
  const model = createClash('ironjaw', 'riot', 945)
  model.active = 'enemy'
  model.phase = 'attack'
  model.round = 5
  model.units = [
    fighter('player', 2, 50, {
      cardId: id,
      level: 3,
      hp: 9,
      maxHp: 13,
      attack: 5,
    }),
  ]
  const first = endClashTurn(model, 'enemy')
  const grown = first.units.find((u) => u.uid === 50)!
  assert.equal(grown.maxHp, 14, 'surviving the full round grows its hull')
  assert.equal(grown.hp, 10, 'growth does not erase earlier damage')
  assert.equal(grown.attack, 6, 'surviving grows its permanent punch')
  assert.equal(model.units[0]!.maxHp, 13, 'the previous state is immutable')
  assert.deepEqual(
    first,
    endClashTurn(model, 'enemy'),
    'growth replays exactly',
  )

  const earlier = structuredClone(model)
  earlier.units[0]!.level = 2
  const levelTwo = endClashTurn(earlier, 'enemy')
  assert.equal(levelTwo.units[0]!.maxHp, 13, 'L2 still grows only on a hit')
  assert.equal(levelTwo.units[0]!.attack, 5)

  const gone = structuredClone(model)
  gone.units = []
  assert.equal(endClashTurn(gone, 'enemy').units.length, 0)
}

// Roof Phantom's shift is a choice instead of a free turn-start move.
// A tap spends its strike, and roots or occupied alleys deny the escape.
{
  const source = createClash('catgirls', 'riot', 946)
  source.round = 5
  source.active = 'enemy'
  source.phase = 'attack'
  source.units = [
    fighter('player', 2, 61, {
      cardId: 's1-roof-phantom',
      level: 3,
    }),
  ]
  const ready = endClashTurn(source, 'enemy')
  assert.equal(ready.units.find((u) => u.uid === 61)?.lane, 2)
  assert.ok(canClashActivate(ready, 'player', 61))
  const moved = activateClash(ready, 'player', 61)
  assert.equal(moved.units.find((u) => u.uid === 61)?.lane, 1)
  assert.equal(source.units[0]!.lane, 2, 'lane changes are immutable')
  assert.deepEqual(
    moved,
    activateClash(endClashTurn(source, 'enemy'), 'player', 61),
    'the selected relocation replays deterministically',
  )
  const blocked = structuredClone(source)
  blocked.units.push(fighter('player', 1, 62))
  blocked.units.push(fighter('player', 3, 63))
  assert.equal(
    activateClash(endClashTurn(blocked, 'enemy'), 'player', 61).units.find(
      (u) => u.uid === 61,
    )?.lane,
    2,
    'occupied adjacent alleys prevent relocation',
  )
  const rooted = structuredClone(source)
  rooted.units[0]!.rooted = true
  const rootedReady = endClashTurn(rooted, 'enemy')
  assert.equal(canClashActivate(rootedReady, 'player', 61), false)
  assert.equal(
    activateClash(rootedReady, 'player', 61),
    rootedReady,
    'roots prevent activation',
  )
  const exposed = structuredClone(source)
  exposed.units.push(fighter('enemy', 1, 64, { attacked: true }))
  assert.equal(
    activateClash(endClashTurn(exposed, 'enemy'), 'player', 61).units.find(
      (u) => u.uid === 61,
    )?.lane,
    3,
    'a lane with an opposing blocker is not a safe escape',
  )
}

// An Undertow file promotes an existing card in the deck before its bonus
// draw. Upgrades are never generated cards, never touch rival inventory,
// never upgrade themselves, and stop at level three.
{
  const id = 's2-undertow-backwater-iou'
  const s = createClash('undertow', 'ironjaw', 202611)
  s.round = 5
  s.hands.player = [id]
  s.levels.player[id] = 2
  s.decks.player = ['s1-wiretap-order', 'pipe-seer']
  s.levels.player['pipe-seer'] = 2
  s.units = [fighter('enemy', 2, 40)]
  const snapshot = structuredClone(s)
  assert.ok(canClashPlay(s, 'player', id, 2))
  const played = playClash(s, 'player', id, 2)
  assert.equal(played.levels.player['s1-wiretap-order'], 2)
  assert.equal(played.levels.player[id], 3, 'the played card levels normally')
  assert.equal(played.levels.player['pipe-seer'], 2)
  assert.deepEqual(s, snapshot, 'the original deck and levels are immutable')
  assert.deepEqual(playClash(s, 'player', id, 2), played, 'promotion replays')
  assert.ok(clashCardText(cardById(id), 2).includes('level up'))
  const capped = structuredClone(s)
  capped.levels.player['s1-wiretap-order'] = 3
  capped.levels.player['pipe-seer'] = 3
  const result = playClash(capped, 'player', id, 2)
  assert.equal(
    result.levels.player['pipe-seer'],
    3,
    'promotion is level-capped',
  )
}

// A Bloodfairy encore is free only after gathering a crowd, and cannot
// be used as an unbounded combo engine. No free play after attack begins.
{
  const id = 's3-bloodfairies-feedback-burst'
  const s = createClash('bloodfairies', 'ironjaw', 202612)
  s.round = 5
  s.hands.player = [id]
  s.levels.player[id] = 3
  s.units = [
    fighter('player', 0, 50),
    fighter('player', 4, 51),
    fighter('enemy', 2, 52),
  ]
  const before = structuredClone(s)
  assert.equal(clashEffectivePlayCost(s, 'player', cardById(id)), 0)
  const played = playClash(s, 'player', id, 2)
  assert.equal(played.plays.player, 0)
  assert.equal(played.freePlays?.player, 1)
  assert.ok(played.units.find((u) => u.uid === 52)!.hp < 12)
  assert.deepEqual(s, before)
  assert.deepEqual(playClash(s, 'player', id, 2), played)
  assert.ok(clashCardText(cardById(id), 3).includes('Free once per turn'))
  assert.ok(
    clashEffectivePlayCost(played, 'player', cardById(id)) > 0,
    'second free play in same turn is forbidden',
  )
  const noCrowd = structuredClone(s)
  noCrowd.units = [fighter('enemy', 2, 52)]
  assert.ok(clashEffectivePlayCost(noCrowd, 'player', cardById(id)) > 0)
  const spent = structuredClone(s)
  spent.phase = 'attack'
  assert.equal(canClashPlay(spent, 'player', id, 2), false)
}

// Big-Fish Warrant executes only a damaged heavy fighter under its
// threshold. Full-health, cheap, and token opponents are protected.
{
  const id = 's1-wiretap-order'
  const run = (unit: ClashUnit): ReturnType<typeof createClash> => {
    const s = createClash('undertow', 'ironjaw', 202613)
    s.round = 5
    s.hands.player = [id]
    s.levels.player[id] = 3
    s.units = [unit]
    assert.ok(canClashPlay(s, 'player', id, 2))
    return playClash(s, 'player', id, 2)
  }
  const heavy = fighter('enemy', 2, 60, {
    cardId: 'juggernaut',
    hp: 3,
    maxHp: 12,
  })
  assert.equal(
    run(heavy).units.some((u) => u.uid === 60),
    false,
  )
  assert.ok(
    run({ ...heavy, hp: 12 }).units.some((u) => u.uid === 60),
    'undamaged heavyweight survives',
  )
  assert.ok(
    run({ ...heavy, cardId: 'scrapper' }).units.some((u) => u.uid === 60),
    'cheap fighter is not named in the warrant',
  )
  assert.ok(
    run({ ...heavy, token: true }).units.some((u) => u.uid === 60),
    'summoned echoes cannot be seized',
  )
  assert.ok(clashCardText(cardById(id), 3).includes('wounded'))
}

// A late Rooftop Phantom must keep the L2 open-lane pressure even when
// the L3 activation moves her to safety. A blocker denies the boss shot;
// a free neighbor still permits the reposition. Neither is a free strike.
{
  const id = 's1-roof-phantom'
  const s = createClash('catgirls', 'riot', 202614)
  s.round = 5
  s.phase = 'play'
  s.units = [
    fighter('player', 2, 70, {
      cardId: id,
      level: 3,
      attacked: false,
      fresh: false,
    }),
    fighter('enemy', 4, 71),
  ]
  assert.equal(canClashActivate(s, 'player', 70), true)
  const shifted = activateClash(s, 'player', 70)
  assert.equal(shifted.boss.enemy, s.boss.enemy - 2)
  assert.equal(shifted.units.find((u) => u.uid === 70)?.lane, 1)
  assert.deepEqual(
    applyClashCommand(s, { t: 'activate', side: 'player', uid: 70 }),
    shifted,
    'open-lane rooftop activation replays exactly',
  )
  const blocked = structuredClone(s)
  blocked.units.push(fighter('enemy', 2, 72))
  const escaped = activateClash(blocked, 'player', 70)
  assert.equal(escaped.boss.enemy, blocked.boss.enemy)
  assert.equal(escaped.units.find((u) => u.uid === 70)?.lane, 1)
  const surrounded = structuredClone(blocked)
  surrounded.units.push(fighter('player', 1, 73))
  surrounded.units.push(fighter('player', 3, 74))
  assert.equal(
    activateClash(surrounded, 'player', 70).units.find((u) => u.uid === 70)
      ?.lane,
    2,
    'crowded friendly alleys stop the escape',
  )
}

// A Level 3 Wall-of-Death Rider keeps its open-lane ambush surge but
// still loses the bonus opposite a blocker. The hit-and-run departure
// stays a distinct payoff instead of turning into a generic stat bump.
{
  const id = 's3-riot-riot-bike-messenger'
  const s = createClash('riot', 'catgirls', 202615)
  s.round = 5
  s.hands.player = [id]
  s.levels.player[id] = 3
  s.units = [fighter('enemy', 4, 75)]
  assert.equal(canClashPlay(s, 'player', id, 2), true)
  const surge = playClash(s, 'player', id, 2)
  const rider = surge.units.find((u) => u.cardId === id)!
  assert.equal(rider.surge, 2)
  assert.ok(
    CLASH_EVOLUTIONS[id]![3].abilities.some(
      (ability) =>
        ability.when === 'strike' &&
        ability.do.some((action) => action.do === 'retreat'),
    ),
    'the upgraded rider still retreats after striking',
  )
  assert.deepEqual(
    applyClashCommand(s, { t: 'play', side: 'player', card: id, lane: 2 }),
    surge,
    'level-three ambush replays deterministically',
  )
  const counter = structuredClone(s)
  counter.units.push(fighter('enemy', 2, 76))
  assert.equal(
    playClash(counter, 'player', id, 2).units.find((u) => u.cardId === id)
      ?.surge,
    0,
    'an opposing blocker denies the open-lane surge',
  )
  const levelTwo = structuredClone(s)
  levelTwo.levels.player[id] = 2
  assert.equal(
    playClash(levelTwo, 'player', id, 2).units.find((u) => u.cardId === id)
      ?.surge,
    2,
    'the original Level 2 ambush remains intact',
  )
}

// slime-city/t-041: two-slot specials are weighed against the best pair of
// one-slot plays (distinct card and alley) plus a margin, not halved; two-slot
// fighters keep the per-slot rule.
{
  const one = (card: string, lane: number, score: number) => ({
    card,
    lane,
    score,
    slots: 1,
    fighter: true,
  })
  const pair = [one('a', 0, 6), one('b', 1, 4), one('a', 1, 5)]
  const special = (score: number) => ({
    card: 'heavy-spell',
    lane: 2,
    score,
    slots: 2,
    fighter: false,
  })
  const bar = 6 + 4 + CLASH_CPU_TWO_SLOT_MARGIN
  assert.equal(
    chooseClashCpuPlay([...pair, special(bar + 0.5)])?.card,
    'heavy-spell',
  )
  assert.equal(chooseClashCpuPlay([...pair, special(bar - 0.5)])?.card, 'a')
  // With only a weak partner on offer, a special the old halving stranded
  // (10 / 2 < 6) now beats the one strong play plus a filler.
  const thin = [one('a', 0, 6), one('b', 1, 1)]
  assert.equal(chooseClashCpuPlay([...thin, special(10)])?.card, 'heavy-spell')
  const heavyFighter = { ...special(13), card: 'big', fighter: true }
  assert.equal(chooseClashCpuPlay([...pair, heavyFighter])?.card, 'big')
  assert.equal(
    chooseClashCpuPlay([...pair, { ...heavyFighter, score: 11 }])?.card,
    'a',
  )
  // With no one-slot option the best two-slot play is still taken.
  assert.equal(chooseClashCpuPlay([special(1)])?.card, 'heavy-spell')
  assert.equal(chooseClashCpuPlay([]), undefined)
}

// slime-city/t-041: the CPU reads a blast's splash, not just its target.
// A splash:'all' blast ("including your own") into lane 1 would also kill the
// CPU's two 1-HP fighters beside it; the same blast into lane 4 kills an
// equal rival with nobody of its own nearby. Before, both lanes scored the
// same and the CPU took lane 1, wiping out its own line.
{
  const s = createClash('catgirls', 'riot', 511)
  s.round = 5
  s.units = [
    fighter('player', 0, 1, { hp: 1, armor: 0, attack: 4, attacked: true }),
    fighter('player', 2, 2, { hp: 1, armor: 0, attack: 4, attacked: true }),
    fighter('enemy', 1, 3, { hp: 3, armor: 0 }),
    fighter('enemy', 4, 4, { hp: 3, armor: 0 }),
  ]
  s.hands.player = ['merc-unsupervised-demo']
  s.plays.player = 0
  s.powersUsed = { player: ['catgirls'], enemy: ['riot'] }
  assert.equal(cardById('merc-unsupervised-demo').splash, 'all')
  assert.ok(canClashPlay(s, 'player', 'merc-unsupervised-demo', 1))
  const cmd = chooseClashCpu(s, 'player')
  assert.deepEqual(
    cmd,
    { t: 'play', side: 'player', card: 'merc-unsupervised-demo', lane: 4 },
    'a splash:all blast avoids lanes where it would kill its own fighters',
  )
  const after = applyClashCommand(s, cmd)
  assert.equal(
    after.units.filter((u) => u.side === 'player').length,
    2,
    'both CPU fighters survive its own blast',
  )
}

console.log(
  'Slime City CLASH CPU evolved decision-making, heavy gear, distinct faction payoff fixtures PASS',
)
