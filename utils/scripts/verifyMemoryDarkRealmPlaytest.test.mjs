import assert from 'node:assert/strict'
import {
  flushTimers as flushTab,
  importMemoryWorld,
  installBrowser,
  openPage as openTab,
  seeded,
  settle,
} from './memoryWorldPlaytestKit.mjs'

// Adversarial Dark Briar (e02) + Unremembered House playtest. Seeded personas
// start from a finished World One save and drive the real Pinia store through
// every action the Other Marches and the mirrored House offer: reflected card
// rounds, roads, 60 encounters, four seals, three bouts, 36 chambers with
// memory trials, logic puzzles, echoes and both House verdicts. They interrupt
// timers, reload the tab and swap checkpoints. After every step a forward
// action must exist, resources stay in bounds, and the saves restore to the
// same expedition; every run's last save must still be finishable.
const M = await importMemoryWorld([
  "export { createPinia, setActivePinia } from 'pinia'",
  "export { useMemoryWorldStore } from '@/stores/memoryWorldStore'",
  "export { BRIAR_TILES, BRIAR_GATE, BRIAR_START, restoreBriarSave } from '@/utils/memoryDungeonWorld'",
  "export { BRIAR_SCENES } from '@/utils/memoryDungeon/scenes'",
  "export { BRIAR_CROSS_MAP_PUZZLES } from '@/utils/memoryDungeonWaves'",
  "export { DARK_BRIAR_SCENES, DARK_BRIAR_SEALS, DARK_BRIAR_WAVES, DARK_BRIAR_WITNESSES, DARK_BRIAR_CLIMAX, darkBriarCanTravel, darkBriarCanChoose, darkBriarHasWitness, restoreDarkBriarProgress } from '@/utils/memoryDungeon/darkBriar'",
  "export { DARK_BRIAR_DUELS, darkBriarCanDuel } from '@/utils/memoryDungeon/darkBriarDuels'",
  "export { DARK_HOUSE_ROOMS, darkHouseEchoes, restoreDarkHouseProgress } from '@/utils/memoryDungeon/darkHouse'",
  "export { DARK_HOUSE_PUZZLES, DARK_HOUSE_TRIALS } from '@/utils/memoryDungeon/darkHouseChallenges'",
  "export { COMBAT_ROOMS } from '@/utils/memoryDungeon/rooms'",
  "export { WEAPONS } from '@/utils/memoryDungeon/combat'",
])

const tab = installBrowser()
const flushTimers = () => flushTab(tab)
const openPage = () => openTab(M, tab)
const clone = (value) => JSON.parse(JSON.stringify(value))
const sorted = (list) => [...list].sort()
const RETREATS = new Set(['return', 'leave-house', 'leave'])

/** A World One save whose gate is open, optionally paused inside its House. */
function worldOneFinale(random, inHouse) {
  const seals = new Set(Object.keys(M.BRIAR_CROSS_MAP_PUZZLES))
  const keys = M.BRIAR_TILES.map((tile) => tile.key).filter(
    (key) => !seals.has(key),
  )
  const sceneChoices = {}
  // Original choices that unlock mirrored callbacks, free House clues and the
  // Courier's compensation, drawn per seed so both branches get played.
  for (const key of ['2,4', '2,5', '4,3', '6,3', '3,5', '4,4', '5,4']) {
    const scene = M.BRIAR_SCENES[key]
    if (scene)
      sceneChoices[key] =
        scene.choices[Math.floor(random() * scene.choices.length)].id
  }
  return {
    ...clone(M.restoreBriarSave(null)),
    waveIndex: 3,
    wavePhase: 'exploring',
    revealed: keys,
    visited: keys,
    player: M.BRIAR_GATE,
    sceneChoices,
    relics: ['bramble-chime'],
    gateOpened: true,
    lanterns: 1 + Math.floor(random() * 3),
    wildflowers: Math.floor(random() * 3),
    hearts: 3,
    room: inHouse ? 'house' : 'map',
    house: inHouse
      ? {
          current: 'HD-01',
          visited: ['HD-01'],
          decisions: {},
          ending: null,
          endingLens: null,
          wardenPassed: false,
          combatOrigin: null,
          chimeClaimed: false,
        }
      : null,
  }
}

