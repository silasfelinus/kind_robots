import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CAPES_STYLE_CRITERIA,
  CAPES_STYLE_DESIGNER,
  CAPES_STYLE_LANES,
  CAPES_STYLE_SUBJECTS,
  capesStyleCellKey,
  capesStyleLaneFromModel,
} from '../capesStyleCheck'

assert.equal(CAPES_STYLE_SUBJECTS.length, 6)
assert.equal(CAPES_STYLE_LANES.length, 6)
assert.equal(CAPES_STYLE_CRITERIA.length, 4)
assert.equal(
  new Set(CAPES_STYLE_SUBJECTS.map((subject) => subject.seed)).size,
  6,
)
assert.equal(
  new Set(CAPES_STYLE_SUBJECTS.map((subject) => subject.key)).size,
  6,
)
assert.equal(new Set(CAPES_STYLE_LANES.map((lane) => lane.key)).size, 6)
assert.equal(
  new Set(
    CAPES_STYLE_SUBJECTS.flatMap((subject) =>
      CAPES_STYLE_LANES.map((lane) => capesStyleCellKey(subject.key, lane.key)),
    ),
  ).size,
  36,
)
assert.ok(CAPES_STYLE_DESIGNER.includes('Capes Style Check'))
assert.deepEqual(
  new Set(CAPES_STYLE_LANES.map((lane) => lane.key)),
  new Set([
    'krea2',
    'arthemy',
    'nova-comic',
    'illustrij',
    'dreamshaper',
    'unstable',
  ]),
)
for (const lane of CAPES_STYLE_LANES) {
  assert.ok(
    !/furry|pony|flux/i.test(lane.model),
    lane.key + ' is an excluded model',
  )
  assert.equal(
    capesStyleLaneFromModel('models/' + lane.model + '.safetensors'),
    lane.key,
  )
}
assert.equal(capesStyleLaneFromModel('Flux2-Klein.gguf'), null)
assert.equal(capesStyleLaneFromModel('furrytoonmix_xlV3.safetensors'), null)
assert.equal(capesStyleLaneFromModel('ponyFaetality_v11.safetensors'), null)

const page = readFileSync(
  new URL('../../pages/admin/capes.vue', import.meta.url),
  'utf8',
)
const api = readFileSync(
  new URL('../../server/api/capes/style-check.get.ts', import.meta.url),
  'utf8',
)
const store = readFileSync(
  new URL('../../stores/capesStyleCheckStore.ts', import.meta.url),
  'utf8',
)
const channel = readFileSync(
  new URL('../../content/channels/admin/capes.md', import.meta.url),
  'utf8',
)
assert.match(page, /data-testid="capes-style-check"/)
assert.match(page, /data-testid="'capes-lane-' \+ lane.key"/)
assert.match(page, /store\.scoreFor/)
assert.match(page, /store\.noteFor/)
assert.match(page, /store\.imageFor/)
assert.match(api, /requireMachineUser/)
assert.match(api, /auth\.isAdmin/)
assert.match(api, /payload: \{ contains: CAPES_STYLE_DESIGNER \}/)
assert.match(store, /loadJobImage/)
assert.match(store, /localStorage\.setItem/)
assert.match(channel, /route: \/admin\/capes/)
assert.match(channel, /requiredRole: ADMIN/)

console.log(
  'Capes style gate: 36 slots, only approved models, private live jobs and scoring: OK',
)
