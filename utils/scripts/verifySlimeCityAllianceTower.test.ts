import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { TEAMS } from '../slimeCity/prototypes'
import { ALLIANCE_DECK_SIZE, allianceStarter } from '../slimeCity/alliance'
import {
  TOWER_FLOORS,
  chooseTowerRoute,
  claimTowerSpoil,
  freshTower,
  leaveEmptyTower,
  resolveTowerBattle,
  startTower,
  towerBosses,
  towerRoutes,
  towerSpoils,
  validTowerSave,
} from '../slimeCity/allianceTower'
import { newSlimeCityStory, validSlimeCityStory } from '../slimeCity/storySave'
import { TOWER_BEATS } from '../slimeCity/towerBeats'
import {
  createClash,
  applyClashCommand,
  chooseClashCpu,
  replayClash,
} from '../slimeCity/clash'
import {
  TOWER_BOUT_KEY,
  clearTowerBout,
  readTowerBout,
  towerBoutMatches,
  validTowerBout,
  writeTowerBout,
  type TowerBoutSave,
} from '../slimeCity/towerBoutSave'

// Narrative coverage is independent of the random faction opponent and the
// four reusable mechanical hazards: each of the 12 floors has two original beats.
assert.equal(TOWER_BEATS.length, TOWER_FLOORS)
assert.equal(
  new Set(TOWER_BEATS.map((beat) => beat.setting)).size,
  TOWER_FLOORS,
)
const authored: { title: string; scene: string }[] = []
for (const beat of TOWER_BEATS) authored.push(...beat.routes)
assert.equal(authored.length, TOWER_FLOORS * 2)
assert.equal(
  new Set(authored.map((route) => route.title)).size,
  authored.length,
)
assert.equal(
  new Set(authored.map((route) => route.scene)).size,
  authored.length,
)

const crews = TEAMS.map((crew) => crew.id)
for (const general of crews) {
  for (const ally of crews.filter((team) => team !== general)) {
    const deck = allianceStarter(general, ally)
    const seed = 31200 + crews.indexOf(general) * 100 + crews.indexOf(ally)
    let run = startTower(deck, seed)
    assert.deepEqual(towerRoutes(run), towerRoutes(run), 'seeded routes')
    assert.equal(run.phase, 'route')
    for (let floor = 0; floor < TOWER_FLOORS; floor++) {
      const choices = towerRoutes(run)
      assert.ok(choices && choices.length === 2)
      assert.notEqual(choices[0]!.id, choices[1]!.id)
      assert.notEqual(choices[0]!.scene, choices[1]!.scene)
      for (const [index, option] of choices.entries()) {
        assert.equal(
          option.scene,
          TOWER_BEATS[floor]!.setting +
            ' ' +
            TOWER_BEATS[floor]!.routes[index]!.scene,
          'each tower branch uses its own authored scene',
        )
        assert.ok(
          option.reward.length > 8,
          'mechanical consequence remains visible',
        )
      }
      assert.equal(chooseTowerRoute(run, 'forged-branch'), run)
      const selected = chooseTowerRoute(run, choices[floor % 2]!.id)
      assert.equal(selected.phase, 'battle')
      assert.equal(selected.floor, floor)
      const bosses = towerBosses(selected)
      for (const hp of [bosses.player, bosses.enemy]) {
        assert.ok(hp >= 20 && hp <= 60, 'Clash boss cap')
      }
      assert.equal(chooseTowerRoute(selected, choices[0]!.id), selected)
      assert.equal(resolveTowerBattle(run, 'player'), run, 'no free wins')
      run = resolveTowerBattle(selected, 'player')
      assert.equal(run.floor, floor + 1)
      assert.equal(run.phase, floor === TOWER_FLOORS - 1 ? 'complete' : 'route')
    }
    const options = towerSpoils(run, freshTower().meta)!
    assert.equal(options.length, 2)
    assert.notEqual(options[0]!.id, options[1]!.id)
    assert.deepEqual(towerSpoils(run, freshTower().meta), options)
    const finished = claimTowerSpoil(
      { run, meta: freshTower().meta },
      options[0]!.id,
    )
    assert.equal(finished.run, null)
    assert.equal(finished.meta.runs, 1)
    assert.equal(finished.meta.bestFloor, 12)
    assert.ok(finished.meta.cinders >= 12)
    assert.ok(finished.meta.cards.includes(options[0]!.id))
    assert.equal(
      claimTowerSpoil(finished, options[0]!.id),
      finished,
      'no double awards',
    )
    const nextRun = startTower(deck, seed + 1, finished.meta)
    assert.ok(nextRun.guard >= 1, 'earned cinders protect future runs')
    const earnedId = options[0]!.id
    if (!deck.cards.includes(earnedId)) {
      assert.ok(
        nextRun.deck.cards.includes(earnedId),
        'legacy card joins next run',
      )
      assert.equal(nextRun.deck.cards.length, ALLIANCE_DECK_SIZE)
    }

    const story = newSlimeCityStory()
    story.tower = finished
    assert.ok(validSlimeCityStory(story), 'account story save validates legacy')
    story.tower = {
      ...finished,
      meta: { ...finished.meta, cards: [...finished.meta.cards, 'forged-id'] },
    }
    assert.ok(!validSlimeCityStory(story), 'unrecognized cards rejected')
  }
}
// Before the 24 authored beats, Tower battle saves embedded one of four
// generic descriptions. All four exact legacy variants must remain loadable,
// while a forged title or scene must still be rejected.
const previousCopy = {
  snare: [
    'THE NEEDLE GATE',
    'A wire net skims the ceiling. The pit announcer asks who packed the bolt cutters.',
  ],
  riot: [
    'THE SHATTERED STANDS',
    'Spectators throw fireworks onto a board nobody remembers building.',
  ],
  rest: [
    'THE PATCHWORK CLINIC',
    'The nurse can stabilize the crew, but the debt collectors are coming up the stairs.',
  ],
  vault: [
    'THE BRASS VAULT',
    'A tempting lockbox sits in the only safe-looking corridor. It is definitely not empty.',
  ],
} as const
const legacyHazards = new Set<string>()
for (let seed = 0; seed < 40; seed++) {
  const ready = startTower(allianceStarter('catgirls', 'undertow'), seed)
  for (const route of towerRoutes(ready)!) {
    const chosen = chooseTowerRoute(ready, route.id)
    const [title, scene] = previousCopy[route.hazard]
    legacyHazards.add(route.hazard)
    const saved = {
      run: {
        ...chosen,
        chosen: { ...route, title, scene },
      },
      meta: freshTower().meta,
    }
    assert.ok(
      validTowerSave(saved),
      'existing in-progress Tower saves survive prose revisions',
    )
    const tampered = structuredClone(saved)
    tampered.run.chosen.scene += ' injected'
    assert.ok(!validTowerSave(tampered), 'unknown saved scene is rejected')
  }
}
assert.equal(legacyHazards.size, 4, 'all four original hazard scenes exercised')