function darkDurable(d) {
  return {
    waveIndex: d.waveIndex,
    phase: d.phase,
    revealed: sorted(d.revealed),
    // Restoration marks the revealed start as visited before its round ends.
    visited: sorted(
      new Set([
        ...d.visited,
        ...(d.revealed.includes(M.BRIAR_START) ? [M.BRIAR_START] : []),
      ]),
    ),
    player: d.player,
    sceneChoices: { ...d.sceneChoices },
    sealInspections: sorted(d.sealInspections),
    duels: sorted(d.duels),
    completed: d.completed,
    attempts: d.attempts,
    matched: sorted(d.mapCards.filter((c) => c.matched).map((c) => c.tile)),
    cards: d.mapCards.length,
  }
}

/** Durable progress a reload or checkpoint must not lose or invent. */
function durable(world) {
  const s = world.state
  const h = world.darkHouse
  const strip = (record) =>
    Object.fromEntries(
      Object.entries(record).map(([key, value]) => [
        key,
        {
          ...value,
          note: undefined,
          ...(value.matched ? { matched: sorted(value.matched) } : {}),
        },
      ]),
    )
  return {
    reality: world.activeReality,
    completed: sorted(world.campaign.completed),
    briar: {
      room: s.room,
      roomId: s.roomId,
      lanterns: s.lanterns,
      wildflowers: s.wildflowers,
      hearts: s.hearts,
    },
    dark: darkDurable(world.dark),
    house: {
      active: h.active,
      current: h.current,
      visited: sorted(h.visited),
      decisions: { ...h.decisions },
      trials: strip(h.trials),
      puzzles: strip(h.puzzles),
      spentEchoes: h.spentEchoes,
      ending: h.ending,
    },
    seals: clone(world.crossMapSeals),
  }
}

function roomActions(world, persona) {
  const s = world.state
  if (world.turnLocked || world.loading) return []
  if (world.roomComplete)
    return [{ name: 'finish', run: () => world.finishRoom() }]
  const actions = [{ name: 'leave', run: () => world.leaveRoom() }]
  const combat = s.combat
  if (!combat) return actions
  const cols = combat.state.cols
  const cell = (i) => ({ row: Math.floor(i / cols), col: i % cols })
  const live = combat.state.cards
    .map((card, i) => ({ card, i }))
    .filter(({ card }) => card.pair !== null && !card.matched)
  if (persona.memory && !persona.forgetsInCombat) {
    const pick = world.combatPick
    const first = pick === null ? live[0] : live.find(({ i }) => i === pick)
    const partner = live.find(
      ({ card, i }) => i !== first?.i && card.pair === first?.card.pair,
    )
    if (first && partner)
      return [
        {
          name: 'scout-pair',
          run: () => {
            if (world.combatPick === null) world.combatScout(cell(first.i))
            world.combatScout(cell(partner.i))
          },
        },
      ]
  }
  for (const { i } of live)
    actions.push({ name: 'scout', run: () => world.combatScout(cell(i)) })
  for (const weapon of M.COMBAT_ROOMS[s.roomId].loadout)
    actions.push({
      name: 'strike',
      run: () =>
        world.combatStrike(
          weapon,
          { row: 1, col: 1 },
          M.WEAPONS[weapon].rotations[0],
        ),
    })
  return actions
}

