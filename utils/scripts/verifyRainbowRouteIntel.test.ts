import assert from 'node:assert/strict'
import {
  rainbowRouteIntel,
  rainbowAlternateRouteLogbook,
  readRainbowSave,
  type RainbowSave,
} from '../arcade/games/rainbowLoadouts'

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
assert.ok(
  alternateFresh.every((route) => route.label === 'ROUTE UNDISCOVERED'),
)
const detourSave = {
  checkpoint: { act: 8, alternateRoutesSeen: 0b0101 },
} as RainbowSave
assert.deepEqual(
  rainbowAlternateRouteLogbook(detourSave).map((route) => route.discovered),
  [true, false, true, false],
)
detourSave.checkpoint.alternateRoutesSeen = 0b1111
assert.ok(rainbowAlternateRouteLogbook(detourSave).every((route) => route.discovered))
detourSave.checkpoint.alternateRoutesSeen = 0
assert.ok(rainbowAlternateRouteLogbook(detourSave).every((route) => !route.discovered))

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
assert.ok(rainbowAlternateRouteLogbook(legacy).every((route) => route.discovered))
legacy.checkpoint.nurseryFrame = undefined
legacy.checkpoint.cometFrame = undefined
legacy.checkpoint.lighthouseFrame = undefined
legacy.checkpoint.shoalFrame = undefined
assert.ok(rainbowAlternateRouteLogbook(legacy).every((route) => !route.discovered))
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
assert.ok(readRainbowSave(current), 'four genuine past detours can be remembered')
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
console.log('Rainbow route intel: passed')