// Losing before clearing one floor is never a free card faucet.
{
  const deck = allianceStarter('catgirls', 'undertow')
  const ready = startTower(deck, 71)
  const route = chooseTowerRoute(ready, towerRoutes(ready)![0]!.id)
  const lost = resolveTowerBattle(route, 'enemy')
  assert.equal(lost.phase, 'failed')
  assert.equal(towerSpoils(lost, freshTower().meta), null)
  const before = { run: lost, meta: freshTower().meta }
  assert.equal(claimTowerSpoil(before, 'fake'), before)
  const recovered = leaveEmptyTower(before)
  assert.equal(recovered.run, null)
  assert.equal(recovered.meta.runs, 1)
  assert.equal(recovered.meta.cards.length, 0)
}

// The actual Clash engine, with both faction powers and identical replay,
// is used for tower floors; no surrogate simulator or account payout.
for (const general of crews.slice(0, 3)) {
  const ally = crews.find((team) => team !== general)!
  const deck = allianceStarter(general, ally)
  const ready = startTower(deck, 23001 + crews.indexOf(general))
  const route = chooseTowerRoute(ready, towerRoutes(ready)![0]!.id)
  let match = createClash(general, route.chosen!.foe, route.seed + 13, {
    alliance: {
      player: route.deck,
      enemy: allianceStarter(
        route.chosen!.foe,
        crews.find((team) => team !== route.chosen!.foe)!,
      ),
    },
    bosses: towerBosses(route),
  })
  const opts = {
    alliance: {
      player: route.deck,
      enemy: allianceStarter(
        route.chosen!.foe,
        crews.find((team) => team !== route.chosen!.foe)!,
      ),
    },
    bosses: towerBosses(route),
  }
  for (let turn = 0; !match.victor && turn < 1800; turn++)
    match = applyClashCommand(match, chooseClashCpu(match, match.active))
  assert.ok(match.victor, 'tower clash resolved')
  const replay = replayClash(
    general,
    route.chosen!.foe,
    route.seed + 13,
    match.commands,
    opts,
  )
  assert.deepEqual(replay.boss, match.boss)
  assert.deepEqual(replay.levels, match.levels)
  assert.deepEqual(replay.powersUsed, match.powersUsed)
  assert.equal(replay.victor, match.victor)
}