function houseActions(world, persona) {
  const h = world.darkHouse
  const room = h.current
  const actions = [{ name: 'leave-house', run: () => world.leaveDarkHouse() }]
  for (const door of world.darkHouseDoors)
    actions.push({
      name: 'door',
      key: door,
      run: () => world.walkDarkHouse(door),
    })
  const trial = h.trials[room]
  if (world.darkHouseTrial) {
    const faceUp = trial?.faceUp ?? []
    const matched = trial?.matched ?? []
    if (faceUp.length === 2)
      actions.push({
        name: 'turn-over',
        run: () => world.darkHouseTurnCardsOver(),
      })
    if (!world.darkHouseTrialComplete) {
      const open = world.darkHouseCards.filter(
        (face) => !matched.includes(face.id) && !faceUp.includes(face.id),
      )
      if (faceUp.length < 2) {
        const up = world.darkHouseCards.find((face) => face.id === faceUp[0])
        const partner =
          persona.memory && up && open.find((face) => face.pair === up.pair)
        if (partner)
          actions.push({
            name: 'flip',
            smart: true,
            run: () => world.darkHouseFlipCard(partner.id),
          })
        else
          for (const face of open)
            actions.push({
              name: 'flip',
              smart: persona.memory && faceUp.length === 0,
              run: () => world.darkHouseFlipCard(face.id),
            })
      }
      if (!trial?.clue && world.darkHouseEchoCount >= 1)
        actions.push({ name: 'recall', run: () => world.darkHouseUseRecall() })
    }
  }
  const puzzle = world.darkHousePuzzle
  const progress = h.puzzles[room]
  if (puzzle && !progress?.solved) {
    for (const option of puzzle.options)
      if (!progress?.wrong.includes(option.id))
        actions.push({
          name: 'answer',
          smart: option.id === puzzle.answer,
          run: () => world.darkHouseAnswer(option.id),
        })
    if (
      !progress?.hint &&
      !(progress?.wrong.length > 0) &&
      (world.darkHouseEarnedClue || world.darkHouseEchoCount >= 1)
    )
      actions.push({ name: 'hint', run: () => world.darkHouseUseHint() })
  }
  if (!h.decisions[room] && world.darkHouseReady)
    for (const choice of world.darkHouseRoom.choices)
      actions.push({
        name: 'house-choice',
        key: choice.id,
        run: () => world.chooseDarkHouse(choice.id),
      })
  return actions
}

/** Every action a player could take from the current screen. */
function legalActions(world, persona) {
  const s = world.state
  const d = world.dark
  if (world.activeReality === 'e01') {
    if (s.room === 'memory') return roomActions(world, persona)
    return world.canEnterDarkBriar && !world.loading
      ? [{ name: 'enter-dark', run: () => world.enterDarkBriar() }]
      : []
  }
  if (world.darkDuelActive) return roomActions(world, persona)
  const actions = [{ name: 'return', run: () => world.returnToBriar() }]
  if (world.darkHouseOpen) return [...actions, ...houseActions(world, persona)]
  if (d.phase === 'matching') {
    if (world.darkLoading) return actions
    if (!d.mapCards.length) {
      actions.push({ name: 'retry-deck', run: () => world.prepareDarkDeck() })
      return actions
    }
    if (world.darkTurnLocked) return actions
    const open = d.mapCards.filter((card) => !card.matched && !card.flipped)
    const first = d.mapCards.find((card) => card.flipped && !card.matched)
    const partner =
      persona.memory &&
      first &&
      open.find((card) => card.pairId === first.pairId)
    if (partner)
      return [
        ...actions,
        {
          name: 'map-pair',
          run: () => world.darkPickCard(partner.tile),
        },
      ]
    for (const card of open)
      actions.push({
        name: 'map-card',
        run: () => world.darkPickCard(card.tile),
      })
    return actions
  }
  for (const key of d.revealed)
    if (key !== d.player && M.darkBriarCanTravel(d.player, key, d.revealed, d))
      actions.push({ name: 'walk', key, run: () => world.darkWalk(key) })
  const scene = M.DARK_BRIAR_SCENES[d.player]
  if (scene && !d.sceneChoices[d.player])
    for (const choice of scene.choices)
      if (M.darkBriarCanChoose(d, d.player))
        actions.push({
          name: 'scene',
          key: d.player,
          run: () => world.darkChooseScene(choice.id),
        })
  if (M.DARK_BRIAR_SEALS[d.player] && !d.sealInspections.includes(d.player))
    actions.push({
      name: 'seal',
      run: () => world.darkInspectSeal(d.player),
    })
  if (d.waveIndex < 3 && !world.darkLoading)
    actions.push({ name: 'next-wave', run: () => world.nextDarkWave() })
  if (world.canEnterDarkHouseAtCamp)
    actions.push({ name: 'enter-house', run: () => world.enterDarkHouse() })
  if (
    M.DARK_BRIAR_DUELS[d.player] &&
    !world.loading &&
    M.darkBriarCanDuel(d, d.player)
  )
    actions.push({ name: 'duel', run: () => world.startDarkDuel() })
  return actions
}

