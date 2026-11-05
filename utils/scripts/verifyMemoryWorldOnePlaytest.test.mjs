import assert from 'node:assert/strict'
import {
  flushTimers as flushTab,
  importMemoryWorld,
  installBrowser,
  openPage as openTab,
  seeded,
  settle,
} from './memoryWorldPlaytestKit.mjs'

// Adversarial World One playtest: seeded personas drive the real Pinia Memory
// World store (Briar Marches overworld, its encounters and the 36-room House)
// through every UI-reachable action, interrupt timers, reload the page and
// swap manual checkpoints. Each step must leave a legal next action, finite
// resources, and a saved game that restores to the same expedition.
const M = await importMemoryWorld([
  "export { createPinia, setActivePinia } from 'pinia'",
  "export { useMemoryWorldStore } from '@/stores/memoryWorldStore'",
  "export { BRIAR_SITES, BRIAR_DUNGEON, BRIAR_GATE, briarConnected, restoreBriarSave } from '@/utils/memoryDungeonWorld'",
  "export { BRIAR_SCENES, canChooseBriarScene } from '@/utils/memoryDungeon/scenes'",
  "export { BRIAR_CROSS_MAP_PUZZLES, BRIAR_REVEAL_WAVES } from '@/utils/memoryDungeonWaves'",
  "export { HOUSE_ROOMS, restoreHouseProgress } from '@/utils/memoryDungeon/house'",
  "export { COMBAT_ROOMS } from '@/utils/memoryDungeon/rooms'",
  "export { WEAPONS } from '@/utils/memoryDungeon/combat'",
  "export { MINEFIELD_SITE } from '@/utils/memoryDungeon/minefieldRun'",
])

// Browser globals the store owns: timers are queued so a persona can reload
// mid-animation, and storage survives reloads like a real tab.
const tab = installBrowser()
const flushTimers = () => flushTab(tab)
const openPage = () => openTab(M, tab)

/** Durable progress a reload or checkpoint must not lose or invent. */
function durable(save) {
  const house = save.house
  return {
    room: save.room === 'memory' ? 'memory' : save.room,
    roomId: save.roomId,
    player: save.player,
    waveIndex: save.waveIndex,
    revealed: [...save.revealed].sort(),
    visited: [...save.visited].sort(),
    sceneChoices: { ...save.sceneChoices },
    lanterns: save.lanterns,
    wildflowers: save.wildflowers,
    relics: [...save.relics].sort(),
    chestClaims: [...save.chestClaims].sort(),
    completedEncounters: [...save.completedEncounters].sort(),
    puzzleSolved: save.puzzleSolved,
    gateOpened: save.gateOpened,
    house: house && {
      current: house.current,
      visited: [...house.visited].sort(),
      decisions: { ...house.decisions },
      ending: house.ending,
      endingLens: house.endingLens,
      wardenPassed: house.wardenPassed,
      chimeClaimed: house.chimeClaimed,
    },
  }
}

const SPECIAL = {
  dungeon: M.BRIAR_DUNGEON,
  sprite: '5,5',
  patrol: '7,3',
}