// Mid-fight reload: the device-local record (launch + moves) rebuilds the
// exact board, and only for the same account, run and floor.
{
  const general = crews[0]!
  const ally = crews[1]!
  const ready = startTower(allianceStarter(general, ally), 4242)
  const route = chooseTowerRoute(ready, towerRoutes(ready)![1]!.id)
  const foeAlly = crews.find((team) => team !== route.chosen!.foe)!
  const opts = {
    alliance: {
      player: route.deck,
      enemy: allianceStarter(route.chosen!.foe, foeAlly),
    },
    bosses: towerBosses(route),
  }
  const seed = (route.seed + route.floor * 997 + 13) >>> 0
  let live = createClash(general, route.chosen!.foe, seed, opts)
  for (let turn = 0; !live.victor && turn < 40; turn++)
    live = applyClashCommand(live, chooseClashCpu(live, live.active))
  assert.ok(live.commands.length > 0, 'fight is under way')
  const bout: TowerBoutSave = {
    version: 1,
    account: 'guest',
    runSeed: route.seed,
    floor: route.floor,
    launch: {
      kind: 'tower',
      format: 'alliance',
      player: general,
      enemy: route.chosen!.foe,
      seed,
      alliance: route.deck,
      bosses: towerBosses(route),
    },
    commands: [...live.commands],
  }
  assert.ok(validTowerBout(bout))
  const memory = new Map<string, string>()
  const storage = {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => void memory.set(k, v),
    removeItem: (k: string) => void memory.delete(k),
  }
  assert.ok(writeTowerBout(bout, storage))
  const restored = readTowerBout(storage)!
  assert.ok(restored, 'record round-trips')
  const resumed = replayClash(
    restored.launch.player,
    restored.launch.enemy,
    restored.launch.seed,
    restored.commands,
    opts,
  )
  assert.deepEqual(resumed.boss, live.boss, 'resumed board matches live')
  assert.deepEqual(resumed.hands, live.hands)
  assert.deepEqual(resumed.units, live.units)
  assert.equal(resumed.round, live.round)
  assert.ok(towerBoutMatches(restored, route, 'guest'))
  assert.ok(!towerBoutMatches(restored, route, '17'), 'other account')
  assert.ok(
    !towerBoutMatches(restored, { ...route, floor: route.floor + 1 }, 'guest'),
    'other floor',
  )
  assert.ok(!towerBoutMatches(restored, { ...route, seed: 1 }, 'guest'))
  assert.ok(!towerBoutMatches(restored, ready, 'guest'), 'route phase')
  assert.ok(!towerBoutMatches(null, route, 'guest'))
  // Tampered or broken records are ignored, never replayed.
  for (const bad of [
    { ...bout, version: 2 },
    { ...bout, launch: { ...bout.launch, kind: 'reward' } },
    { ...bout, launch: { ...bout.launch, enemy: 'nobody' } },
    { ...bout, commands: [{ t: 'win', side: 'player' }] },
    { ...bout, commands: [{ t: 'play', side: 'player', card: 'x', lane: -1 }] },
    { ...bout, commands: Array(5000).fill({ t: 'pass', side: 'player' }) },
  ])
    assert.ok(!validTowerBout(bad))
  memory.set(TOWER_BOUT_KEY, '{not json')
  assert.equal(readTowerBout(storage), null)
  assert.ok(clearTowerBout(storage))
  assert.equal(readTowerBout(storage), null)
  const throwing = {
    getItem: () => {
      throw new Error('blocked')
    },
    setItem: () => {
      throw new Error('blocked')
    },
    removeItem: () => {
      throw new Error('blocked')
    },
  }
  assert.equal(readTowerBout(throwing), null)
  assert.equal(writeTowerBout(bout, throwing), false)
  assert.equal(clearTowerBout(throwing), false)
  assert.equal(readTowerBout(null), null)
}

// UI route and navigation guard: a tower win should never become a paid
// account reward or accidentally send a player to the City story chapter.
const stage = readFileSync('components/slime-city-tower.vue', 'utf8')
const page = readFileSync('pages/admin/slime-city.vue', 'utf8')
const clash = readFileSync('components/slime-city-clash.vue', 'utf8')
const store = readFileSync('stores/slimeCity.ts', 'utf8')
for (const token of [
  'slime-alliance-tower',
  'slime-tower-route',
  'slime-tower-spoils',
  'slime-tower-begin',
  'KrChoiceHand',
])
  assert.ok(stage.includes(token), token)
assert.ok(page.includes('slime-tower-tab'))
assert.ok(page.includes('<SlimeCityTower'))
assert.ok(clash.includes('BACK TO TOWER'))
assert.ok(store.includes("launch.kind === 'tower'"))
assert.ok(store.includes('tower: towerSave.value'))
// Reload resumes from the device record; RETURN TO BATTLE rebuilds the fight.
assert.ok(
  store.includes("towerRun.value?.phase === 'battle' && !towerBoutSaved()"),
)
assert.ok(store.includes('function resumeTowerBout'))
assert.ok(stage.includes('lab.resumeTowerBout()'))
assert.ok(clash.includes('lab.recordTowerCommands(dealtLaunch'))
assert.ok(clash.includes('lab.clashLaunch.resume'))
console.log(
  'Slime City Alliance Tower: 24 authored route beats, 30 faction pairs, 360 ascending branches, spoils/zero-win protection, Clash replay, mid-fight resume record, saved legacy and UI contracts PASS',
)