/** Shortest revealed road from `from` to the nearest tile `wanted` accepts. */
function stepToward(world, wanted) {
  const d = world.dark
  const queue = [d.player]
  const parent = new Map([[d.player, null]])
  while (queue.length) {
    const key = queue.shift()
    if (key !== d.player && wanted(key)) {
      let step = key
      while (parent.get(step) !== d.player) step = parent.get(step)
      return step
    }
    for (const next of d.revealed)
      if (!parent.has(next) && M.darkBriarCanTravel(key, next, d.revealed, d)) {
        parent.set(next, key)
        queue.push(next)
      }
  }
  return null
}

/** Shortest chamber route toward `target` over the House's static exits. */
function houseStepToward(world, target) {
  const start = world.darkHouse.current
  const parent = new Map([[start, null]])
  const queue = [start]
  while (queue.length) {
    const id = queue.shift()
    if (id === target) {
      let step = id
      while (parent.get(step) !== start) step = parent.get(step)
      return step
    }
    for (const next of M.DARK_HOUSE_ROOMS[id].exits)
      if (!parent.has(next)) {
        parent.set(next, id)
        queue.push(next)
      }
  }
  return null
}

function goalDone(world, persona) {
  const d = world.dark
  return (
    d.completed &&
    world.darkHouse.ending !== null &&
    world.darkHouse.visited.includes('HD-36') &&
    (!persona?.completionist ||
      (Object.keys(M.DARK_BRIAR_SCENES).every((key) => d.sceneChoices[key]) &&
        Object.keys(M.DARK_BRIAR_SEALS).every((key) =>
          d.sealInspections.includes(key),
        ) &&
        Object.keys(M.DARK_BRIAR_DUELS).every((key) => d.duels.includes(key))))
  )
}

/** A goal-directed player: finish the reflection and walk out of the House. */
function goalAction(world, persona, actions) {
  const pick = (name, key) =>
    actions.find(
      (action) =>
        action.name === name && (key === undefined || action.key === key),
    )
  const smart = (name) =>
    actions.find((action) => action.name === name && action.smart)
  const d = world.dark
  const h = world.darkHouse
  if (world.activeReality === 'e01' || world.darkDuelActive)
    return pick('enter-dark') ?? pick('finish') ?? pick('scout-pair') ?? null
  if (world.darkHouseOpen) {
    if (h.current === 'HD-36' && h.ending) return pick('leave-house')
    const answer =
      pick('turn-over') ??
      smart('flip') ??
      pick('flip') ??
      (persona.hints ? pick('hint') : null) ??
      smart('answer')
    if (answer) return answer
    if (pick('house-choice')) {
      const id =
        h.current === 'HD-35'
          ? persona.ending
          : persona.random() < 0.5
            ? 'attend'
            : 'refuse'
      return pick('house-choice', id) ?? pick('house-choice')
    }
    const step = houseStepToward(world, h.ending ? 'HD-36' : 'HD-35')
    return pick('door', step) ?? null
  }
  if (d.phase === 'matching')
    return pick('map-pair') ?? pick('retry-deck') ?? null
  const witnessesDone = M.DARK_BRIAR_WITNESSES.every((key) =>
    M.darkBriarHasWitness(d, key),
  )
  if ((persona.completionist || persona.duelist) && pick('duel'))
    return pick('duel')
  if (pick('seal') && persona.completionist) return pick('seal')
  const sceneHere = pick('scene')
  if (
    sceneHere &&
    (persona.completionist ||
      M.DARK_BRIAR_WITNESSES.includes(d.player) ||
      d.player === M.DARK_BRIAR_CLIMAX)
  )
    return actions.filter((action) => action.name === 'scene')[
      Math.floor(persona.random() * 2)
    ]
  if (pick('next-wave')) return pick('next-wave')
  if (pick('enter-house') && !h.ending) return pick('enter-house')
  const boutsLeft = Object.keys(M.DARK_BRIAR_DUELS).filter(
    (key) => d.revealed.includes(key) && !d.duels.includes(key),
  )
  const wanted = (key) =>
    persona.duelist && boutsLeft.length
      ? boutsLeft.includes(key)
      : !witnessesDone
        ? M.DARK_BRIAR_WITNESSES.includes(key) && !M.darkBriarHasWitness(d, key)
        : persona.completionist &&
            ((M.DARK_BRIAR_SCENES[key] &&
              !d.sceneChoices[key] &&
              key !== M.DARK_BRIAR_CLIMAX) ||
              (M.DARK_BRIAR_SEALS[key] && !d.sealInspections.includes(key)) ||
              (M.DARK_BRIAR_DUELS[key] && !d.duels.includes(key)))
          ? true
          : key === M.DARK_BRIAR_CLIMAX && (!d.completed || !h.ending)
  const step =
    stepToward(world, wanted) ??
    stepToward(world, (key) => key === M.DARK_BRIAR_CLIMAX)
  return pick('walk', step) ?? null
}

