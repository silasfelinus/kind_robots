import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  K8_ANIMALS,
  K8_PROFILE_FIELDS,
  k8Artwork,
  k8RiskParams,
  type K8Snapshot,
} from '../k8Wildlife'

assert.equal(K8_ANIMALS.length, 11)
for (const [level, animal] of K8_ANIMALS.entries()) {
  assert.match(animal.file, new RegExp('^' + String(level).padStart(2, '0')))
  assert.ok(k8Artwork(level).endsWith(animal.file))
  assert.ok(k8Artwork(level, 'tablet/').includes('/tablet/'))
  assert.ok(k8Artwork(level, 'mobile/').includes('/mobile/'))
}

const fields = K8_PROFILE_FIELDS.filter(
  (field) => field !== 'maxDeploymentPercent',
)
const makePreset = (factor: number) =>
  Object.fromEntries(fields.map((field) => [field, factor])) as
    K8Snapshot['presets'][string]
const presets = {
  conservative: makePreset(10),
  moderate: makePreset(20),
  aggressive: makePreset(30),
  maximum: makePreset(40),
}
assert.equal(k8RiskParams(0, presets), null)
assert.equal(k8RiskParams(11, presets), null)
for (let level = 1; level <= 10; level++) {
  assert.equal(k8RiskParams(level, presets)?.maxDeploymentPercent, level * 10)
}
assert.equal(k8RiskParams(2, presets)?.kFactor, 13.333)
assert.equal(k8RiskParams(2, presets)?.maxCycleBuys, 13)
assert.equal(
  k8RiskParams(2, presets, { '2': { maxDeploymentPercent: 25 } })
    ?.maxDeploymentPercent,
  25,
)

const read = (path: string) => readFileSync(path, 'utf8')
const bridge = read('server/utils/k8Bridge.ts')
const getter = read('server/api/k8/fund.get.ts')
const setter = read('server/api/k8/fund/risk.put.ts')
const profiles = read('server/api/k8/fund/levels.put.ts')
const stage = read('components/art/k8-wildlife-launcher.vue')
assert.match(bridge, /requireHumanApiUser\(event\)/)
assert.match(bridge, /isSuperkateServicesViewer\(auth\.user, auth\.isAdmin\)/)
assert.match(bridge, /auth\.isAdmin/)
assert.match(bridge, /K8_BRIDGE_TOKEN/)
assert.match(bridge, /critical-mass\.acrocatranch\.com/)
assert.match(bridge, /'x-k8-bridge-token'/)
assert.match(getter, /requireK8Viewer\(event\)/)
assert.match(setter, /requireK8Viewer\(event, true\)/)
assert.match(setter, /fingerprint/)
assert.match(profiles, /requireK8Viewer\(event, true\)/)
assert.match(profiles, /K8_PROFILE_FIELDS/)
assert.match(stage, /type="range"/)
assert.match(stage, /v-for="\(item, index\) in K8_ANIMALS"/)
assert.match(stage, /confirmOpen/)
assert.match(stage, /k8\.saveProfile/)
assert.doesNotMatch(stage, /Open my Wildlife portfolio/)
