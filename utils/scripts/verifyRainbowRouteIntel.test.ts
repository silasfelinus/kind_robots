import assert from 'node:assert/strict'
import {
  rainbowRouteIntel,
  rainbowAlternateRouteLogbook,
  readRainbowSave,
  type RainbowSave,
} from '../arcade/games/rainbowLoadouts'
import {
  createRainbowPrincessPreview,
  isRainbowCheckpoint,
} from '../arcade/games/rainbowPrincessPreview'
import { NURSERY } from '../arcade/games/rainbowLanternNursery'

// Route discovery is earned from the saved in-flight decisions, not the
// highest Act reached. A fresh slot must not advertise secret passages.
const fresh = rainbowRouteIntel(null)
assert.deepEqual(
  fresh.map((route) => route.act),
  [3, 5, 6],
)
assert.ok(fresh.every((route) => !route.discovered))
assert.ok(fresh.every((route) => route.label === 'Route undiscovered'))

const save = {
  checkpoint: {
    act: 8,
    trenchRoute: 'vault',
    routeSettled: true,
    wreckRoute: 'armory',
    wreckSettled: false,
    reefRoute: 'cache',
    reefSettled: true,
  },
} as RainbowSave
const routes = rainbowRouteIntel(save)
assert.deepEqual(
  routes.map((route) => route.discovered),
  [true, false, true],
)
assert.deepEqual(
  routes.map((route) => route.label),
  ['Vault passage', 'Route undiscovered', 'Cache passage'],
)
save.checkpoint.trenchRoute = 'safe'
save.checkpoint.wreckRoute = 'depot'
save.checkpoint.wreckSettled = true
save.checkpoint.reefRoute = 'relay'
assert.deepEqual(
  rainbowRouteIntel(save).map((route) => route.label),
  ['Safe passage', 'Depot passage', 'Relay passage'],
)
const alternateFresh = rainbowAlternateRouteLogbook(null)
assert.deepEqual(
  alternateFresh.map((route) => route.id),
  ['X1', 'X2', 'X3', 'X4'],
)
assert.ok(alternateFresh.every((route) => !route.discovered))
assert.ok(alternateFresh.every((route) => route.label === 'ROUTE UNDISCOVERED'))
const detourSave = {
  checkpoint: { act: 8, alternateRoutesSeen: 0b0101 },
} as RainbowSave
assert.deepEqual(
  rainbowAlternateRouteLogbook(detourSave).map((route) => route.discovered),
  [true, false, true, false],
)
detourSave.checkpoint.alternateRoutesSeen = 0b1111
assert.ok(
  rainbowAlternateRouteLogbook(detourSave).every((route) => route.discovered),
)
detourSave.checkpoint.alternateRoutesSeen = 0
assert.ok(
  rainbowAlternateRouteLogbook(detourSave).every((route) => !route.discovered),
)

// The route map must not falsely attribute old saved Act reach to a detour.
// An older save IN an alternate flight still supplies direct, earned proof.
const legacy = {
  checkpoint: {
    act: 8,
    nurseryFrame: 240,
    cometFrame: 960,
    lighthouseFrame: 240,
    shoalFrame: 240,
  },
} as RainbowSave
assert.ok(
  rainbowAlternateRouteLogbook(legacy).every((route) => route.discovered),
)
legacy.checkpoint.nurseryFrame = undefined
legacy.checkpoint.cometFrame = undefined
legacy.checkpoint.lighthouseFrame = undefined
legacy.checkpoint.shoalFrame = undefined
assert.ok(
  rainbowAlternateRouteLogbook(legacy).every((route) => !route.discovered),
)
legacy.checkpoint.freedChoir = true
legacy.checkpoint.cadetsHome = true
assert.deepEqual(
  rainbowAlternateRouteLogbook(legacy).map((route) => route.discovered),
  [true, true, false, false],
)