const BASE = { lanterns: 0, wildflowers: 0 }

function invariants(world, label) {
  const s = world.state
  const d = world.dark
  const h = world.darkHouse
  for (const field of ['lanterns', 'wildflowers', 'attempts'])
    assert.ok(
      Number.isSafeInteger(s[field]) && s[field] >= 0,
      `${label}: Briar ${field} must stay a non-negative integer (got ${s[field]})`,
    )
  assert.ok(
    Number.isSafeInteger(s.hearts) && s.hearts >= 1 && s.hearts <= 3,
    `${label}: hearts must stay within 1..3 (got ${s.hearts})`,
  )
  // Nothing in the reflection spends Briar lanterns or flowers; it can award
  // one Courier compensation and one lantern per bout won, never more.
  assert.ok(
    s.lanterns >= BASE.lanterns &&
      s.lanterns <=
        BASE.lanterns + 1 + Object.keys(M.DARK_BRIAR_DUELS).length &&
      s.lanterns - BASE.lanterns <=
        d.duels.length + (d.sceneChoices['3,4'] === 'shelter' ? 1 : 0),
    `${label}: Briar lanterns ${BASE.lanterns} → ${s.lanterns} with ${d.duels.length} bouts won`,
  )
  assert.ok(
    s.wildflowers >= BASE.wildflowers && s.wildflowers <= BASE.wildflowers + 1,
    `${label}: Briar wildflowers ${BASE.wildflowers} → ${s.wildflowers}`,
  )
  assert.ok(
    Number.isSafeInteger(d.attempts) && d.attempts >= 0,
    `${label}: Dark attempts must stay a non-negative integer`,
  )
  assert.ok(
    d.revealed.includes(d.player) ||
      (d.waveIndex === 0 && d.player === M.BRIAR_START),
    `${label}: the traveller stands on revealed mirrored ground (${d.player})`,
  )
  for (const key of Object.keys(d.sceneChoices))
    assert.ok(d.visited.includes(key), `${label}: answered ${key} unvisited`)
  assert.equal(
    d.completed,
    Boolean(d.sceneChoices[M.DARK_BRIAR_CLIMAX]),
    `${label}: Dark Briar completes exactly when the Warden hears a verdict`,
  )
  if (d.completed)
    assert.ok(
      world.campaign.completed.includes('e02'),
      `${label}: a completed reflection is recorded in the campaign`,
    )
  assert.ok(
    world.darkDuelActive || d.duelReturn === null,
    `${label}: a bout return point (${d.duelReturn}) outlived its bout`,
  )
  for (const key of d.sealInspections)
    assert.ok(
      world.crossMapSeals.mirrorSeen.includes(key),
      `${label}: inspected seal ${key} is missing from the Chronicle`,
    )
  assert.ok(
    h.visited.includes(h.current),
    `${label}: House chamber is in its visit log`,
  )
  assert.ok(
    world.darkHouseEchoCount >= 0 &&
      h.spentEchoes >= 0 &&
      Number.isSafeInteger(h.spentEchoes),
    `${label}: echoes stay non-negative`,
  )
  assert.equal(
    h.ending,
    h.decisions['HD-35'] === 'attend'
      ? 'return'
      : h.decisions['HD-35'] === 'refuse'
        ? 'commons'
        : null,
    `${label}: the House verdict follows the Hearth decision`,
  )
  if (h.visited.includes('HD-36'))
    assert.ok(h.ending, `${label}: the exit opened before a verdict`)
  if (h.ending)
    assert.ok(
      world.darkHouseEndingCopy.length > 40,
      `${label}: an earned verdict has its ending copy`,
    )
  // Restoration lists a trial's matched cards in board order.
  const boardOrder = (house) => {
    const copy = clone(house)
    for (const trial of Object.values(copy.trials)) trial.matched.sort()
    return copy
  }
  assert.deepEqual(
    boardOrder(M.restoreDarkHouseProgress(clone(h))),
    boardOrder(h),
    `${label}: mirrored House progress must survive its own restoration`,
  )
  assert.deepEqual(
    darkDurable(M.restoreDarkBriarProgress(clone(d))),
    darkDurable(d),
    `${label}: Dark Briar progress must survive its own restoration`,
  )
}

