import assert from 'node:assert/strict'
import {
  rainbowRouteIntel,
  type RainbowSave,
} from '../arcade/games/rainbowLoadouts'

// Route discovery is earned from the saved in-flight decisions, not the
// highest Act reached. A fresh slot must not advertise secret passages.
const fresh = rainbowRouteIntel(null)
assert.deepEqual(fresh.map((route) => route.act), [3, 5, 6])
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
assert.deepEqual(routes.map((route) => route.discovered), [
  true,
  false,
  true,
])
assert.deepEqual(routes.map((route) => route.label), [
  'Vault passage',
  'Route undiscovered',
  'Cache passage',
])
save.checkpoint.trenchRoute = 'safe'
save.checkpoint.wreckRoute = 'depot'
save.checkpoint.wreckSettled = true
save.checkpoint.reefRoute = 'relay'
assert.deepEqual(rainbowRouteIntel(save).map((route) => route.label), [
  'Safe passage',
  'Depot passage',
  'Relay passage',
])
console.log('Rainbow route intel: passed')