const checkpoint = {
  act: 8 as const,
  frame: 0,
  score: 0,
  rescuedStation: false,
  rescuedNemi: false,
  trenchRoute: null,
  routeSettled: false,
  rescuedCourier: false,
  wreckRoute: null,
  wreckSettled: false,
  podsSaved: 0,
  reefRoute: null,
  reefSettled: false,
  pylonsDown: 0,
  rescuedNavigator: false,
  captivesFreed: 0,
  schoolBonuses: 0,
  alternateRoutesSeen: 15,
}
const current = {
  v: 1 as const,
  difficulty: 'normal' as const,
  checkpoint,
  guardians: {},
  medals: {},
}
assert.ok(
  readRainbowSave(current),
  'four genuine past detours can be remembered',
)
assert.equal(readRainbowSave(current)?.checkpoint.alternateRoutesSeen, 15)
// Completion is distinct from entry. Exhaust every independent clear mask,
// including all possible combinations of unfinished but already charted Acts.
for (let completed = 0; completed < 16; completed++) {
  const decoded = readRainbowSave({
    ...current,
    checkpoint: { ...checkpoint, alternateRoutesCleared: completed },
  })
  assert.ok(decoded, `X1-X4 completion combination ${completed} roundtrips`)
  assert.equal(decoded?.checkpoint.alternateRoutesCleared, completed)
  const logbook = rainbowAlternateRouteLogbook(decoded)
  assert.deepEqual(
    logbook.map((route) => route.completed),
    [1, 2, 4, 8].map((bit) => (completed & bit) !== 0),
  )
  assert.deepEqual(
    logbook.map((route) => route.label),
    [1, 2, 4, 8].map((bit) =>
      completed & bit ? 'ROUTE CLEARED' : 'ROUTE FLOWN',
    ),
  )
  assert.ok(
    rainbowAlternateRouteLogbook(null).every((route) => !route.completed),
    'another empty slot cannot inherit detour clears',
  )
}
assert.ok(
  rainbowAlternateRouteLogbook(readRainbowSave(current)).every(
    (route) => route.discovered && !route.completed,
  ),
  'legacy saves keep discoveries but do not claim unrecorded completions',
)
for (const completed of [-1, 16, 2.5, Number.NaN])
  assert.equal(
    readRainbowSave({
      ...current,
      checkpoint: { ...checkpoint, alternateRoutesCleared: completed },
    }),
    null,
    'invalid completion masks must fail closed',
  )
for (const bit of [1, 2, 4, 8]) {
  assert.equal(
    readRainbowSave({
      ...current,
      checkpoint: {
        ...checkpoint,
        alternateRoutesSeen: 15 ^ bit,
        alternateRoutesCleared: bit,
      },
    }),
    null,
    'a detour cannot be completed unless it was genuinely discovered',
  )
  assert.equal(
    readRainbowSave({
      ...current,
      checkpoint: { ...checkpoint, alternateRoutesSeen: undefined, alternateRoutesCleared: bit },
    }),
    null,
    'missing history cannot support a claimed completion',
  )
}
for (const [act, cleared] of [
  [3, 1],
  [4, 2],
  [6, 4],
  [7, 8],
] as const)
  assert.equal(
    readRainbowSave({
      ...current,
      checkpoint: { ...checkpoint, act, alternateRoutesCleared: cleared },
    }),
    null,
    `Act ${act} cannot claim a completion before finishing X-route ${cleared}`,
  )

assert.deepEqual(
  rainbowAlternateRouteLogbook(readRainbowSave(current)).map(
    (route) => route.discovered,
  ),
  [true, true, true, true],
)
for (const mask of [-1, 16, 1.5, Number.NaN])
  assert.equal(
    readRainbowSave({
      ...current,
      checkpoint: { ...checkpoint, alternateRoutesSeen: mask },
    }),
    null,
    'a forged detour mask must fail save decoding',
  )
for (const [act, mask] of [
  [2, 1],
  [3, 2],
  [5, 4],
  [6, 8],
] as const)
  assert.equal(
    readRainbowSave({
      ...current,
      checkpoint: { ...checkpoint, act, alternateRoutesSeen: mask },
    }),
    null,
    `X-route ${mask} cannot precede its actual origin Act ${act}`,
  )