// Regression pinned by this battery: a bout lost while the Briar traveller
// was paused in the original House, reloaded before its retreat timer ran,
// used to land the traveller on the Briar map and leave a stale return point.
{
  tab.storage.clear()
  const random = seeded(4242)
  Math.random = random
  tab.storage.set(
    'memoryDungeonBriarCampV1',
    JSON.stringify(worldOneFinale(random, true)),
  )
  const roundTwo = M.DARK_BRIAR_WAVES[1]
  tab.storage.set(
    'memoryDungeonDarkBriarV1',
    JSON.stringify({
      ...clone(M.restoreDarkBriarProgress(null)),
      waveIndex: 1,
      phase: 'exploring',
      mapCards: roundTwo.map((tile, i) => ({
        id: i,
        tile,
        pairId: 8 + Math.floor(i / 2),
        image: `/bout-regression-${Math.floor(i / 2)}.webp`,
        flipped: true,
        matched: true,
      })),
      revealed: M.DARK_BRIAR_WAVES.slice(0, 2).flat(),
      visited: [M.BRIAR_START, '7,3'],
      player: '7,3',
    }),
  )
  let world = await openPage()
  await world.enterDarkBriar()
  await world.startDarkDuel()
  assert.ok(world.darkDuelActive, 'the Unpaid Patrol accepts a bout')
  assert.equal(world.dark.duelReturn, 'house')
  const hearts = world.state.hearts
  const cols = world.state.combat.state.cols
  const cell = (i) => ({ row: Math.floor(i / cols), col: i % cols })
  for (
    let guard = 0;
    world.state.combat.state.outcome === 'fighting' && guard < 200;
    guard++
  ) {
    await flushTimers()
    const live = world.state.combat.state.cards
      .map((card, i) => ({ card, i }))
      .filter(({ card }) => card.pair !== null && !card.matched)
    const first = live[0]
    const miss = live.find(({ card }) => card.pair !== first.card.pair)
    world.combatScout(cell(first.i))
    world.combatScout(cell(miss.i))
  }
  assert.equal(world.state.combat.state.outcome, 'defeat')
  world = await openPage()
  assert.equal(world.state.room, 'house', 'the lost bout returns to the House')
  assert.equal(world.dark.duelReturn, null, 'its return point is retired')
  assert.equal(world.state.hearts, hearts - 1, 'the bout costs one heart')
  assert.ok(!world.dark.duels.includes('7,3'), 'the patrol waits for a rematch')
  world = await openPage()
  assert.equal(world.state.room, 'house', 'a second reload changes nothing')
}