/** Every action a player could take from the current screen. */
function legalActions(world, persona) {
  const s = world.state
  const actions = []
  if (s.room === 'map') {
    if (s.wavePhase === 'matching') {
      if (world.turnLocked || world.loading) return actions
      if (!s.mapCards.length)
        return [{ name: 'retry-deck', run: () => world.prepareWave() }]
      const open = s.mapCards.filter((card) => !card.matched && !card.flipped)
      const first = s.mapCards.find((card) => card.flipped && !card.matched)
      if (persona.memory && first) {
        const partner = open.find((card) => card.pairId === first.pairId)
        if (partner)
          return [
            { name: 'map-pair', run: () => world.pickMapCard(partner.tile) },
          ]
      }
      for (const card of open)
        actions.push({
          name: 'map-card',
          run: () => world.pickMapCard(card.tile),
        })
      return actions
    }
    for (const key of s.revealed)
      if (key !== s.player && M.briarConnected(s.player, key, s.revealed))
        actions.push({ name: 'walk', key, run: () => world.walk(key) })
    const scene = M.BRIAR_SCENES[s.player]
    if (scene && s.visited.includes(s.player) && !s.sceneChoices[s.player])
      for (const choice of scene.choices)
        if (M.canChooseBriarScene(choice, s))
          actions.push({
            name: 'scene',
            run: () => world.chooseScene(choice.id),
          })
    const site = M.BRIAR_SITES[s.player]
    if (site?.kind === 'chest' && !s.chestClaims.includes(s.player))
      actions.push({ name: 'chest', run: () => world.claimChest() })
    if (s.player === '4,2' && s.wildflowers > 0)
      actions.push({ name: 'buy', run: () => world.buyLantern() })
    if (s.player === '2,7' && !s.puzzleSolved)
      for (const rune of ['leaf', 'sun'])
        actions.push({ name: 'rune', run: () => world.enterRune(rune) })
    for (const [kind, key] of Object.entries(SPECIAL))
      if (
        s.player === key &&
        (kind === 'dungeon' || !s.completedEncounters.includes(key))
      )
        actions.push({ name: kind, run: () => world.startEncounter(kind) })
    if (s.player === M.BRIAR_GATE && s.relics.includes('bramble-chime'))
      actions.push({ name: 'gate', run: () => world.openGate() })
    if (s.waveIndex < M.BRIAR_REVEAL_WAVES.length - 1)
      actions.push({ name: 'next-wave', run: () => world.nextWave() })
    if (s.waveIndex === 3)
      for (const key of Object.keys(M.BRIAR_CROSS_MAP_PUZZLES))
        actions.push({
          name: 'sigil',
          key,
          run: () => {
            world.examineCrossMapSigil(key)
            const sigilScene = M.BRIAR_SCENES[key]
            if (sigilScene && !world.state.sceneChoices[key])
              world.chooseScene(sigilScene.choices[0].id)
          },
        })
    return actions
  }
  if (s.room === 'house') {
    for (const door of world.houseAvailableDoors)
      actions.push({
        name: 'door',
        key: door,
        run: () => world.houseMove(door),
      })
    const room = M.HOUSE_ROOMS[s.house.current]
    if (!s.house.decisions[s.house.current])
      for (const choice of room.choices)
        if (world.canChooseHouse(choice.id))
          actions.push({
            name: 'house-choice',
            key: s.house.current + ':' + choice.id,
            run: () => world.chooseHouse(choice.id),
          })
    if (world.houseMayExit)
      actions.push({ name: 'exit-house', run: () => world.exitHouse() })
    return actions
  }
  if (s.room === 'memory') {
    if (world.turnLocked || world.loading) return actions
    if (world.roomComplete)
      return [{ name: 'finish', run: () => world.finishRoom() }]
    actions.push({ name: 'leave', run: () => world.leaveRoom() })
    const combat = s.combat
    if (combat) {
      const cards = combat.state.cards
      const cols = combat.state.cols
      const cell = (i) => ({ row: Math.floor(i / cols), col: i % cols })
      const live = cards
        .map((card, i) => ({ card, i }))
        .filter(({ card }) => card.pair !== null && !card.matched)
      if (persona.memory) {
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
    const open = s.cards.filter((card) => !card.matched && !card.flipped)
    const firstCard = s.cards.find((card) => card.flipped && !card.matched)
    if (persona.memory && firstCard) {
      const partner = open.find((card) => card.pairId === firstCard.pairId)
      if (partner)
        return [{ name: 'card-pair', run: () => world.pickCard(partner.id) }]
    }
    for (const card of open)
      actions.push({ name: 'card', run: () => world.pickCard(card.id) })
    if (s.lanterns > 0)
      actions.push({ name: 'peek', run: () => world.peekPair() })
    return actions
  }
  return actions
}

function invariants(world, label) {
  const s = world.state
  for (const field of ['lanterns', 'wildflowers', 'attempts'])
    assert.ok(
      Number.isSafeInteger(s[field]) && s[field] >= 0,
      `${label}: ${field} must stay a non-negative integer (got ${s[field]})`,
    )
  assert.ok(
    Number.isSafeInteger(s.hearts) && s.hearts >= 1 && s.hearts <= 3,
    `${label}: hearts must stay within 1..3 (got ${s.hearts})`,
  )
  assert.ok(
    s.revealed.includes(s.player) ||
      s.revealed.length === 0 ||
      s.player === '2,4',
    `${label}: player stands on revealed ground`,
  )
  if (s.house) {
    assert.ok(
      s.house.visited.includes(s.house.current),
      `${label}: House room is in its visit log`,
    )
    const restored = M.restoreHouseProgress(JSON.parse(JSON.stringify(s.house)))
    assert.deepEqual(
      durable({ ...s, house: restored }).house,
      durable(s).house,
      `${label}: House progress must survive its own save restoration`,
    )
  }
  const briar = M.restoreBriarSave(JSON.parse(JSON.stringify(s)))
  const a = durable(briar)
  const b = durable(s)
  delete a.room
  delete b.room
  delete a.roomId
  delete b.roomId
  assert.deepEqual(
    a,
    b,
    `${label}: Briar progress must survive its own save restoration`,
  )
}

// Regression pinned by this battery: the four cross-world seals are never
// revealed or walked onto, yet after the fourth round their scenes are answered
// from the sigil inspector. Those answers used to vanish on the next reload.
{
  const sealSave = {
    ...JSON.parse(JSON.stringify(M.restoreBriarSave(null))),
    waveIndex: 3,
    wavePhase: 'exploring',
    revealed: ['2,4'],
    visited: ['2,4'],
    sceneChoices: { '1,1': 'trace', '8,8': 'invented', '3,3': 'trace' },
  }
  const sealKeys = Object.keys(M.BRIAR_CROSS_MAP_PUZZLES)
  const sealAnswers = Object.fromEntries(
    sealKeys.map((key) => [key, M.BRIAR_SCENES[key].choices[1].id]),
  )
  assert.deepEqual(
    M.restoreBriarSave({ ...sealSave, sceneChoices: sealAnswers }).sceneChoices,
    sealAnswers,
    'all four inspected seal answers survive a reload',
  )
  assert.deepEqual(
    M.restoreBriarSave(sealSave).sceneChoices,
    { '1,1': 'trace' },
    'invented seal answers and unvisited ordinary sites stay rejected',
  )
  for (const early of [
    { waveIndex: 2, wavePhase: 'exploring' },
    { waveIndex: 3, wavePhase: 'matching' },
  ])
    assert.deepEqual(
      M.restoreBriarSave({ ...sealSave, ...early }).sceneChoices,
      {},
      'seal answers cannot be forged before the sigils are inspectable',
    )
}

const PERSONAS = [
  {
    name: 'completionist',
    memory: true,
    steps: 2500,
    prefer: [
      'scene',
      'house-choice',
      'chest',
      'rune',
      'sprite',
      'patrol',
      'dungeon',
      'finish',
      'door',
      'walk',
      'next-wave',
      'exit-house',
      'gate',
    ],
    reload: 0.03,
  },
  {
    name: 'speedrunner',
    memory: true,
    steps: 6000,
    mustFinish: true,
    prefer: [
      'gate',
      'finish',
      'house-choice',
      'door',
      'dungeon',
      'next-wave',
      'walk',
    ],
    reload: 0.01,
  },
  {
    name: 'chaotic masher',
    memory: false,
    steps: 1500,
    prefer: [],
    reload: 0.08,
  },
  {
    name: 'interrupted saver',
    memory: true,
    steps: 1500,
    prefer: [],
    reload: 0.2,
    checkpoints: true,
  },
  {
    name: 'forgetful fighter',
    memory: false,
    steps: 2500,
    prefer: ['sprite', 'patrol', 'dungeon', 'house-choice', 'finish'],
    reload: 0.05,
  },
]
const SEEDS = Number(process.env.MEMORY_PLAYTEST_SEEDS || 4)

const findings = []
const summaries = []
for (const persona of PERSONAS)
  for (let seed = 1; seed <= SEEDS; seed++) {
    tab.storage.clear()
    const random = seeded(seed * 7919 + persona.name.length)
    Math.random = random
    let world = await openPage()
    const label = () => `${persona.name}#${seed}`
    let steps = 0
    let reloads = 0
    try {
      for (; steps < persona.steps && !world.state.gateOpened; steps++) {
        await settle()
        let actions = legalActions(world, persona)
        if (!actions.length) {
          await flushTimers()
          actions = legalActions(world, persona)
        }
        assert.ok(
          actions.length,
          `${label()} step ${steps}: no legal action in ${world.state.room} (${world.state.status})`,
        )
        const preferred = persona.prefer
          .map((name) => actions.filter((action) => action.name === name))
          .find((list) => list.length)
        const pool = preferred && random() < 0.75 ? preferred : actions
        const action = pool[Math.floor(random() * pool.length)]
        await action.run()
        await settle()
        if (random() < 0.85) await flushTimers()
        invariants(world, `${label()} step ${steps} after ${action.name}`)
        if (random() < persona.reload) {
          const settled = tab.pendingTimers.length === 0
          const before = durable(world.state)
          world = await openPage()
          reloads++
          const after = durable(world.state)
          if (settled)
            assert.deepEqual(
              after,
              before,
              `${label()} step ${steps}: reload changed durable progress after ${action.name}`,
            )
          else {
            // Interrupted animation: a paid pair may settle on reload, but
            // nothing earned may vanish and no resource may be refunded.
            for (const key of before.revealed)
              assert.ok(
                after.revealed.includes(key),
                `${label()} step ${steps}: interrupted reload lost revealed ${key}`,
              )
            for (const field of [
              'player',
              'sceneChoices',
              'lanterns',
              'wildflowers',
              'relics',
              'chestClaims',
              'gateOpened',
            ])
              assert.deepEqual(
                after[field],
                before[field],
                `${label()} step ${steps}: interrupted reload changed ${field} after ${action.name}`,
              )
            if (before.house)
              assert.deepEqual(
                after.house,
                before.house,
                `${label()} step ${steps}: interrupted reload changed House after ${action.name}`,
              )
          }
        }
        if (persona.checkpoints && random() < 0.05) {
          await flushTimers()
          assert.equal(world.saveCheckpoint(0, true), true)
          const saved = durable(world.state)
          await action.run()
          await flushTimers()
          assert.equal(world.loadCheckpoint(0), true)
          await settle()
          assert.deepEqual(
            durable(world.state),
            saved,
            `${label()} step ${steps}: checkpoint restore changed durable progress`,
          )
        }
      }
      if (persona.mustFinish)
        assert.ok(
          world.state.gateOpened,
          `${label()}: a goal-directed player must open the World One gate`,
        )
      summaries.push({
        persona: persona.name,
        seed,
        steps,
        reloads,
        gate: world.state.gateOpened,
        ending: world.state.house?.ending ?? null,
      })
    } catch (error) {
      findings.push(error.message.split('\n')[0])
    }
  }

assert.deepEqual(findings, [], 'adversarial World One playtest findings')
const endings = new Set(summaries.map((run) => run.ending).filter(Boolean))
assert.deepEqual(
  [...endings].sort(),
  ['break', 'release', 'renew'],
  'seeded players reach all three Hearth endings',
)
console.log(
  `Memory Dungeon World One adversarial playtest: ${summaries.length} seeded runs, ` +
    `${summaries.reduce((total, run) => total + run.steps, 0)} actions, ` +
    `${summaries.reduce((total, run) => total + run.reloads, 0)} reloads, ` +
    `${summaries.filter((run) => run.gate).length} gate openings, endings ${[...endings].sort().join('/')}; 0 softlocks or save drifts`,
)