assert.ok(
  readRainbowSave({
    ...current,
    checkpoint: { ...checkpoint, alternateRoutesSeen: undefined },
  }),
  'legacy saves without the detour mask remain readable',
)
assert.equal(
  readRainbowSave({
    ...current,
    checkpoint: { ...checkpoint, alternateRoutesSeen: undefined },
  })?.checkpoint.alternateRoutesSeen,
  undefined,
  'a legacy slot must not invent branch history',
)
// Exercise the actual cabinet checkpoint writer with every local crew size:
// entering X1 must survive a new section save and a decoded reload.
const x1Entry = readRainbowSave(
  {
    ...current,
    checkpoint: {
      ...checkpoint,
      act: 3,
      frame: 20000,
      rescuedNemi: true,
      trenchRoute: 'safe',
      routeSettled: true,
      nurseryStartedAt: 20000,
      nurseryFrame: 0,
      nurseryHits: 0,
      nurseryChoirMask: 0,
      nurseryGuardianOutcome: 'waiting',
      alternateRoutesSeen: 1,
    },
  },
  isRainbowCheckpoint,
)
assert.ok(x1Entry, 'an earned X1 entrance is a valid campaign checkpoint')
const idle = {
  held: {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    start: false,
  },
  pressed: {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    start: false,
  },
}
for (const seats of [1, 2, 3, 4]) {
  const game = createRainbowPrincessPreview({
    rng: () => 0.5,
    sound: { play: () => {} },
    hiScore: 0,
    players: seats,
    demo: false,
    resume: x1Entry!,
  })
  const crew = Array.from({ length: seats }, () => idle)
  assert.equal(game.snapshot.resumeMenu, 0)
  for (let frame = 0; frame < 21; frame++) game.update(idle, crew)
  const confirm = { ...idle, pressed: { ...idle.pressed, a: true } }
  game.update(confirm, [confirm, ...crew.slice(1)])
  assert.equal(game.snapshot.resumeMenu, null)
  assert.equal(game.snapshot.act, 'X1')
  for (let frame = 0; frame < NURSERY.openingEnds + 3; frame++)
    game.update(idle, crew)
  const afterSection = readRainbowSave(game.save, isRainbowCheckpoint)
  assert.equal(
    afterSection?.checkpoint.alternateRoutesSeen,
    1,
    `X1 entry must persist to the next checkpoint for ${seats} local seats`,
  )
  assert.equal(rainbowAlternateRouteLogbook(afterSection)[0]?.discovered, true)
}

// Exhaust every discovery combination, not just the all-or-nothing cases.
// Saves must preserve exactly the branches earned in this slot, and reading
// another slot must not contaminate its independent exploration history.
for (let mask = 0; mask < 16; mask++) {
  const decoded = readRainbowSave({
    ...current,
    checkpoint: { ...checkpoint, alternateRoutesSeen: mask },
  })
  assert.ok(decoded, `discovery mask ${mask} must roundtrip`)
  assert.equal(decoded?.checkpoint.alternateRoutesSeen, mask)
  assert.deepEqual(
    rainbowAlternateRouteLogbook(decoded).map((route) => route.discovered),
    [1, 2, 4, 8].map((bit) => (mask & bit) !== 0),
    `discovery mask ${mask} must unlock only its earned detours`,
  )
  assert.ok(
    rainbowAlternateRouteLogbook(null).every((route) => !route.discovered),
    'a separate empty save slot must remain undiscovered',
  )
}
for (const [act, forbiddenMask] of [
  [1, 15],
  [2, 15],
  [3, 14],
  [4, 12],
  [5, 12],
  [6, 8],
] as const) {
  assert.equal(
    readRainbowSave({
      ...current,
      checkpoint: { ...checkpoint, act, alternateRoutesSeen: forbiddenMask },
    }),
    null,
    `Act ${act} must reject premature detour discoveries`,
  )
}

console.log('Rainbow route intel: passed')