const PERSONAS = [
  {
    name: 'completionist',
    memory: true,
    goal: true,
    completionist: true,
    hints: true,
    ending: 'attend',
    mustFinish: true,
    steps: 2600,
    reload: 0.02,
    goalBias: 0.9,
  },
  {
    name: 'speedrunner',
    memory: true,
    goal: true,
    ending: 'refuse',
    mustFinish: true,
    steps: 1600,
    reload: 0.01,
    goalBias: 1,
  },
  {
    name: 'duelist in the House',
    memory: true,
    goal: true,
    duelist: true,
    ending: 'refuse',
    inHouse: true,
    steps: 1400,
    reload: 0.05,
    goalBias: 0.6,
  },
  {
    name: 'forgetful fighter',
    memory: true,
    forgetsInCombat: true,
    goal: true,
    duelist: true,
    ending: 'refuse',
    inHouse: true,
    steps: 700,
    reload: 0.15,
    goalBias: 0.8,
  },
  {
    name: 'chaotic masher',
    memory: false,
    steps: 1000,
    reload: 0.08,
    goalBias: 0,
  },
  {
    name: 'interrupted saver',
    memory: true,
    goal: true,
    ending: 'attend',
    steps: 900,
    reload: 0.2,
    checkpoints: true,
    goalBias: 0.5,
  },
]
const SEEDS = Number(process.env.MEMORY_PLAYTEST_SEEDS || 6)
// Hands any persona's last save to a goal-directed player: a save that can no
// longer reach both verdicts is a softlock even if a button is still lit.
const RESCUER = {
  name: 'rescuer',
  memory: true,
  goal: true,
  ending: 'attend',
  steps: 1800,
  reload: 0,
  goalBias: 1,
}

async function play(persona, random, world, label) {
  let steps = 0
  let reloads = 0
  for (; steps < persona.steps && !goalDone(world, persona); steps++) {
    await settle()
    let actions = legalActions(world, persona)
    if (!actions.some((action) => !RETREATS.has(action.name))) {
      await flushTimers()
      actions = legalActions(world, persona)
    }
    assert.ok(
      actions.some((action) => !RETREATS.has(action.name)),
      `${label} step ${steps}: no forward action in ${world.activeReality}/${world.darkHouseOpen ? 'House ' + world.darkHouse.current : world.dark.phase} (${world.dark.status})`,
    )
    let action =
      persona.goal && random() < persona.goalBias
        ? goalAction(world, persona, actions)
        : null
    if (!action) {
      // Wandering players rarely retreat: a quarter of the usual weight.
      const forward = actions.filter((item) => !RETREATS.has(item.name))
      const pool = random() < 0.95 ? forward : actions
      action = pool[Math.floor(random() * pool.length)]
    }
    await action.run()
    await settle()
    if (random() < 0.85) await flushTimers()
    invariants(world, `${label} step ${steps} after ${action.name}`)
    if (random() < persona.reload) {
      const settled = tab.pendingTimers.length === 0
      const before = durable(world)
      const outcome = world.state.combat?.state.outcome ?? null
      const duelReturn = world.dark.duelReturn
      world = await openPage()
      reloads++
      const after = durable(world)
      invariants(world, `${label} step ${steps} reload after ${action.name}`)
      if (settled)
        assert.deepEqual(
          after,
          before,
          `${label} step ${steps}: reload changed durable progress after ${action.name}`,
        )
      else {
        // Interrupted animation: an already-paid pair may settle on reload,
        // but nothing earned may vanish and nothing may be refunded.
        for (const key of before.dark.revealed)
          assert.ok(
            after.dark.revealed.includes(key),
            `${label} step ${steps}: interrupted reload lost mirrored ${key}`,
          )
        for (const key of before.dark.matched)
          assert.ok(
            after.dark.matched.includes(key),
            `${label} step ${steps}: interrupted reload unmatched ${key}`,
          )
        for (const field of [
          'player',
          'sceneChoices',
          'sealInspections',
          'duels',
          'completed',
          'attempts',
          'waveIndex',
        ])
          assert.deepEqual(
            after.dark[field],
            before.dark[field],
            `${label} step ${steps}: interrupted reload changed Dark ${field} after ${action.name}`,
          )
        assert.deepEqual(after.house, before.house)
        assert.deepEqual(after.reality, before.reality)
        assert.equal(after.briar.lanterns, before.briar.lanterns)
        assert.equal(after.briar.wildflowers, before.briar.wildflowers)
        if (before.briar.room === 'memory' && outcome === 'defeat')
          assert.equal(
            after.briar.room,
            duelReturn ?? 'map',
            `${label} step ${steps}: an interrupted lost bout must return where it began`,
          )
        else
          assert.equal(
            after.briar.room,
            before.briar.room,
            `${label} step ${steps}: interrupted reload moved the Briar traveller`,
          )
      }
    }
    if (persona.checkpoints && random() < 0.05) {
      await flushTimers()
      assert.equal(world.saveCheckpoint(0, true), true)
      const saved = durable(world)
      await action.run()
      await flushTimers()
      assert.equal(world.loadCheckpoint(0), true)
      await settle()
      assert.deepEqual(
        durable(world),
        saved,
        `${label} step ${steps}: checkpoint restore changed durable progress`,
      )
    }
  }
  return { world, steps, reloads }
}

const findings = []
const summaries = []
for (const persona of PERSONAS)
  for (let seed = 1; seed <= SEEDS; seed++) {
    tab.storage.clear()
    const random = seeded(seed * 104729 + persona.name.length)
    Math.random = random
    persona.random = random
    const label = `${persona.name}#${seed}`
    try {
      tab.storage.set(
        'memoryDungeonBriarCampV1',
        JSON.stringify(worldOneFinale(random, persona.inHouse)),
      )
      let world = await openPage()
      BASE.lanterns = world.state.lanterns
      BASE.wildflowers = world.state.wildflowers
      assert.ok(
        world.canEnterDarkBriar,
        `${label}: World One finale unlocks e02`,
      )
      const run = await play(persona, random, world, label)
      world = run.world
      if (persona.mustFinish)
        assert.ok(
          goalDone(world, persona),
          `${label}: a goal-directed player must finish the reflection and leave the House (completed ${world.dark.completed}, verdict ${world.darkHouse.ending}, at ${world.darkHouse.current})`,
        )
      const summary = {
        persona: persona.name,
        seed,
        steps: run.steps,
        reloads: run.reloads,
        completed: world.dark.completed,
        ending: world.darkHouse.ending,
        duels: world.dark.duels.length,
        encounters: Object.keys(world.dark.sceneChoices).length,
      }
      if (!goalDone(world)) {
        RESCUER.random = random
        const rescue = await play(
          RESCUER,
          random,
          await openPage(),
          `${label} rescue`,
        )
        assert.ok(
          goalDone(rescue.world),
          `${label}: the last save cannot be finished (completed ${rescue.world.dark.completed}, verdict ${rescue.world.darkHouse.ending}, at ${rescue.world.darkHouse.current})`,
        )
        summary.rescueSteps = rescue.steps
        summary.ending ??= rescue.world.darkHouse.ending
      }
      summaries.push(summary)
    } catch (error) {
      if (process.env.MEMORY_PLAYTEST_VERBOSE) console.error(error.message)
      findings.push(error.message.split('\n')[0])
    }
  }

if (process.env.MEMORY_PLAYTEST_VERBOSE) console.table(summaries)
assert.deepEqual(findings, [], 'adversarial Dark Briar playtest findings')
const endings = new Set(summaries.map((run) => run.ending).filter(Boolean))
assert.deepEqual(
  [...endings].sort(),
  ['commons', 'return'],
  'seeded players reach both mirrored House verdicts',
)
assert.ok(
  summaries.some((run) => run.duels === 3 && run.encounters >= 60),
  'a completionist wins all three bouts and answers all sixty encounters',
)
console.log(
  `Memory Dungeon Dark Briar adversarial playtest: ${summaries.length} seeded runs, ` +
    `${summaries.reduce((total, run) => total + run.steps + (run.rescueSteps ?? 0), 0)} actions, ` +
    `${summaries.reduce((total, run) => total + run.reloads, 0)} reloads, ` +
    `${summaries.filter((run) => run.completed).length} reflections completed, verdicts ${[...endings].sort().join('/')}; 0 softlocks or save drifts`,
)
